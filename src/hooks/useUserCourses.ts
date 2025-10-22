import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Course } from '@/components/virtual-teacher/types';

/**
 * Hook pour récupérer les cours de l'utilisateur
 */
export function useUserCourses(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-courses', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, course_content, subject')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Course[];
    },
    enabled: !!userId,
  });
}
