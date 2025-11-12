-- ============================================================================
-- MIGRATION: Complete transition to seat-based billing (no plans)
-- ============================================================================
--
-- This migration removes all plan-based architecture (b2b_pro, b2b_max, b2b_ultra)
-- and transitions to a pure seat-based billing system with progressive tier pricing.
--
-- Progressive Pricing Tiers:
-- - 1-20 seats: €35/seat/month
-- - 21-50 seats: €32/seat/month
-- - 51-100 seats: €29/seat/month
--
-- Key Changes:
-- 1. Remove subscription_plan column and related constraints
-- 2. Remove plan-based functions and triggers
-- 3. Simplify seat_limit to be the total purchased seats
-- 4. Track seat purchases with their billing cycles
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop dependent triggers first
-- ============================================================================

DROP TRIGGER IF EXISTS trigger_recalculate_seat_limit_on_plan_change ON public.organizations;
DROP TRIGGER IF EXISTS trigger_update_organization_seat_limit ON public.organizations;
DROP TRIGGER IF EXISTS sync_seat_limit_trigger ON public.organization_subscriptions;

-- ============================================================================
-- STEP 2: Drop old functions
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_included_seats_for_plan(TEXT);
DROP FUNCTION IF EXISTS public.get_seat_limit_for_plan(TEXT);
DROP FUNCTION IF EXISTS public.get_max_purchasable_seats(TEXT);
DROP FUNCTION IF EXISTS public.recalculate_seat_limit_on_plan_change();
DROP FUNCTION IF EXISTS public.update_organization_seat_limit();
DROP FUNCTION IF EXISTS public.sync_organization_seat_limit();

-- ============================================================================
-- STEP 3: Update organization_subscriptions table
-- ============================================================================

-- Remove plan-specific columns
ALTER TABLE public.organization_subscriptions
DROP COLUMN IF EXISTS purchased_seats,
DROP COLUMN IF EXISTS stripe_seat_subscription_id,
DROP COLUMN IF EXISTS seat_billing_period;

-- Add new seat-based billing columns
ALTER TABLE public.organization_subscriptions
ADD COLUMN IF NOT EXISTS total_seats INTEGER NOT NULL DEFAULT 0 CHECK (total_seats >= 0 AND total_seats <= 100),
ADD COLUMN IF NOT EXISTS tier_1_seats INTEGER NOT NULL DEFAULT 0 CHECK (tier_1_seats >= 0 AND tier_1_seats <= 20),
ADD COLUMN IF NOT EXISTS tier_2_seats INTEGER NOT NULL DEFAULT 0 CHECK (tier_2_seats >= 0 AND tier_2_seats <= 30),
ADD COLUMN IF NOT EXISTS tier_3_seats INTEGER NOT NULL DEFAULT 0 CHECK (tier_3_seats >= 0 AND tier_3_seats <= 50),
ADD COLUMN IF NOT EXISTS billing_period TEXT CHECK (billing_period IN ('monthly', 'yearly')),
ADD COLUMN IF NOT EXISTS next_billing_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS seats_pending_decrease INTEGER DEFAULT 0 CHECK (seats_pending_decrease >= 0);

-- Add constraint: total_seats must equal sum of tier seats
ALTER TABLE public.organization_subscriptions
ADD CONSTRAINT check_tier_seats_sum
  CHECK (total_seats = tier_1_seats + tier_2_seats + tier_3_seats);

COMMENT ON COLUMN public.organization_subscriptions.total_seats IS
  'Total number of seats purchased (1-100)';
COMMENT ON COLUMN public.organization_subscriptions.tier_1_seats IS
  'Seats in tier 1 (1-20 @ €35/month)';
COMMENT ON COLUMN public.organization_subscriptions.tier_2_seats IS
  'Seats in tier 2 (21-50 @ €32/month)';
COMMENT ON COLUMN public.organization_subscriptions.tier_3_seats IS
  'Seats in tier 3 (51-100 @ €29/month)';
COMMENT ON COLUMN public.organization_subscriptions.billing_period IS
  'Monthly or yearly billing';
COMMENT ON COLUMN public.organization_subscriptions.next_billing_date IS
  'Next billing date for this subscription';
COMMENT ON COLUMN public.organization_subscriptions.seats_pending_decrease IS
  'Seats scheduled to be removed at next billing cycle';

-- ============================================================================
-- STEP 4: Update organizations table
-- ============================================================================

-- Remove subscription_plan column and its constraint
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_subscription_plan_check;

ALTER TABLE public.organizations
DROP COLUMN IF EXISTS subscription_plan;

-- Drop the index
DROP INDEX IF EXISTS idx_organizations_subscription_plan;

-- Ensure seat_limit is nullable (will be set when subscription is created)
ALTER TABLE public.organizations
ALTER COLUMN seat_limit DROP NOT NULL;

COMMENT ON COLUMN public.organizations.seat_limit IS
  'Maximum number of members allowed based on total purchased seats';

