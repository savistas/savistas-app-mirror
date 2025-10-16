/**
 * Custom hook for fetching all user errors with course and exercise details
 * Used for the Cahier d'erreurs (Error notebook) page
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuestionData {
  question_titre: string;
  question_index: string;
  type: string;
  reponses: Array<{
    lettre: string;
    texte: string;
    correcte: string;
  }>;
  explication_reponse_correcte?: string;
}

export interface UserResponse {
  question_index: string;
  user_answer: string;
  is_correct_sub_question: boolean;
}

export interface ErrorWithDetails {
  id: string;
  categorie: string;
  justification: string | null;
  message: string;
  created_at: string;
  matiere: string;
  course_id: string;
  course_title: string | null;
  exercice_id: string;
  exercice_title: string | null;
  date_exercice: string | null;
  questions: QuestionData[];
  user_responses: UserResponse[];
}

/**
 * Fetch all errors for the authenticated user with course and exercise details
 * Performs joins to get related course and exercise information
 *
 * @returns TanStack Query result with error details
 */
export function useAllErrors() {
  return useQuery({
    queryKey: ['all-errors'],
    queryFn: async (): Promise<ErrorWithDetails[]> => {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Query error_responses with joins to courses, exercises, and exercise_responses
      const { data, error } = await supabase
        .from('error_responses')
        .select(`
          id,
          categorie,
          justification,
          message,
          created_at,
          matiere,
          course_id,
          courses!inner (
            title
          ),
          exercice_id,
          exercises!inner (
            exercice_title,
            date_exercice,
            metadata
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all errors:', error);
        throw error;
      }

      if (!data) {
        return [];
      }

      // Fetch exercise responses for user answers
      const exerciseIds = [...new Set(data.map(row => row.exercice_id))];
      const { data: responsesData } = await supabase
        .from('exercise_responses')
        .select('exercise_id, metadata')
        .eq('user_id', user.id)
        .in('exercise_id', exerciseIds);

      // Create a map of exercise responses
      const responsesMap = new Map(
        responsesData?.map(r => [r.exercise_id, r.metadata]) || []
      );

      // Transform the data to a flat structure with questions and answers
      return data.map((row: any) => {
        const exerciseMetadata = row.exercises?.metadata || {};
        const questions: QuestionData[] = exerciseMetadata.questions || [];

        const responseMetadata = responsesMap.get(row.exercice_id) || {};
        const user_responses: UserResponse[] = responseMetadata.user_responses || [];

        return {
          id: row.id,
          categorie: row.categorie,
          justification: row.justification,
          message: row.message,
          created_at: row.created_at,
          matiere: row.matiere,
          course_id: row.course_id,
          course_title: row.courses?.title || null,
          exercice_id: row.exercice_id,
          exercice_title: row.exercises?.exercice_title || null,
          date_exercice: row.exercises?.date_exercice || null,
          questions,
          user_responses,
        };
      });
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}
