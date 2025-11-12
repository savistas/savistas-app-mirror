import { useQuery } from '@tanstack/react-query';
import {
  getOrganizationMonthlyUsage,
  getOrganizationUsageLimits,
  canCreateResourceInOrg,
} from '@/services/organizationSubscriptionService';
import {
  OrganizationMonthlyUsage,
  OrganizationUsageLimits,
  OrganizationUsageRemaining,
} from '@/types/organizationSubscription';

/**
 * Hook for managing organization member usage limits
 */
export const useOrganizationUsageLimits = (
  organizationId: string | undefined,
  userId: string | undefined
) => {
  // Fetch current usage
  const {
    data: usage,
    isLoading: usageLoading,
    error: usageError,
    refetch: refetchUsage,
  } = useQuery({
    queryKey: ['organization-usage', organizationId, userId],
    queryFn: async (): Promise<OrganizationMonthlyUsage | null> => {
      if (!organizationId || !userId) return null;
      return await getOrganizationMonthlyUsage(organizationId, userId);
    },
    enabled: !!organizationId && !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  // Fetch limits
  const {
    data: limits,
    isLoading: limitsLoading,
    error: limitsError,
  } = useQuery({
    queryKey: ['organization-limits', organizationId, userId],
    queryFn: async (): Promise<OrganizationUsageLimits> => {
      if (!organizationId || !userId) {
        return {
          courses_limit: null,
          exercises_limit: 30,
          fiches_limit: 30,
          ai_minutes_limit: 60,
          max_days_per_course: 10,
        };
      }
      return await getOrganizationUsageLimits(organizationId, userId);
    },
    enabled: !!organizationId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes (limits don't change often)
  });

  // Calculate remaining
  const remaining: OrganizationUsageRemaining = {
    courses: null, // unlimited
    exercises: limits ? Math.max(0, limits.exercises_limit - (usage?.exercises_created || 0)) : 0,
    fiches: limits ? Math.max(0, limits.fiches_limit - (usage?.fiches_created || 0)) : 0,
    ai_minutes: limits ? Math.max(0, limits.ai_minutes_limit - (usage?.ai_minutes_used || 0)) : 0,
  };

  // Helper function to check if can create a resource
  const canCreate = async (resourceType: 'course' | 'exercise' | 'fiche' | 'ai_minutes'): Promise<boolean> => {
    if (!organizationId || !userId) return false;

    try {
      const result = await canCreateResourceInOrg(organizationId, userId, resourceType);
      return result.allowed;
    } catch (error) {
      console.error('Error checking can create:', error);
      return false;
    }
  };

  // Get limit info for a specific resource
  const getLimitInfo = (resourceType: 'course' | 'exercise' | 'fiche' | 'ai_minutes') => {
    if (!usage || !limits) {
      return {
        current: 0,
        limit: resourceType === 'course' ? null : 30,
        remaining: resourceType === 'course' ? null : 0,
        canCreate: false,
      };
    }

    let current = 0;
    let limit: number | null = null;
    let remainingValue: number | null = null;

    switch (resourceType) {
      case 'course':
        current = usage.courses_created;
        limit = null; // unlimited
        remainingValue = null;
        break;
      case 'exercise':
        current = usage.exercises_created;
        limit = limits.exercises_limit;
        remainingValue = remaining.exercises;
        break;
      case 'fiche':
        current = usage.fiches_created;
        limit = limits.fiches_limit;
        remainingValue = remaining.fiches;
        break;
      case 'ai_minutes':
        current = usage.ai_minutes_used;
        limit = limits.ai_minutes_limit;
        remainingValue = remaining.ai_minutes;
        break;
    }

    return {
      current,
      limit,
      remaining: remainingValue,
      canCreate: limit === null || current < limit,
    };
  };

  return {
    // Data
    usage,
    limits,
    remaining,

    // Loading states
    isLoading: usageLoading || limitsLoading,
    error: usageError || limitsError,

    // Helper functions
    canCreate,
    getLimitInfo,

    // Refetch
    refetch: refetchUsage,
  };
};
