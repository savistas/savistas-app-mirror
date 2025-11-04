/**
 * Error Revision Service
 * Handles all business logic for manual error uploads and analysis
 */

import { supabase } from '@/integrations/supabase/client';
import {
  ErrorRevisionFormData,
  ErrorRevisionUploadData,
  WebhookPayload,
  ErrorRevision,
} from '@/types/errorRevision';

const WEBHOOK_URL = 'https://n8n.srv932562.hstgr.cloud/webhook/error-analysis';

export const errorRevisionService = {
  /**
   * Upload d'une photo d'erreur dans le bucket 'error_revision'
   */
  async uploadErrorImage(userId: string, errorId: string, file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${errorId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('error_revision')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading error image:', uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('error_revision').getPublicUrl(fileName);

    return publicUrl;
  },


  /**
   * Upload d'un document de cours dans le bucket 'courses'
   * et création de l'entrée dans la table 'documents'
   */
  async uploadCourseDocument(
    userId: string,
    file: File,
    courseName: string,
    subject: string
  ): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${userId}/error_revision/${timestamp}_${sanitizedFileName}`;

    // Upload dans Storage
    const { error: uploadError } = await supabase.storage
      .from('courses')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading course document:', uploadError);
      throw uploadError;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('courses').getPublicUrl(fileName);

    // Insertion dans table 'documents' avec type='error_revision'
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: userId,
        name: courseName,
        subject: subject,
        file_path: publicUrl,
        file_type: file.type,
        file_size: file.size,
        type: 'error_revision', // 🔥 Type spécial pour ces documents
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error creating document record:', dbError);
      // Rollback: delete uploaded file
      await supabase.storage.from('courses').remove([fileName]);
      throw dbError;
    }

    return document.id;
  },

  /**
   * Upload de plusieurs documents de cours
   */
  async uploadCourseDocuments(
    userId: string,
    files: File[],
    courseName: string,
    subject: string
  ): Promise<string[]> {
    const documentIds: string[] = [];
    const uploadedFiles: string[] = [];

    try {
      for (const file of files) {
        const documentId = await this.uploadCourseDocument(userId, file, courseName, subject);
        documentIds.push(documentId);
      }
      return documentIds;
    } catch (error) {
      // En cas d'erreur, nettoyer les documents déjà uploadés
      console.error('Error uploading multiple documents, rolling back:', error);

      // Supprimer les documents créés
      if (documentIds.length > 0) {
        await supabase
          .from('documents')
          .delete()
          .in('id', documentIds);
      }

      throw error;
    }
  },

  /**
   * Création de l'entrée dans error_single_revision (UNE erreur par row)
   */
  async createErrorRevision(
    userId: string,
    data: ErrorRevisionUploadData
  ): Promise<string> {
    const { data: revision, error } = await supabase
      .from('error_single_revision')
      .insert({
        user_id: userId,
        upload_session_id: data.uploadSessionId, // Groupement des erreurs
        document_ids: data.documentIds, // Documents partagés
        error_image_url: data.errorImageUrl, // UNE seule URL
        subject: data.subject,
        course_name: data.courseName,
        user_message: data.userMessage || null,
        status: 'generating', // 🔥 Statut initial
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating error revision:', error);
      throw error;
    }

    return revision.id;
  },

  /**
   * Appel du webhook N8N pour déclencher l'analyse
   */
  async triggerAnalysisWebhook(payload: WebhookPayload): Promise<void> {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }

      // Le webhook ne renvoie rien, traitement asynchrone
    } catch (error) {
      console.error('Error calling webhook:', error);
      throw error;
    }
  },


  /**
   * Flow complet d'upload et de création
   * Crée UNE row par erreur (découpage automatique)
   * Appelle le webhook UNE SEULE FOIS avec toutes les erreurs
   */
  async submitErrorRevision(
    userId: string,
    formData: ErrorRevisionFormData
  ): Promise<{ uploadSessionId: string; errorRevisionIds: string[] }> {
    // 1. Générer un ID de session unique pour grouper toutes les erreurs de cet upload
    const uploadSessionId = crypto.randomUUID();

    try {
      // 2. Upload de tous les documents de cours (partagés entre toutes les erreurs)
      const documentIds = await this.uploadCourseDocuments(
        userId,
        formData.courseDocuments,
        formData.courseName,
        formData.subject
      );

      const errorRevisionIds: string[] = [];
      const errorRevisions: { error_revision_id: string; error_image_url: string }[] = [];

      // 3. Pour CHAQUE image d'erreur, créer une row séparée
      for (const errorImageFile of formData.errorImages) {
        // 3a. Upload l'image d'erreur
        const errorImageUrl = await this.uploadErrorImage(
          userId,
          uploadSessionId,
          errorImageFile
        );

        // 3b. Créer une row dans error_single_revision
        const revisionId = await this.createErrorRevision(userId, {
          uploadSessionId,
          errorImageUrl,        // UNE seule URL par row
          documentIds,          // Documents partagés
          subject: formData.subject,
          courseName: formData.courseName,
          userMessage: formData.userMessage,
        });

        errorRevisionIds.push(revisionId);

        // 3c. Collecter les infos pour le batch webhook
        errorRevisions.push({
          error_revision_id: revisionId,
          error_image_url: errorImageUrl,
        });
      }

      // 4. Appeler le webhook N8N en background (ne pas attendre)
      // Le modal se fermera immédiatement, les erreurs seront en status "generating"
      this.triggerAnalysisWebhook({
        upload_session_id: uploadSessionId,
        error_revisions: errorRevisions,
        document_ids: documentIds,
        user_id: userId,
        subject: formData.subject,
        course_name: formData.courseName,
        user_message: formData.userMessage,
      }).catch((webhookError) => {
        console.error(`Webhook call failed for upload session ${uploadSessionId}:`, webhookError);
        // On ne throw pas - les révisions sont créées, le webhook pourra être réessayé
      });

      // 5. Retourner immédiatement l'ID de session et les IDs des erreurs créées
      return { uploadSessionId, errorRevisionIds };
    } catch (error) {
      // En cas d'erreur, on essaie de nettoyer les uploads
      console.error('Error in submitErrorRevision:', error);
      throw error;
    }
  },

  /**
   * Récupération des révisions d'erreurs de l'utilisateur
   */
  async getUserErrorRevisions(userId: string): Promise<ErrorRevision[]> {
    const { data, error } = await supabase
      .from('error_single_revision')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching error revisions:', error);
      throw error;
    }

    return data as ErrorRevision[];
  },

  /**
   * Récupération d'une révision d'erreur spécifique
   */
  async getErrorRevision(revisionId: string): Promise<ErrorRevision> {
    const { data, error } = await supabase
      .from('error_single_revision')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (error) {
      console.error('Error fetching error revision:', error);
      throw error;
    }

    return data as ErrorRevision;
  },

  /**
   * Mise à jour du statut d'une révision
   * (Utilisé par le webhook pour marquer comme completed)
   */
  async updateRevisionStatus(
    revisionId: string,
    status: 'generating' | 'completed' | 'error',
    analysisResponse?: Record<string, any>
  ): Promise<void> {
    const { error } = await supabase
      .from('error_single_revision')
      .update({
        status,
        analysis_response: analysisResponse || null,
      })
      .eq('id', revisionId);

    if (error) {
      console.error('Error updating revision status:', error);
      throw error;
    }
  },

  /**
   * Suppression d'une révision d'erreur
   */
  async deleteErrorRevision(revisionId: string, userId: string): Promise<void> {
    // Récupérer les infos pour cleanup
    const { data: revision } = await supabase
      .from('error_single_revision')
      .select('error_image_url, document_ids')
      .eq('id', revisionId)
      .eq('user_id', userId)
      .single();

    if (!revision) {
      throw new Error('Revision not found');
    }

    // Supprimer l'entrée de la base
    const { error } = await supabase
      .from('error_single_revision')
      .delete()
      .eq('id', revisionId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting error revision:', error);
      throw error;
    }

    // Note: Les fichiers dans storage et les documents ne sont pas supprimés
    // pour garder une trace. Si besoin, ajouter le cleanup ici.
  },
};
