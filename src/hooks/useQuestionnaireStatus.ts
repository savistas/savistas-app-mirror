import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to check the completion status of all questionnaires
 * This reads the flags from the profiles table which are automatically
 * synchronized by database triggers based on the actual questionnaire data
 */
export const useQuestionnaireStatus = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['questionnaire-status', user?.id],
    queryFn: async () => {
      if (!user) {
        return {
          hasTroublesData: false,
          hasLearningStylesData: false,
          hasSurveyData: false,
        };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('troubles_detection_completed, learning_styles_completed, survey_completed')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching questionnaire status:', error);
        return {
          hasTroublesData: false,
          hasLearningStylesData: false,
          hasSurveyData: false,
        };
      }

      return {
        hasTroublesData: profile?.troubles_detection_completed ?? false,
        hasLearningStylesData: profile?.learning_styles_completed ?? false,
        hasSurveyData: profile?.survey_completed ?? false,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  return query;
};
