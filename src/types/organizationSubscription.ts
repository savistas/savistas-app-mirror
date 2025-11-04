import { OrganizationPlanType } from '@/constants/organizationPlans';

/**
 * Organization Subscription Types
 *
 * Defines TypeScript types for B2B organization subscriptions
 */

export type OrganizationSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid';

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: OrganizationPlanType;
  status: OrganizationSubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMonthlyUsage {
  id: string;
  organization_id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  courses_created: number;
  exercises_created: number;
  fiches_created: number;
  ai_minutes_used: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationUsageLimits {
  courses_limit: number | null; // null = unlimited
  exercises_limit: number;
  fiches_limit: number;
  ai_minutes_limit: number;
  max_days_per_course: number;
}

export interface OrganizationUsageRemaining {
  courses: number | null; // null = unlimited
  exercises: number;
  fiches: number;
  ai_minutes: number;
}

export interface OrganizationCapacityCheck {
  can_add: boolean;
  current_members: number;
  seat_limit: number;
  remaining_seats: number;
}

export interface OrganizationResourceCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number | null;
  remaining: number | null;
}

export interface OrganizationPlanAdjustment {
  downgraded: boolean;
  old_plan: OrganizationPlanType | null;
  new_plan: OrganizationPlanType | null;
  reason?: string;
}

export interface CreateOrgCheckoutSessionParams {
  organizationId: string;
  priceId: string;
  mode: 'subscription' | 'payment';
  successUrl: string;
  cancelUrl: string;
}

export interface CreateOrgCheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

/**
 * Extended organization type with subscription fields
 */
export interface OrganizationWithSubscription {
  id: string;
  name: string;
  description: string | null;
  organization_code: string;
  created_by: string;
  type: 'school' | 'company';
  max_members: number;
  validation_status: 'pending' | 'approved' | 'rejected';
  subscription_plan: OrganizationPlanType | null;
  active_members_count: number;
  seat_limit: number | null;
  website: string | null;
  validated_at: string | null;
  validated_by: string | null;
  created_at: string;
  updated_at: string;
}
