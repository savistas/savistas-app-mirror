import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Exercise } from '@/components/virtual-teacher/types';

/**
 * Hook pour récupérer les exercices de l'utilisateur
 */
export function useUserExercises(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-exercises', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('exercises')
        .select('id, exercice_title, metadata, course_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Exercise[];
    },
    enabled: !!userId,
  });
}
