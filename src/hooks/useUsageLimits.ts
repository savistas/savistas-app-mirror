import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from './useSubscription';

export interface MonthlyUsage {
  courses_created: number;
  exercises_created: number;
  fiches_created: number;
  ai_minutes_used: number;
}

export interface UsageRemaining {
  courses: number;
  exercises: number;
  fiches: number;
  aiMinutes: number;
}

export type ResourceType = 'course' | 'exercise' | 'fiche' | 'ai_minutes';

/**
 * Hook to get current usage and check limits
 *
 * @returns Usage data, remaining limits, and ability to check if user can create resources
 */
export function useUsageLimits() {
  const { user } = useAuth();
  const { subscription, limits } = useSubscription();

  // Get current usage period
  const { data: usage, isLoading, error, refetch } = useQuery({
    queryKey: ['monthly-usage', user?.id, subscription?.current_period_start],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Call PostgreSQL function to get or create usage period
      const { data, error } = await supabase.rpc('get_or_create_usage_period', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('Error fetching usage:', error);
        throw error;
      }

      return data as MonthlyUsage;
    },
    enabled: !!user?.id && !!subscription,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });

  // Calculate remaining resources
  const remaining: UsageRemaining | null =
    usage && limits
      ? {
          courses: Math.max(0, limits.courses - usage.courses_created),
          exercises: Math.max(0, limits.exercises - usage.exercises_created),
          fiches: Math.max(0, limits.fiches - usage.fiches_created),
          aiMinutes: Math.max(0, limits.aiMinutes - usage.ai_minutes_used),
        }
      : null;

  // Function to check if user can create a specific resource
  const canCreate = (resourceType: ResourceType): boolean => {
    if (!usage || !remaining) return false;

    switch (resourceType) {
      case 'course':
        return remaining.courses > 0;
      case 'exercise':
        return remaining.exercises > 0;
      case 'fiche':
        return remaining.fiches > 0;
      case 'ai_minutes':
        return remaining.aiMinutes > 0;
      default:
        return false;
    }
  };

  // Function to get detailed limit info for a resource type
  const getLimitInfo = (resourceType: ResourceType) => {
    if (!usage || !limits || !remaining) {
      return {
        current: 0,
        limit: 0,
        remaining: 0,
        canCreate: false,
      };
    }

    const resourceMap: Record<ResourceType, keyof MonthlyUsage> = {
      course: 'courses_created',
      exercise: 'exercises_created',
      fiche: 'fiches_created',
      ai_minutes: 'ai_minutes_used',
    };

    const limitMap: Record<ResourceType, keyof typeof limits> = {
      course: 'courses',
      exercise: 'exercises',
      fiche: 'fiches',
      ai_minutes: 'aiMinutes',
    };

    const remainingMap: Record<ResourceType, keyof UsageRemaining> = {
      course: 'courses',
      exercise: 'exercises',
      fiche: 'fiches',
      ai_minutes: 'aiMinutes',
    };

    return {
      current: usage[resourceMap[resourceType]],
      limit: limits[limitMap[resourceType]],
      remaining: remaining[remainingMap[resourceType]],
      canCreate: canCreate(resourceType),
    };
  };

  return {
    usage,
    remaining,
    limits,
    canCreate,
    getLimitInfo,
    isLoading,
    error,
    refetch,
  };
}
