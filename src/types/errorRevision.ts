/**
 * Types for Error Revision feature
 * Used for manual error upload and analysis
 */

export interface ErrorRevisionFormData {
  errorImages: File[]; // Plusieurs images d'erreurs (côté form)
  courseDocuments: File[]; // Plusieurs documents de cours
  subject: string;
  courseName: string;
  userMessage?: string;
}

export interface ErrorRevisionUploadData {
  uploadSessionId: string; // NOUVEAU: ID de session pour grouper les erreurs
  errorImageUrl: string; // UNE seule URL par erreur
  documentIds: string[]; // Documents partagés
  subject: string;
  courseName: string;
  userMessage?: string;
}

export type ErrorRevisionStatus = 'generating' | 'completed' | 'error';

export interface ErrorRevisionAnalysisItem {
  question: string;
  justification: string;
  correct_answer: string;
  student_answer: string;
}

export interface ErrorRevision {
  id: string;
  user_id: string;
  upload_session_id: string; // NOUVEAU: ID de session pour grouper
  document_ids: string[]; // Documents partagés entre erreurs
  error_image_url: string; // UNE seule URL par erreur
  subject: string;
  course_name: string;
  user_message?: string | null;
  status: ErrorRevisionStatus;
  // Support des deux formats: array direct ou objet avec items
  analysis_response?: ErrorRevisionAnalysisItem[] | {
    items?: ErrorRevisionAnalysisItem[];
  } | null;
  global_recommandation?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Représente une erreur individuelle dans le batch webhook
 */
export interface ErrorRevisionItem {
  error_revision_id: string;
  error_image_url: string;
}

/**
 * Payload envoyé au webhook N8N - BATCH MODE
 * Un seul appel webhook pour toutes les erreurs d'un même upload
 */
export interface WebhookPayload {
  upload_session_id: string; // ID de session pour grouper les erreurs
  error_revisions: ErrorRevisionItem[]; // Toutes les erreurs du batch
  document_ids: string[]; // Documents du cours (partagés entre toutes les erreurs)
  user_id: string;
  subject: string;
  course_name: string;
  user_message?: string;
}
