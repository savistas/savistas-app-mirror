import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { checkOrganizationCapacity } from '@/services/organizationSubscriptionService';

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

interface ApproveMemberResult {
  error: Error | null;
  capacityExceeded?: boolean;
  noSubscription?: boolean;
  capacityInfo?: {
    can_add: boolean;
    current_members: number;
    seat_limit: number;
    remaining_seats: number;
  };
}

interface RemoveMemberResult {
  error: Error | null;
}

interface RejectMemberResult {
  error: Error | null;
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

  const approveMember = async (memberId: string): Promise<ApproveMemberResult> => {
    // CRITICAL: Check capacity before approving
    if (!organizationId) {
      return { error: new Error('Organization ID is required') };
    }

    try {
      // CRITICAL: Check if organization has purchased seats
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('seat_limit')
        .eq('id', organizationId)
        .single();

      if (orgError || !organization) {
        return {
          error: new Error('Impossible de vérifier les informations de l\'organisation'),
        };
      }

      // Check if organization has purchased any seats (seat_limit > 0)
      if (!organization.seat_limit || organization.seat_limit === 0) {
        return {
          error: new Error(
            'Vous devez acheter des sièges avant d\'ajouter des membres. ' +
            'Rendez-vous dans le tableau de bord de votre organisation pour acheter des sièges.'
          ),
          noSubscription: true,
        };
      }

      const capacityCheck = await checkOrganizationCapacity(organizationId);

      if (!capacityCheck.can_add) {
        return {
          error: new Error(
            `Capacité maximale atteinte. Votre organisation a ${capacityCheck.current_members} membres ` +
            `sur ${capacityCheck.seat_limit} autorisés. Achetez plus de sièges pour ajouter ce membre.`
          ),
          capacityExceeded: true,
          capacityInfo: capacityCheck,
        };
      }

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
    } catch (err: any) {
      return { error: err };
    }
  };

  const rejectMember = async (memberId: string): Promise<RejectMemberResult> => {
    const { error } = await supabase
      .from('organization_members')
      .update({ status: 'rejected' })
      .eq('id', memberId);

    if (!error) {
      await fetchMembers();
    }

    return { error };
  };

  const removeMember = async (memberId: string): Promise<RemoveMemberResult> => {
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('id', memberId);

    if (!error) {
      await fetchMembers();
      // Database triggers update active_members_count automatically
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
