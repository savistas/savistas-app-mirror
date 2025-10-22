import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RevisionSheet } from '@/types/revisionSheet';
import { useAuth } from '@/contexts/AuthContext';

export const useRevisionSheets = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['revision-sheets', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, subject, fiche_revision_url, fiche_revision_status, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('fiche_revision_status', 'completed')
        .not('fiche_revision_url', 'is', null)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data as RevisionSheet[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
