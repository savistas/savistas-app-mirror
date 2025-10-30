export interface UserDocument {
  id: string; // Generated unique ID for each file
  course_id: string;
  course_title: string;
  course_subject: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  uploaded_at: string;
  created_at: string;
}

export interface DocumentFilters {
  searchQuery: string;
  fileType: 'all' | 'pdf' | 'docx' | 'image' | 'other';
  dateRange: 'all' | 'today' | 'week' | 'month' | 'older';
  selectedCourses: string[];
}

export type ViewMode = 'grid' | 'list';

export interface DocumentsByCourse {
  courseId: string;
  courseName: string;
  subject: string;
  documents: UserDocument[];
}

// New types for standalone documents feature
export interface Document {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}

export interface DocumentFormData {
  file: File;
  subject: string;
  isNewSubject: boolean;
  newSubjectName?: string;
  courseId?: string;
  documentName?: string;
}

export const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

  // Tableurs
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',

  // Présentations
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',

  // Texte
  'text/plain'
] as const;

export const FILE_TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'application/vnd.ms-powerpoint': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'image/jpeg': 'Image',
  'image/png': 'Image',
  'image/gif': 'Image',
  'image/webp': 'Image',
  'text/plain': 'Texte',
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export function getFileTypeLabel(mimeType: string): string {
  return FILE_TYPE_LABELS[mimeType] || 'Fichier';
}
