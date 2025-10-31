/**
 * Types for Error Revision feature
 * Used for manual error upload and analysis
 */

export interface ErrorRevisionFormData {
  errorImage: File;
  courseDocument: File;
  subject: string;
  courseName: string;
  userMessage?: string;
}

export interface ErrorRevisionUploadData {
  errorImageUrl: string;
  documentId: string;
  subject: string;
  courseName: string;
  userMessage?: string;
}

export type ErrorRevisionStatus = 'generating' | 'completed' | 'error';

export interface ErrorRevision {
  id: string;
  user_id: string;
  document_id: string;
  error_image_url: string;
  subject: string;
  course_name: string;
  user_message?: string | null;
  status: ErrorRevisionStatus;
  analysis_response?: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookPayload {
  error_revision_id: string;
  document_id: string;
}
