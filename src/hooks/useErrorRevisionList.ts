/**
 * Hook for fetching error revisions list
 * Includes intelligent polling for generating status
 */

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { errorRevisionService } from '@/services/errorRevisionService';
import { ErrorRevision } from '@/types/errorRevision';

export const useErrorRevisionList = () => {
  const { user } = useAuth();

  return useQuery<ErrorRevision[]>({
    queryKey: ['error-revisions', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');
      return errorRevisionService.getUserErrorRevisions(user.id);
    },
    enabled: !!user,
    // Polling intelligent: toutes les 10 secondes si au moins une erreur est en "generating"
    refetchInterval: (query) => {
      // query.state.data contient les données de la query
      const data = query.state.data;
      if (!data || !Array.isArray(data)) return false;
      const hasGenerating = data.some((item) => item.status === 'generating');
      return hasGenerating ? 10000 : false; // 10 secondes si generating, sinon pas de polling
    },
    staleTime: 5000, // Les données sont considérées fraîches pendant 5 secondes
  });
};
