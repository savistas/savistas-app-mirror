import { useQuery } from '@tanstack/react-query';
import { fetchCoursesWithoutRevisionSheet } from '@/services/revisionSheetService';
import { useAuth } from '@/contexts/AuthContext';

export function useCoursesWithoutSheet() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['coursesWithoutSheet', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchCoursesWithoutRevisionSheet(user.id);
    },
    enabled: !!user?.id,
  });
}
