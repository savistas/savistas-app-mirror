import { useQuery } from '@tanstack/react-query';
import { getOrganizationMembersUsage } from '@/services/organizationSubscriptionService';
import { OrganizationMonthlyUsage } from '@/types/organizationSubscription';

/**
 * Hook to fetch usage data for all members in an organization
 */
export const useOrganizationMembersUsage = (organizationId: string | null) => {
  const {
    data: membersUsage,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['organization-members-usage', organizationId],
    queryFn: async (): Promise<OrganizationMonthlyUsage[]> => {
      if (!organizationId) return [];
      return await getOrganizationMembersUsage(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute to keep data fresh
  });

  /**
   * Get usage for a specific user
   */
  const getUserUsage = (userId: string): OrganizationMonthlyUsage | null => {
    if (!membersUsage) return null;
    return membersUsage.find(u => u.user_id === userId) || null;
  };

  /**
   * Get remaining count for a specific resource type
   */
  const getRemaining = (
    userId: string,
    resourceType: 'courses' | 'exercises' | 'fiches' | 'ai_minutes'
  ): { current: number; max: number | null; remaining: number | null } => {
    const usage = getUserUsage(userId);

    const limits = {
      exercises: 30,
      fiches: 30,
      ai_minutes: 60,
      courses: null, // unlimited
    };

    if (!usage) {
      return {
        current: 0,
        max: limits[resourceType],
        remaining: limits[resourceType],
      };
    }

    let current = 0;
    let max: number | null = null;
    let remaining: number | null = null;

    switch (resourceType) {
      case 'courses':
        current = usage.courses_created || 0;
        max = null; // unlimited
        remaining = null;
        break;
      case 'exercises':
        current = usage.exercises_created || 0;
        max = limits.exercises;
        remaining = Math.max(0, max - current);
        break;
      case 'fiches':
        current = usage.fiches_created || 0;
        max = limits.fiches;
        remaining = Math.max(0, max - current);
        break;
      case 'ai_minutes':
        current = usage.ai_minutes_used || 0;
        max = limits.ai_minutes;
        remaining = Math.max(0, max - current);
        break;
    }

    return { current, max, remaining };
  };

  return {
    membersUsage,
    isLoading,
    error,
    refetch,
    getUserUsage,
    getRemaining,
  };
};
