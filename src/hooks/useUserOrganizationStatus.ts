import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to check if user is a member of an organization
 *
 * CRITICAL: Users in organizations should NOT be able to purchase
 * individual student plans (premium/pro) since they already benefit
 * from the organization subscription.
 */
export const useUserOrganizationStatus = (userId: string | undefined) => {
  const {
    data: organizationMembership,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['user-organization-status', userId],
    queryFn: async () => {
      if (!userId) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          *,
          organization:organizations(
            id,
            name,
            seat_limit,
            active_members_count
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) {
        // Not finding a record is OK - user just isn't in an org
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Derived values
  const isInOrganization = !!organizationMembership;
  const organizationId = organizationMembership?.organization_id || null;
  const organization = organizationMembership?.organization || null;

  // Check if user can purchase individual subscriptions
  const canPurchaseIndividualPlan = !isInOrganization;

  return {
    // Raw data
    organizationMembership,
    organization,

    // Computed values
    isInOrganization,
    organizationId,
    canPurchaseIndividualPlan,

    // Status
    isLoading,
    error,

    // Actions
    refetch,
  };
};
