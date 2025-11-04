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
  autoDowngradeTriggered?: boolean;
  adjustmentInfo?: {
    old_plan: string;
    new_plan: string;
    current_members: number;
    new_seat_limit: number;
  };
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
      // CRITICAL: Check if organization has an active subscription plan
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('subscription_plan')
        .eq('id', organizationId)
        .single();

      if (orgError || !organization) {
        return {
          error: new Error('Impossible de vérifier l\'abonnement de l\'organisation'),
        };
      }

      if (!organization.subscription_plan) {
        return {
          error: new Error(
            'Vous devez souscrire à un plan d\'abonnement avant d\'ajouter des membres. ' +
            'Rendez-vous dans la section Abonnement de votre profil pour choisir un plan.'
          ),
          noSubscription: true,
        };
      }

      const capacityCheck = await checkOrganizationCapacity(organizationId);

      if (!capacityCheck.can_add) {
        return {
          error: new Error(
            `Capacité maximale atteinte. Votre organisation a ${capacityCheck.current_members} membres ` +
            `sur ${capacityCheck.seat_limit} autorisés. Passez à un plan supérieur pour ajouter ce membre.`
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

      // Check if plan adjustment is needed after member removal
      // The database triggers will update active_members_count automatically
      // The check_organization_plan_adjustment() function will determine if downgrade is needed
      if (organizationId) {
        try {
          const { data: adjustmentCheck } = await supabase
            .rpc('check_organization_plan_adjustment', {
              org_id: organizationId,
            });

          // If adjustment is needed, the result will indicate required action
          // This can be used to show AutoDowngradeNotification component
          if (adjustmentCheck) {
            return {
              error: null,
              autoDowngradeTriggered: true,
              adjustmentInfo: adjustmentCheck
            };
          }
        } catch (adjustmentError) {
          console.error('Error checking plan adjustment:', adjustmentError);
          // Don't fail the member removal if adjustment check fails
        }
      }
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
