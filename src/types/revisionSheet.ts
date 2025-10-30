export interface RevisionSheet {
  course_id: string;
  file_name: string | null;
  file_url: string | null;
  created_at: string;
  user_id: string;
  course: {
    id: string;
    title: string;
    subject: string;
    user_id: string;
  };
}

export interface Course {
  id: string;
  title: string;
  subject: string;
  course_content: string | null;
  fiche_revision_url: string | null;
  fiche_revision_status: 'not_requested' | 'generating' | 'completed' | 'failed';
}

export interface RevisionSheetGenerationOptions {
  includeConcepts: boolean;
  includeDefinitions: boolean;
  includeExamples: boolean;
  includeExercises: boolean;
}

export interface QuizGenerationOptions {
  questionCount: number;
  difficulty: 'facile' | 'moyen' | 'difficile';
}
