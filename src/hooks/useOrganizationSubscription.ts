import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrganizationSubscription, createOrgCheckoutSession, cancelOrganizationSubscription } from '@/services/organizationSubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationSubscription, OrganizationWithSubscription, CreateOrgCheckoutSessionParams } from '@/types/organizationSubscription';

/**
 * Hook for managing organization subscriptions
 *
 * Note: With the new seat-based pricing model, all organizations
 * use progressive tier pricing. There are no plan tiers (PRO/MAX/ULTRA).
 * Seat limits are managed directly on the organization record.
 */
export const useOrganizationSubscription = (organizationId: string | undefined) => {
  const queryClient = useQueryClient();

  // Fetch organization subscription
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    error: subscriptionError,
    refetch: refetchSubscription,
  } = useQuery({
    queryKey: ['organization-subscription', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      return await getOrganizationSubscription(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Fetch organization details (for seat_limit, active_members_count)
  const {
    data: organization,
    isLoading: organizationLoading,
    error: organizationError,
  } = useQuery({
    queryKey: ['organization-details', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      return data as OrganizationWithSubscription;
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
  });

  // Create checkout session mutation
  const createCheckout = useMutation({
    mutationFn: async (params: CreateOrgCheckoutSessionParams) => {
      return await createOrgCheckoutSession(params);
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  // Cancel subscription mutation
  const cancelSubscription = useMutation({
    mutationFn: async ({ immediateCancel }: { immediateCancel?: boolean } = {}) => {
      if (!organizationId) throw new Error('No organization ID');
      return await cancelOrganizationSubscription(organizationId, immediateCancel);
    },
    onSuccess: () => {
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['organization-subscription', organizationId] });
      queryClient.invalidateQueries({ queryKey: ['organization-details', organizationId] });
    },
  });

  // Compute derived values
  const seatLimit = organization?.seat_limit || 0;
  const activeMembersCount = organization?.active_members_count || 0;
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';

  return {
    // Data
    subscription,
    organization,
    seatLimit,
    activeMembersCount,
    isActive,

    // Loading states
    isLoading: subscriptionLoading || organizationLoading,
    error: subscriptionError || organizationError,

    // Mutations
    createCheckout: createCheckout.mutate,
    isCreatingCheckout: createCheckout.isPending,
    createCheckoutError: createCheckout.error,

    cancelSubscription,
    isCanceling: cancelSubscription.isPending,
    cancelError: cancelSubscription.error,

    // Refetch
    refetch: refetchSubscription,
  };
};
