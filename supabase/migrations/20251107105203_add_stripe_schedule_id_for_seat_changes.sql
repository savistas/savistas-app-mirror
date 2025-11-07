-- ============================================================================
-- ADD STRIPE SCHEDULE ID FOR SCHEDULED SEAT CHANGES
-- ============================================================================
--
-- This migration adds support for Stripe Subscription Schedules to handle
-- scheduled seat decreases. This prevents gaming the billing system by ensuring
-- seat reductions only take effect at the next billing period.
--
-- Key Changes:
-- 1. Add stripe_schedule_id column to track active subscription schedules
-- 2. Add helper comment to explain seats_pending_decrease usage
--
-- Use case:
-- - Seat INCREASES: Can be immediate (with proration) or deferred billing
-- - Seat DECREASES: Always scheduled to next billing period using Stripe Schedules
-- ============================================================================

-- Add stripe_schedule_id column to track Stripe subscription schedules
ALTER TABLE public.organization_subscriptions
ADD COLUMN IF NOT EXISTS stripe_schedule_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_schedule_id
  ON public.organization_subscriptions(stripe_schedule_id)
  WHERE stripe_schedule_id IS NOT NULL;

-- Update comments
COMMENT ON COLUMN public.organization_subscriptions.stripe_schedule_id IS
  'Stripe subscription schedule ID when a seat change is scheduled for next billing period';

COMMENT ON COLUMN public.organization_subscriptions.seats_pending_decrease IS
  'Number of seats scheduled to be removed at next billing cycle (calculated from schedule). This prevents gaming the system by ensuring reductions only apply at renewal.';

-- ============================================================================
-- Migration complete
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE ' Migration complete: Added stripe_schedule_id for scheduled seat changes';
  RAISE NOTICE '   - Seat reductions will use Stripe Subscription Schedules';
  RAISE NOTICE '   - Prevents billing system gaming';
END $$;
