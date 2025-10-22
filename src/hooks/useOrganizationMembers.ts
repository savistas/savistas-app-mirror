import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Member {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  status: 'pending' | 'active' | 'rejected' | 'removed';
  role: string;
  requested_at: string;
  approved_at: string | null;
  organization_name: string;
  organization_code: string;
}

export const useOrganizationMembers = (organizationId: string | null) => {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    if (!organizationId) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('organization_members_details')
      .select('*')
      .eq('organization_id', organizationId)
      .order('requested_at', { ascending: false });

    if (data) {
      setMembers(data as Member[]);
      setPendingCount(data.filter((m) => m.status === 'pending').length);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();

    // Subscribe to changes
    if (organizationId) {
      const subscription = supabase
        .channel('organization_members_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organization_members',
            filter: `organization_id=eq.${organizationId}`,
          },
          () => {
            fetchMembers();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [organizationId]);

  const approveMember = async (memberId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .update({
        status: 'active',
        approved_at: new Date().toISOString(),
        approved_by: user?.id,
      })
      .eq('id', memberId);

    if (!error) {
      await fetchMembers();
    }

    return { error };
  };

  const rejectMember = async (memberId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'rejected' })
      .eq('id', memberId);

    if (!error) {
      await fetchMembers();
    }

    return { error };
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      await fetchMembers();
    }

    return { error };
  };

  const getFilteredMembers = (status?: 'pending' | 'active') => {
    if (!status) return members;
    return members.filter((m) => m.status === status);
  };

  return {
    members,
    pendingMembers: getFilteredMembers('pending'),
    activeMembers: getFilteredMembers('active'),
    pendingCount,
    loading,
    approveMember,
    rejectMember,
    removeMember,
    refetch: fetchMembers,
  };
};