-- ============================================================================
-- STEP 5: Create new function to sync seat_limit from subscription
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_seat_limit_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update organization seat_limit to match subscription total_seats
  UPDATE public.organizations
  SET
    seat_limit = NEW.total_seats,
    updated_at = NOW()
  WHERE id = NEW.organization_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.sync_seat_limit_from_subscription() IS
  'Automatically updates organization seat_limit when subscription total_seats changes';

-- Create trigger
CREATE TRIGGER sync_seat_limit_from_subscription_trigger
  AFTER INSERT OR UPDATE OF total_seats
  ON public.organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_seat_limit_from_subscription();

-- ============================================================================
-- STEP 6: Helper function to calculate tier breakdown
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_tier_breakdown(p_total_seats INTEGER)
RETURNS TABLE(tier_1 INTEGER, tier_2 INTEGER, tier_3 INTEGER) AS $$
BEGIN
  IF p_total_seats <= 0 OR p_total_seats > 100 THEN
    RAISE EXCEPTION 'Total seats must be between 1 and 100, got: %', p_total_seats;
  END IF;

  -- Tier 1: First 20 seats @ €35
  tier_1 := LEAST(p_total_seats, 20);

  -- Tier 2: Seats 21-50 @ €32
  tier_2 := LEAST(GREATEST(p_total_seats - 20, 0), 30);

  -- Tier 3: Seats 51-100 @ €29
  tier_3 := GREATEST(p_total_seats - 50, 0);

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_tier_breakdown(INTEGER) IS
  'Calculates how many seats fall into each pricing tier for progressive pricing.
   Returns: (tier_1: 0-20, tier_2: 0-30, tier_3: 0-50)
   Example: 35 seats → (20, 15, 0)';

-- ============================================================================
-- STEP 7: Helper function to calculate monthly cost
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_seat_cost(
  p_tier_1_seats INTEGER,
  p_tier_2_seats INTEGER,
  p_tier_3_seats INTEGER,
  p_billing_period TEXT DEFAULT 'monthly'
)
RETURNS NUMERIC AS $$
DECLARE
  v_monthly_cost NUMERIC;
  v_multiplier INTEGER;
BEGIN
  -- Calculate monthly cost
  v_monthly_cost :=
    (p_tier_1_seats * 35) +  -- Tier 1: €35/seat/month
    (p_tier_2_seats * 32) +  -- Tier 2: €32/seat/month
    (p_tier_3_seats * 29);   -- Tier 3: €29/seat/month

  -- Apply yearly multiplier if needed
  IF p_billing_period = 'yearly' THEN
    v_multiplier := 12;
  ELSE
    v_multiplier := 1;
  END IF;

  RETURN v_monthly_cost * v_multiplier;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_seat_cost(INTEGER, INTEGER, INTEGER, TEXT) IS
  'Calculates total cost for seat breakdown with progressive pricing.
   Parameters: tier_1_seats, tier_2_seats, tier_3_seats, billing_period
   Returns: Total cost in euros';

-- ============================================================================
-- STEP 8: Initialize seat_limit for existing organizations
-- ============================================================================

-- For organizations with existing subscriptions, set seat_limit from subscription
UPDATE public.organizations o
SET seat_limit = COALESCE(
  (SELECT total_seats
   FROM public.organization_subscriptions
   WHERE organization_id = o.id
   AND status = 'active'
   LIMIT 1),
  0
)
WHERE EXISTS (
  SELECT 1
  FROM public.organization_subscriptions
  WHERE organization_id = o.id
);

-- For organizations without subscriptions, ensure seat_limit is 0
UPDATE public.organizations
SET seat_limit = 0
WHERE seat_limit IS NULL;

-- ============================================================================
-- STEP 9: Add helpful views for monitoring
-- ============================================================================

CREATE OR REPLACE VIEW organization_billing_summary AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.seat_limit,
  o.active_members_count,
  (o.seat_limit - o.active_members_count) AS available_seats,
  os.total_seats,
  os.tier_1_seats,
  os.tier_2_seats,
  os.tier_3_seats,
  os.billing_period,
  calculate_seat_cost(os.tier_1_seats, os.tier_2_seats, os.tier_3_seats, os.billing_period) AS monthly_cost,
  os.status AS subscription_status,
  os.current_period_end,
  os.next_billing_date,
  os.seats_pending_decrease
FROM organizations o
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id;

COMMENT ON VIEW organization_billing_summary IS
  'Summary view of organization billing status with seat breakdown and costs';

-- ============================================================================
-- STEP 10: Add RLS policies for new columns
-- ============================================================================

-- Organization admins can view their subscription details
CREATE POLICY "Organization admins can view subscription"
  ON organization_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = organization_subscriptions.organization_id
      AND organizations.created_by = auth.uid()
    )
  );

-- Service role can manage subscriptions (for webhooks)
CREATE POLICY "Service role can manage subscriptions"
  ON organization_subscriptions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Migration complete
-- ============================================================================

-- Log migration completion
DO $$
BEGIN
  RAISE NOTICE '✅ Migration complete: Transitioned to seat-only billing system';
  RAISE NOTICE '   - Removed plan-based architecture';
  RAISE NOTICE '   - Implemented progressive tier pricing (€35/€32/€29)';
  RAISE NOTICE '   - Seat limits now managed directly via subscriptions';
END $$;
