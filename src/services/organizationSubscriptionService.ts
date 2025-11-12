import { supabase } from '@/integrations/supabase/client';
import {
  OrganizationSubscription,
  OrganizationMonthlyUsage,
  OrganizationCapacityCheck,
  OrganizationResourceCheck,
  OrganizationUsageLimits,
  CreateOrgCheckoutSessionParams,
  CreateOrgCheckoutSessionResponse,
} from '@/types/organizationSubscription';

/**
 * Organization Subscription Service
 *
 * Handles all interactions with organization subscription data
 */

/**
 * Get organization subscription by organization ID
 */
export const getOrganizationSubscription = async (
  organizationId: string
): Promise<OrganizationSubscription | null> => {
  const { data, error } = await supabase
    .from('organization_subscriptions')
    .select('*')
    .eq('organization_id', organizationId)
    .maybeSingle();  // Returns null if not found, no 406 error

  if (error) {
    console.error('Error fetching organization subscription:', error);
    throw error;
  }

  return data;
};

/**
 * Check organization capacity (can add new member?)
 */
export const checkOrganizationCapacity = async (
  organizationId: string
): Promise<OrganizationCapacityCheck> => {
  const { data, error } = await supabase.rpc('check_organization_capacity', {
    p_organization_id: organizationId,
  });

  if (error) {
    console.error('Error checking organization capacity:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No capacity data returned');
  }

  return {
    can_add: data[0].can_add,
    current_members: data[0].current_members,
    seat_limit: data[0].seat_limit,
    remaining_seats: data[0].remaining_seats,
  };
};

/**
 * Get organization usage limits for a user
 */
export const getOrganizationUsageLimits = async (
  organizationId: string,
  userId: string
): Promise<OrganizationUsageLimits> => {
  const { data, error } = await supabase.rpc('get_organization_usage_limits', {
    p_organization_id: organizationId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error getting organization usage limits:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    // Return default B2B limits if user not found (shouldn't happen)
    return {
      courses_limit: null, // unlimited
      exercises_limit: 30,
      fiches_limit: 30,
      ai_minutes_limit: 60,
      max_days_per_course: 10,
    };
  }

  return {
    courses_limit: data[0].courses_limit,
    exercises_limit: data[0].exercises_limit,
    fiches_limit: data[0].fiches_limit,
    ai_minutes_limit: data[0].ai_minutes_limit,
    max_days_per_course: data[0].max_days_per_course,
  };
};

/**
 * Get current organization monthly usage for a user
 */
export const getOrganizationMonthlyUsage = async (
  organizationId: string,
  userId: string
): Promise<OrganizationMonthlyUsage | null> => {
  // Call RPC to get or create usage period
  const { data: usageData, error: rpcError } = await supabase.rpc(
    'get_or_create_org_usage_period',
    {
      p_organization_id: organizationId,
      p_user_id: userId,
    }
  );

  if (rpcError) {
    console.error('Error getting/creating org usage period:', rpcError);
    throw rpcError;
  }

  return usageData;
};

/**
 * Check if user can create a resource
 */
export const canCreateResourceInOrg = async (
  organizationId: string,
  userId: string,
  resourceType: 'course' | 'exercise' | 'fiche' | 'ai_minutes'
): Promise<OrganizationResourceCheck> => {
  const { data, error } = await supabase.rpc('can_create_resource_org', {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_resource_type: resourceType,
  });

  if (error) {
    console.error('Error checking resource limit:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('No resource check data returned');
  }

  return {
    allowed: data[0].allowed,
    current_usage: data[0].current_usage,
    limit_value: data[0].limit_value,
    remaining: data[0].remaining,
  };
};

/**
 * Increment organization usage for a user
 */
export const incrementOrganizationUsage = async (
  organizationId: string,
  userId: string,
  resourceType: 'course' | 'exercise' | 'fiche' | 'ai_minutes',
  amount: number = 1
): Promise<void> => {
  const { error } = await supabase.rpc('increment_organization_usage', {
    p_organization_id: organizationId,
    p_user_id: userId,
    p_resource_type: resourceType,
    p_amount: amount,
  });

  if (error) {
    console.error('Error incrementing organization usage:', error);
    throw error;
  }
};

/**
 * @deprecated No longer applicable in seat-based billing model.
 * Organizations now purchase seats directly instead of selecting from fixed plans.
 */
export const checkOrganizationPlanAdjustment = async (organizationId: string) => {
  console.warn('checkOrganizationPlanAdjustment is deprecated - seat-based billing does not use plan adjustments');
  return null;
};

/**
 * Create organization checkout session
 */
export const createOrgCheckoutSession = async (
  params: CreateOrgCheckoutSessionParams
): Promise<CreateOrgCheckoutSessionResponse> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || 'https://vvmkbpkoccxpmfpxhacv.supabase.co'}/functions/v1/create-org-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create checkout session: ${errorText}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Cancel organization subscription
 */
export const cancelOrganizationSubscription = async (
  organizationId: string,
  immediateCancel: boolean = false
): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || 'https://vvmkbpkoccxpmfpxhacv.supabase.co'}/functions/v1/cancel-subscription`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        organizationId,
        immediateCancel,
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel subscription: ${errorText}`);
  }
};

/**
 * Get all organization members' usage for current period
 * Only returns active/current billing period data
 */
export const getOrganizationMembersUsage = async (
  organizationId: string,
  periodStart?: string
): Promise<OrganizationMonthlyUsage[]> => {
  let query = supabase
    .from('organization_monthly_usage')
    .select('*')
    .eq('organization_id', organizationId);

  if (periodStart) {
    // If specific period requested, filter by that
    query = query.eq('period_start', periodStart);
  } else {
    // Otherwise, only get current/active periods (where period_end >= today)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    query = query.gte('period_end', today);
  }

  query = query.order('user_id', { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching organization members usage:', error);
    throw error;
  }

  return data || [];
};

/**
 * Create seat checkout session for organization
 * Allows organizations to purchase seats via Stripe subscription
 */
export const createSeatCheckoutSession = async (params: {
  organizationId: string;
  seatCount: number;
  billingPeriod: 'monthly' | 'yearly';
  applyImmediately: boolean;
  successUrl: string;
  cancelUrl: string;
}): Promise<CreateOrgCheckoutSessionResponse> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || 'https://vvmkbpkoccxpmfpxhacv.supabase.co'}/functions/v1/create-seat-checkout-session`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create seat checkout session: ${errorText}`);
  }

  const data = await response.json();
  return data;
};

/**
 * Cancel scheduled seat change
 * Cancels a pending seat reduction by releasing the Stripe subscription schedule
 */
export const cancelScheduledSeatChange = async (
  organizationId: string
): Promise<void> => {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL || 'https://vvmkbpkoccxpmfpxhacv.supabase.co'}/functions/v1/cancel-scheduled-seat-change`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ organizationId }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to cancel scheduled change: ${errorText}`);
  }
};
