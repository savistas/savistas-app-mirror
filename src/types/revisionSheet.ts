export interface RevisionSheet {
  id: string;
  title: string;
  subject: string;
  fiche_revision_url: string | null;
  fiche_revision_status: 'not_requested' | 'generating' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface RevisionSheetsByCourse {
  courseId: string;
  courseName: string;
  subject: string;
  ficheUrl: string;
  createdAt: string;
}
