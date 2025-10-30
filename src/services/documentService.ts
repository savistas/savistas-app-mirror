import { supabase } from '@/integrations/supabase/client';
import { Document, DocumentFormData } from '@/types/document';

export const documentService = {
  /**
   * Fetch all documents for the current user
   */
  async getDocuments(): Promise<Document[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }

    return data as Document[];
  },

  /**
   * Upload a document file with proper folder structure
   * Structure: {user_id}/{subject}/{course_id}/documents/{filename}
   */
  async uploadDocument(formData: DocumentFormData): Promise<Document> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { file, subject, isNewSubject, newSubjectName, courseId, documentName } = formData;

    if (!courseId) {
      throw new Error('Course ID is required for document upload');
    }

    const finalSubject = isNewSubject && newSubjectName ? newSubjectName : subject;

    // Sanitize subject name for storage path (remove special characters)
    const sanitizedSubject = finalSubject.replace(/[^a-zA-Z0-9-_]/g, '_');

    // Generate unique file name
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // Hierarchical path structure: {user_id}/{subject}/{course_id}/documents/{filename}
    const filePath = `${user.id}/${sanitizedSubject}/${courseId}/documents/${fileName}`;

    // Upload to Supabase Storage in 'courses' bucket
    const { error: uploadError } = await supabase.storage
      .from('courses')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('courses')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      // Rollback: delete uploaded file if we can't get URL
      await supabase.storage.from('courses').remove([filePath]);
      throw new Error('Failed to get public URL for uploaded file');
    }

    // Create database record with public URL
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        name: documentName || file.name,
        subject: finalSubject,
        file_path: urlData.publicUrl, // Store public URL instead of path
        file_type: file.type,
        file_size: file.size
      })
      .select()
      .single();

    if (dbError) {
      // Rollback: delete uploaded file if database insert fails
      await supabase.storage.from('courses').remove([filePath]);
      console.error('Error creating document record:', dbError);
      throw dbError;
    }

    return data as Document;
  },

  /**
   * Download a document file
   */
  async downloadDocument(document: Document): Promise<void> {
    // file_path now contains the public URL, so we can directly fetch it
    try {
      const response = await fetch(document.file_path);
      if (!response.ok) {
        throw new Error('Failed to fetch file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  /**
   * Get URL to view a document
   */
  async getViewUrl(document: Document): Promise<string> {
    // file_path now contains the public URL directly
    return document.file_path;
  },

  /**
   * Delete a document (both file and database record)
   */
  async deleteDocument(documentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Get document to retrieve file path (which is now a public URL)
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('file_path')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching document:', fetchError);
      throw fetchError;
    }

    if (!document) {
      throw new Error('Document not found');
    }

    // Extract file path from public URL
    // URL format: https://{project}.supabase.co/storage/v1/object/public/courses/{path}
    const urlParts = document.file_path.split('/storage/v1/object/public/courses/');
    if (urlParts.length === 2) {
      const filePath = decodeURIComponent(urlParts[1]);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('courses')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
        // Don't throw - continue to delete DB record even if file deletion fails
      }
    }

    // Delete database record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (dbError) {
      console.error('Error deleting document record:', dbError);
      throw dbError;
    }
  },

  /**
   * Get unique subjects from both courses and documents
   */
  async getSubjects(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    // Fetch subjects from courses
    const { data: coursesData } = await supabase
      .from('courses')
      .select('subject')
      .eq('user_id', user.id);

    // Fetch subjects from documents
    const { data: docsData } = await supabase
      .from('documents')
      .select('subject')
      .eq('user_id', user.id);

    // Combine and deduplicate
    const allSubjects = [
      ...new Set([
        ...(coursesData?.map((c) => c.subject).filter(Boolean) || []),
        ...(docsData?.map((d) => d.subject).filter(Boolean) || [])
      ])
    ];

    return allSubjects.sort();
  }
};
