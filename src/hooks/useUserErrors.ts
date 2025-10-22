import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { ErrorResponse } from '@/components/virtual-teacher/types';

/**
 * Hook pour récupérer les erreurs de l'utilisateur
 */
export function useUserErrors(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-errors', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('error_responses')
        .select('id, matiere, categorie, message, justification, course_id, exercice_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50); // Limiter aux 50 erreurs les plus récentes

      if (error) {
        throw error;
      }

      return (data || []) as ErrorResponse[];
    },
    enabled: !!userId,
  });
}
