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

// B2B Organization limits (per-student benefits)
// All B2B plans (PRO, MAX, ULTRA) provide the same per-student limits
const B2B_MEMBER_LIMITS: SubscriptionLimits = {
  courses: 999999, // Unlimited courses
  exercises: 30,
  fiches: 30,
  aiMinutes: 60,
  maxDaysPerCourse: 10,
};

/**
 * Hook to get user subscription information and limits
 *
 * PRIORITY: Checks organization membership first
 * - If user is an active organization member, returns B2B limits
 * - Otherwise, returns individual subscription limits
 *
 * @returns Subscription data, limits, loading state, and organization membership info
 */
export function useSubscription() {
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // STEP 1: Check if user is an active organization member
      const { data: orgMembership, error: orgError } = await supabase
        .from('organization_members')
        .select('organization_id, status')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (orgError) {
        console.error('Error checking organization membership:', orgError);
      }

      // STEP 2: Get user subscription (maybeSingle returns null if no rows, instead of error)
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        throw subError;
      }

      // STEP 3: If no subscription exists, create a basic one
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

        return {
          subscription: newSub as UserSubscription,
          isOrganizationMember: !!orgMembership,
          organizationId: orgMembership?.organization_id || null,
        };
      }

      return {
        subscription: subscription as UserSubscription,
        isOrganizationMember: !!orgMembership,
        organizationId: orgMembership?.organization_id || null,
      };
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate limits based on organization membership OR individual plan
  const limits: SubscriptionLimits | null = data
    ? data.isOrganizationMember
      ? // User is in an organization: use B2B limits
        { ...B2B_MEMBER_LIMITS }
      : // User has individual subscription: use plan limits
        {
          ...PLAN_LIMITS[data.subscription.plan],
          aiMinutes:
            data.subscription.plan === 'basic'
              ? PLAN_LIMITS.basic.aiMinutes + data.subscription.ai_minutes_purchased
              : data.subscription.ai_minutes_purchased,
        }
    : null;

  return {
    subscription: data?.subscription || null,
    limits,
    isLoading,
    error,
    refetch,
    isOrganizationMember: data?.isOrganizationMember || false,
    organizationId: data?.organizationId || null,
  };
}
