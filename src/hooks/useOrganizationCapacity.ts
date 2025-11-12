import { useQuery } from '@tanstack/react-query';
import { checkOrganizationCapacity } from '@/services/organizationSubscriptionService';
import { OrganizationCapacityCheck } from '@/types/organizationSubscription';
import { getCapacityPercentage, getCapacityStatus } from '@/utils/organizationPlanHelpers';

/**
 * Hook for checking organization capacity (seat availability)
 */
export const useOrganizationCapacity = (organizationId: string | undefined) => {
  const {
    data: capacityData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['organization-capacity', organizationId],
    queryFn: async (): Promise<OrganizationCapacityCheck> => {
      if (!organizationId) {
        return {
          can_add: false,
          current_members: 0,
          seat_limit: 0,
          remaining_seats: 0,
        };
      }
      return await checkOrganizationCapacity(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Computed values
  const canAddMember = capacityData?.can_add ?? false;
  const currentMembers = capacityData?.current_members ?? 0;
  const seatLimit = capacityData?.seat_limit ?? 0;
  const remainingSeats = capacityData?.remaining_seats ?? 0;

  const capacityPercentage = getCapacityPercentage(currentMembers, seatLimit);
  const capacityStatus = getCapacityStatus(currentMembers, seatLimit);

  const isFull = capacityStatus === 'full';
  const isNearCapacity = capacityStatus === 'high' || capacityStatus === 'full';

  return {
    // Raw data
    canAddMember,
    currentMembers,
    seatLimit,
    remainingSeats,

    // Computed values
    capacityPercentage,
    capacityStatus,
    isFull,
    isNearCapacity,

    // Status
    isLoading,
    error,

    // Actions
    refetch,
  };
};
