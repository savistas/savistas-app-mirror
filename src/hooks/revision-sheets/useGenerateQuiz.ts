import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { QuizGenerationOptions } from '@/types/revisionSheet';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface GenerateQuizParams {
  courseId: string;
  options: QuizGenerationOptions;
}

export function useGenerateQuiz() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async ({ courseId, options }: GenerateQuizParams) => {
      // Call Edge Function to generate quiz from revision sheet
      const { data, error } = await supabase.functions.invoke('generate-quiz-from-fiche', {
        body: {
          courseId,
          questionCount: options.questionCount,
          difficulty: options.difficulty,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Quiz généré avec succès !');
      // Redirect to the quiz page
      if (data?.exerciseId) {
        navigate(`/daily-quiz/${data.exerciseId}`);
      }
    },
    onError: (error: any) => {
      console.error('Error generating quiz:', error);
      toast.error('Erreur lors de la génération du quiz');
    },
  });
}
