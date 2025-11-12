import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: 'basic' | 'premium' | 'pro' | 'organization';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  ai_minutes_purchased: number;
  created_at: string;
  updated_at: string;
  is_organization_member?: boolean;
}

export interface SubscriptionLimits {
  courses: number;
  exercises: number;
  fiches: number;
  aiMinutes: number;
  maxDaysPerCourse: number;
  isUnlimited?: boolean;
}

// Plan limits based on subscription tier
const PLAN_LIMITS: Record<'basic' | 'premium' | 'pro' | 'organization', SubscriptionLimits> = {
  basic: {
    courses: 2,
    exercises: 2,
    fiches: 2,
    aiMinutes: 3, // Base, will be incremented with purchased minutes
    maxDaysPerCourse: 10,
    isUnlimited: false,
  },
  premium: {
    courses: 10,
    exercises: 10,
    fiches: 10,
    aiMinutes: 0, // Only purchased minutes
    maxDaysPerCourse: 10,
    isUnlimited: false,
  },
  pro: {
    courses: 30,
    exercises: 30,
    fiches: 30,
    aiMinutes: 0, // Only purchased minutes
    maxDaysPerCourse: 10,
    isUnlimited: false,
  },
  organization: {
    courses: 999999,
    exercises: 999999,
    fiches: 999999,
    aiMinutes: 999999,
    maxDaysPerCourse: 999999,
    isUnlimited: true,
  },
};

/**
 * Hook to get user subscription information and limits
 *
 * @returns Subscription data, limits, and loading state
 */
export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Check if user is an active member of an organization (not removed, rejected, or pending)
      const { data: organizationMembership, error: orgError } = await supabase
        .from('organization_members')
        .select('id, status, organization_id, previous_subscription_plan')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (!orgError && organizationMembership) {
        // User is an active organization member - return unlimited plan
        console.log('User is organization member, applying unlimited limits');
        return {
          id: `org-${organizationMembership.id}`,
          user_id: user.id,
          stripe_customer_id: null,
          stripe_subscription_id: null,
          plan: 'organization' as const,
          status: 'active' as const,
          current_period_start: new Date().toISOString(),
          current_period_end: null,
          cancel_at_period_end: false,
          canceled_at: null,
          ai_minutes_purchased: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_organization_member: true,
        } as UserSubscription;
      }

      // Get user subscription (maybeSingle returns null if no rows, instead of error)
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        throw subError;
      }

      // If no subscription exists, create a basic one
      if (!subscription) {
        console.log('No subscription found, creating Basic plan for user:', user.id);
        const { data: newSub, error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            plan: 'basic',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating subscription:', createError);
          throw createError;
        }

        return newSub as UserSubscription;
      }

      return subscription as UserSubscription;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate limits based on plan and purchased minutes
  const limits: SubscriptionLimits | null = data
    ? {
        ...PLAN_LIMITS[data.plan],
        aiMinutes:
          data.plan === 'basic'
            ? PLAN_LIMITS.basic.aiMinutes + data.ai_minutes_purchased
            : data.ai_minutes_purchased,
      }
    : null;

  return {
    subscription: data || null,
    limits,
    isLoading,
    error,
    refetch,
  };
}
