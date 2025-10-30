import { useQuery } from '@tanstack/react-query';
import { fetchRevisionSheets } from '@/services/revisionSheetService';
import { useAuth } from '@/contexts/AuthContext';

export function useRevisionSheets() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['revisionSheets', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User not authenticated');
      return fetchRevisionSheets(user.id);
    },
    enabled: !!user?.id,
  });
}
