-- ============================================================================
-- CRITICAL FIX: Seat limit logic with included + purchased seats
-- ============================================================================
--
-- New architecture:
-- - b2b_pro: 0 included + purchase 1-20 = 1-20 total
-- - b2b_max: 20 included + purchase 0-30 = 20-50 total
-- - b2b_ultra: 50 included + purchase 0-50 = 50-100 total
--
-- Formula: seat_limit = included_seats_for_plan + purchased_seats
-- ============================================================================

-- ============================================================================
-- STEP 1: Add purchased_seats column if it doesn't exist
-- ============================================================================

ALTER TABLE organization_subscriptions
ADD COLUMN IF NOT EXISTS purchased_seats INTEGER DEFAULT 0 NOT NULL CHECK (purchased_seats >= 0),
ADD COLUMN IF NOT EXISTS stripe_seat_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS seat_billing_period TEXT CHECK (seat_billing_period IN ('monthly', 'yearly'));

COMMENT ON COLUMN organization_subscriptions.purchased_seats IS
  'Number of seats purchased separately (added to included seats)';
COMMENT ON COLUMN organization_subscriptions.stripe_seat_subscription_id IS
  'Stripe subscription ID for seat-based billing';
COMMENT ON COLUMN organization_subscriptions.seat_billing_period IS
  'Billing period for purchased seats: monthly or yearly';

-- ============================================================================
-- STEP 2: Update helper function (returns included seats only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_included_seats_for_plan(p_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE p_plan
    WHEN 'b2b_pro' THEN RETURN 0;    -- PRO: 0 included, must purchase 1-20
    WHEN 'b2b_max' THEN RETURN 20;   -- MAX: 20 included, can purchase 0-30 more
    WHEN 'b2b_ultra' THEN RETURN 50; -- ULTRA: 50 included, can purchase 0-50 more
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_included_seats_for_plan(TEXT) IS
  'Returns ONLY the included/free seats for a plan (not including purchased seats).
   PRO: 0, MAX: 20, ULTRA: 50';

-- Keep old function name for backward compatibility (redirects to new function)
CREATE OR REPLACE FUNCTION public.get_seat_limit_for_plan(p_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN get_included_seats_for_plan(p_plan);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- STEP 3: Create/replace trigger to calculate included + purchased
-- ============================================================================

-- This trigger fires when purchased_seats changes and recalculates total seat_limit
CREATE OR REPLACE FUNCTION public.sync_organization_seat_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_included_seats INTEGER;
  v_plan TEXT;
BEGIN
  -- Get the organization's current plan
  SELECT subscription_plan INTO v_plan
  FROM public.organizations
  WHERE id = NEW.organization_id;

  -- Calculate included seats based on plan
  v_included_seats := get_included_seats_for_plan(v_plan);

  -- Total seats = included + purchased
  UPDATE public.organizations
  SET seat_limit = v_included_seats + COALESCE(NEW.purchased_seats, 0),
      updated_at = NOW()
  WHERE id = NEW.organization_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS sync_seat_limit_trigger ON public.organization_subscriptions;
CREATE TRIGGER sync_seat_limit_trigger
  AFTER INSERT OR UPDATE OF purchased_seats
  ON public.organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_organization_seat_limit();

COMMENT ON FUNCTION public.sync_organization_seat_limit() IS
  'Automatically updates seat_limit = included_seats + purchased_seats when purchased_seats changes';

-- ============================================================================
-- STEP 4: Create trigger for plan changes to recalculate seat_limit
-- ============================================================================

-- When subscription_plan changes, we need to recalculate seat_limit
CREATE OR REPLACE FUNCTION public.recalculate_seat_limit_on_plan_change()
RETURNS TRIGGER AS $$
DECLARE
  v_included_seats INTEGER;
  v_purchased_seats INTEGER;
BEGIN
  -- Only proceed if subscription_plan actually changed
  IF OLD.subscription_plan IS DISTINCT FROM NEW.subscription_plan THEN
    -- Get included seats for new plan
    v_included_seats := get_included_seats_for_plan(NEW.subscription_plan);

    -- Get purchased seats (if any)
    SELECT COALESCE(purchased_seats, 0) INTO v_purchased_seats
    FROM public.organization_subscriptions
    WHERE organization_id = NEW.id;

    -- Update seat_limit = included + purchased
    NEW.seat_limit := v_included_seats + v_purchased_seats;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the old trigger that sets seat_limit
DROP TRIGGER IF EXISTS trigger_update_organization_seat_limit ON public.organizations;
DROP TRIGGER IF EXISTS trigger_recalculate_seat_limit_on_plan_change ON public.organizations;

CREATE TRIGGER trigger_recalculate_seat_limit_on_plan_change
  BEFORE INSERT OR UPDATE OF subscription_plan
  ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_seat_limit_on_plan_change();

COMMENT ON FUNCTION public.recalculate_seat_limit_on_plan_change() IS
  'Recalculates seat_limit when organization plan changes (upgrade/downgrade)';

-- ============================================================================
-- STEP 5: Initialize seat_limit for existing organizations
-- ============================================================================

-- For organizations with plans, set seat_limit = included + purchased
UPDATE public.organizations o
SET seat_limit = (
  get_included_seats_for_plan(o.subscription_plan) +
  COALESCE((SELECT purchased_seats FROM organization_subscriptions WHERE organization_id = o.id), 0)
)
WHERE o.subscription_plan IS NOT NULL;

-- For organizations without plans, set to 0
UPDATE public.organizations
SET seat_limit = 0
WHERE subscription_plan IS NULL AND seat_limit IS NULL;

-- ============================================================================
-- STEP 6: Helper function to get max purchasable seats for a plan
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_max_purchasable_seats(p_plan TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_max_total INTEGER;
  v_included INTEGER;
BEGIN
  -- Get plan limits
  v_max_total := CASE p_plan
    WHEN 'b2b_pro' THEN 20
    WHEN 'b2b_max' THEN 50
    WHEN 'b2b_ultra' THEN 100
    ELSE 0
  END;

  v_included := get_included_seats_for_plan(p_plan);

  -- Max purchasable = total capacity - included seats
  RETURN v_max_total - v_included;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_max_purchasable_seats(TEXT) IS
  'Returns maximum seats that can be purchased for a plan (total capacity - included).
   PRO: 20 (0 included, 20 purchasable), MAX: 30 (20 included, 30 purchasable), ULTRA: 50 (50 included, 50 purchasable)';
