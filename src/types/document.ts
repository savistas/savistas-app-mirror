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
