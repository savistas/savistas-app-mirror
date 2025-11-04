-- PostgreSQL functions for B2B organization subscription management
-- Handles capacity checking, usage limits, and automatic plan adjustments

-- ============================================================================
-- 1. Check organization capacity (can add new member?)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_organization_capacity(p_organization_id UUID)
RETURNS TABLE (
  can_add BOOLEAN,
  current_members INTEGER,
  seat_limit INTEGER,
  remaining_seats INTEGER
) AS $$
DECLARE
  v_active_count INTEGER;
  v_seat_limit INTEGER;
BEGIN
  -- Get organization data
  SELECT
    o.active_members_count,
    o.seat_limit
  INTO
    v_active_count,
    v_seat_limit
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  -- If no seat limit set, return false (no subscription)
  IF v_seat_limit IS NULL THEN
    RETURN QUERY SELECT false, v_active_count, 0, 0;
    RETURN;
  END IF;

  -- Calculate remaining seats
  RETURN QUERY SELECT
    (v_active_count < v_seat_limit)::BOOLEAN,
    v_active_count,
    v_seat_limit,
    GREATEST(0, v_seat_limit - v_active_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_organization_capacity IS
  'Checks if organization can add a new member based on seat limit';

-- ============================================================================
-- 2. Get or create organization usage period
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_or_create_org_usage_period(
  p_organization_id UUID,
  p_user_id UUID
)
RETURNS public.organization_monthly_usage AS $$
DECLARE
  v_usage_record public.organization_monthly_usage;
  v_period_start DATE;
  v_period_end DATE;
  v_subscription_start TIMESTAMPTZ;
BEGIN
  -- Get subscription start date for period calculation
  SELECT current_period_start
  INTO v_subscription_start
  FROM public.organization_subscriptions
  WHERE organization_id = p_organization_id;

  -- If no subscription, use current month
  IF v_subscription_start IS NULL THEN
    v_period_start = DATE_TRUNC('month', CURRENT_DATE)::DATE;
    v_period_end = (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
  ELSE
    -- Calculate period based on subscription anniversary
    DECLARE
      v_day_of_month INTEGER;
      v_current_month_start DATE;
    BEGIN
      v_day_of_month = EXTRACT(DAY FROM v_subscription_start)::INTEGER;
      v_current_month_start = DATE_TRUNC('month', CURRENT_DATE)::DATE;

      -- If we're past the anniversary day this month, period started this month
      -- Otherwise it started last month
      IF EXTRACT(DAY FROM CURRENT_DATE)::INTEGER >= v_day_of_month THEN
        v_period_start = (v_current_month_start + (v_day_of_month - 1) * INTERVAL '1 day')::DATE;
      ELSE
        v_period_start = ((v_current_month_start - INTERVAL '1 month') + (v_day_of_month - 1) * INTERVAL '1 day')::DATE;
      END IF;

      v_period_end = (v_period_start + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    END;
  END IF;

  -- Try to get existing record
  SELECT * INTO v_usage_record
  FROM public.organization_monthly_usage
  WHERE organization_id = p_organization_id
  AND user_id = p_user_id
  AND period_start = v_period_start;

  -- Create if doesn't exist
  IF v_usage_record IS NULL THEN
    INSERT INTO public.organization_monthly_usage (
      organization_id,
      user_id,
      period_start,
      period_end,
      courses_created,
      exercises_created,
      fiches_created,
      ai_minutes_used
    ) VALUES (
      p_organization_id,
      p_user_id,
      v_period_start,
      v_period_end,
      0,
      0,
      0,
      0
    )
    RETURNING * INTO v_usage_record;
  END IF;

  RETURN v_usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_or_create_org_usage_period IS
  'Gets or creates the current usage period for an organization member';

-- ============================================================================
-- 3. Get organization usage limits for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_organization_usage_limits(
  p_organization_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  courses_limit INTEGER,
  exercises_limit INTEGER,
  fiches_limit INTEGER,
  ai_minutes_limit INTEGER,
  max_days_per_course INTEGER
) AS $$
BEGIN
  -- B2B plans have per-student limits:
  -- - Unlimited courses (NULL)
  -- - 30 exercises per month
  -- - 30 fiches per month
  -- - 60 AI minutes per month
  -- - 10 days max per course
  RETURN QUERY SELECT
    NULL::INTEGER,  -- unlimited courses
    30,             -- exercises
    30,             -- fiches
    60,             -- AI minutes
    10              -- max days per course
  WHERE EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = p_organization_id
    AND user_id = p_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_organization_usage_limits IS
  'Returns per-student usage limits for organization members';

-- ============================================================================
-- 4. Check if user can create a resource
-- ============================================================================
CREATE OR REPLACE FUNCTION public.can_create_resource_org(
  p_organization_id UUID,
  p_user_id UUID,
  p_resource_type TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_usage INTEGER,
  limit_value INTEGER,
  remaining INTEGER
) AS $$
DECLARE
  v_usage public.organization_monthly_usage;
  v_current INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get or create usage period
  v_usage = get_or_create_org_usage_period(p_organization_id, p_user_id);

  -- Get current usage and limit based on resource type
  CASE p_resource_type
    WHEN 'course' THEN
      v_current = v_usage.courses_created;
      v_limit = NULL;  -- unlimited
    WHEN 'exercise' THEN
      v_current = v_usage.exercises_created;
      v_limit = 30;
    WHEN 'fiche' THEN
      v_current = v_usage.fiches_created;
      v_limit = 30;
    WHEN 'ai_minutes' THEN
      v_current = v_usage.ai_minutes_used;
      v_limit = 60;
    ELSE
      RAISE EXCEPTION 'Invalid resource type: %', p_resource_type;
  END CASE;

  -- For unlimited resources
  IF v_limit IS NULL THEN
    RETURN QUERY SELECT true, v_current, v_limit, NULL::INTEGER;
    RETURN;
  END IF;

  -- Check if under limit
  RETURN QUERY SELECT
    (v_current < v_limit)::BOOLEAN,
    v_current,
    v_limit,
    GREATEST(0, v_limit - v_current);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.can_create_resource_org IS
  'Checks if organization member can create a resource based on their usage limits';

-- ============================================================================
-- 5. Increment organization usage
-- ============================================================================
CREATE OR REPLACE FUNCTION public.increment_organization_usage(
  p_organization_id UUID,
  p_user_id UUID,
  p_resource_type TEXT,
  p_amount INTEGER DEFAULT 1
)
RETURNS BOOLEAN AS $$
DECLARE
  v_usage public.organization_monthly_usage;
BEGIN
  -- Get or create usage period
  v_usage = get_or_create_org_usage_period(p_organization_id, p_user_id);

  -- Increment based on resource type
  CASE p_resource_type
    WHEN 'course' THEN
      UPDATE public.organization_monthly_usage
      SET courses_created = courses_created + p_amount
      WHERE id = v_usage.id;
    WHEN 'exercise' THEN
      UPDATE public.organization_monthly_usage
      SET exercises_created = exercises_created + p_amount
      WHERE id = v_usage.id;
    WHEN 'fiche' THEN
      UPDATE public.organization_monthly_usage
      SET fiches_created = fiches_created + p_amount
      WHERE id = v_usage.id;
    WHEN 'ai_minutes' THEN
      UPDATE public.organization_monthly_usage
      SET ai_minutes_used = ai_minutes_used + p_amount
      WHERE id = v_usage.id;
    ELSE
      RAISE EXCEPTION 'Invalid resource type: %', p_resource_type;
  END CASE;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.increment_organization_usage IS
  'Increments usage counter for an organization member';

-- ============================================================================
-- 6. Determine required plan for member count
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_required_plan_for_member_count(p_member_count INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF p_member_count <= 20 THEN
    RETURN 'b2b_pro';
  ELSIF p_member_count <= 50 THEN
    RETURN 'b2b_max';
  ELSE
    RETURN 'b2b_ultra';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.get_required_plan_for_member_count IS
  'Determines the required B2B plan based on member count';

-- ============================================================================
-- 7. Check if organization plan should be adjusted (auto-downgrade)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_organization_plan_adjustment(p_organization_id UUID)
RETURNS TABLE (
  should_adjust BOOLEAN,
  current_plan TEXT,
  suggested_plan TEXT,
  current_members INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_org RECORD;
  v_required_plan TEXT;
BEGIN
  -- Get organization data
  SELECT
    o.subscription_plan,
    o.active_members_count
  INTO v_org
  FROM public.organizations o
  WHERE o.id = p_organization_id;

  -- If no subscription, nothing to adjust
  IF v_org.subscription_plan IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, NULL::TEXT, v_org.active_members_count, 'No subscription'::TEXT;
    RETURN;
  END IF;

  -- Determine required plan for current member count
  v_required_plan = get_required_plan_for_member_count(v_org.active_members_count);

  -- Check if downgrade is needed
  IF v_org.subscription_plan = 'b2b_ultra' AND v_required_plan IN ('b2b_pro', 'b2b_max') THEN
    RETURN QUERY SELECT
      true,
      v_org.subscription_plan,
      v_required_plan,
      v_org.active_members_count,
      'Member count dropped below current plan tier'::TEXT;
  ELSIF v_org.subscription_plan = 'b2b_max' AND v_required_plan = 'b2b_pro' THEN
    RETURN QUERY SELECT
      true,
      v_org.subscription_plan,
      v_required_plan,
      v_org.active_members_count,
      'Member count dropped below current plan tier'::TEXT;
  ELSE
    RETURN QUERY SELECT
      false,
      v_org.subscription_plan,
      v_org.subscription_plan,
      v_org.active_members_count,
      'Plan matches member count'::TEXT;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.check_organization_plan_adjustment IS
  'Checks if organization plan should be adjusted based on member count';

-- ============================================================================
-- 8. Grant execute permissions
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.check_organization_capacity TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_or_create_org_usage_period TO service_role;
GRANT EXECUTE ON FUNCTION public.get_organization_usage_limits TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_create_resource_org TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_organization_usage TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_required_plan_for_member_count TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_organization_plan_adjustment TO authenticated;
