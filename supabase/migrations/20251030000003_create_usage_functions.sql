-- Function to get or create current usage period for a user
-- This function returns the current usage period based on the user's subscription anniversary date
CREATE OR REPLACE FUNCTION public.get_or_create_usage_period(p_user_id uuid)
RETURNS public.monthly_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscription public.user_subscriptions;
  v_usage public.monthly_usage;
  v_period_start date;
  v_period_end date;
BEGIN
  -- Get user's subscription
  SELECT * INTO v_subscription
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  IF v_subscription IS NULL THEN
    RAISE EXCEPTION 'No subscription found for user %', p_user_id;
  END IF;

  -- Calculate current period based on subscription anniversary
  v_period_start := DATE(v_subscription.current_period_start);
  v_period_end := DATE(v_subscription.current_period_end);

  -- Try to get existing usage record for current period
  SELECT * INTO v_usage
  FROM public.monthly_usage
  WHERE user_id = p_user_id
    AND period_start = v_period_start;

  -- If doesn't exist, create it
  IF v_usage IS NULL THEN
    INSERT INTO public.monthly_usage (
      user_id,
      period_start,
      period_end,
      courses_created,
      exercises_created,
      fiches_created,
      ai_minutes_used
    )
    VALUES (
      p_user_id,
      v_period_start,
      v_period_end,
      0, 0, 0, 0
    )
    RETURNING * INTO v_usage;
  END IF;

  RETURN v_usage;
END;
$$;

-- Function to increment usage counter
CREATE OR REPLACE FUNCTION public.increment_usage(
  p_user_id uuid,
  p_resource_type text,
  p_amount integer DEFAULT 1
)
RETURNS public.monthly_usage
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.monthly_usage;
BEGIN
  -- Get or create current usage period
  v_usage := public.get_or_create_usage_period(p_user_id);

  -- Increment the appropriate counter
  CASE p_resource_type
    WHEN 'course' THEN
      UPDATE public.monthly_usage
      SET courses_created = courses_created + p_amount
      WHERE id = v_usage.id
      RETURNING * INTO v_usage;

    WHEN 'exercise' THEN
      UPDATE public.monthly_usage
      SET exercises_created = exercises_created + p_amount
      WHERE id = v_usage.id
      RETURNING * INTO v_usage;

    WHEN 'fiche' THEN
      UPDATE public.monthly_usage
      SET fiches_created = fiches_created + p_amount
      WHERE id = v_usage.id
      RETURNING * INTO v_usage;

    WHEN 'ai_minutes' THEN
      UPDATE public.monthly_usage
      SET ai_minutes_used = ai_minutes_used + p_amount
      WHERE id = v_usage.id
      RETURNING * INTO v_usage;

    ELSE
      RAISE EXCEPTION 'Invalid resource type: %', p_resource_type;
  END CASE;

  RETURN v_usage;
END;
$$;

-- Function to get usage limits for a user based on their plan
CREATE OR REPLACE FUNCTION public.get_usage_limits(p_user_id uuid)
RETURNS TABLE (
  courses_limit integer,
  exercises_limit integer,
  fiches_limit integer,
  ai_minutes_limit integer,
  max_days_per_course integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_ai_minutes_purchased integer;
BEGIN
  -- Get user's subscription plan and purchased AI minutes
  SELECT
    us.plan,
    us.ai_minutes_purchased
  INTO v_plan, v_ai_minutes_purchased
  FROM public.user_subscriptions us
  WHERE us.user_id = p_user_id;

  -- If no subscription found, assume basic
  IF v_plan IS NULL THEN
    v_plan := 'basic';
    v_ai_minutes_purchased := 0;
  END IF;

  -- Return limits based on plan
  RETURN QUERY
  SELECT
    CASE v_plan
      WHEN 'basic' THEN 2
      WHEN 'premium' THEN 10
      WHEN 'pro' THEN 30
      ELSE 2
    END AS courses_limit,

    CASE v_plan
      WHEN 'basic' THEN 2
      WHEN 'premium' THEN 10
      WHEN 'pro' THEN 30
      ELSE 2
    END AS exercises_limit,

    CASE v_plan
      WHEN 'basic' THEN 2
      WHEN 'premium' THEN 10
      WHEN 'pro' THEN 30
      ELSE 2
    END AS fiches_limit,

    CASE v_plan
      WHEN 'basic' THEN 3 + v_ai_minutes_purchased
      WHEN 'premium' THEN v_ai_minutes_purchased
      WHEN 'pro' THEN v_ai_minutes_purchased
      ELSE 3
    END AS ai_minutes_limit,

    10 AS max_days_per_course; -- Same for all plans
END;
$$;

-- Function to check if user can create a resource
CREATE OR REPLACE FUNCTION public.can_create_resource(
  p_user_id uuid,
  p_resource_type text
)
RETURNS TABLE (
  allowed boolean,
  current_usage integer,
  limit_value integer,
  remaining integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_usage public.monthly_usage;
  v_limits RECORD;
  v_current integer;
  v_limit integer;
BEGIN
  -- Get current usage
  v_usage := public.get_or_create_usage_period(p_user_id);

  -- Get limits
  SELECT * INTO v_limits FROM public.get_usage_limits(p_user_id);

  -- Get current usage and limit based on resource type
  CASE p_resource_type
    WHEN 'course' THEN
      v_current := v_usage.courses_created;
      v_limit := v_limits.courses_limit;

    WHEN 'exercise' THEN
      v_current := v_usage.exercises_created;
      v_limit := v_limits.exercises_limit;

    WHEN 'fiche' THEN
      v_current := v_usage.fiches_created;
      v_limit := v_limits.fiches_limit;

    WHEN 'ai_minutes' THEN
      v_current := v_usage.ai_minutes_used;
      v_limit := v_limits.ai_minutes_limit;

    ELSE
      RAISE EXCEPTION 'Invalid resource type: %', p_resource_type;
  END CASE;

  -- Return result
  RETURN QUERY
  SELECT
    (v_current < v_limit) AS allowed,
    v_current AS current_usage,
    v_limit AS limit_value,
    GREATEST(0, v_limit - v_current) AS remaining;
END;
$$;

-- Comments
COMMENT ON FUNCTION public.get_or_create_usage_period IS 'Gets or creates the current usage period for a user based on their subscription anniversary date';
COMMENT ON FUNCTION public.increment_usage IS 'Increments a usage counter for a specific resource type';
COMMENT ON FUNCTION public.get_usage_limits IS 'Returns the usage limits for a user based on their subscription plan';
COMMENT ON FUNCTION public.can_create_resource IS 'Checks if a user can create a resource based on their current usage and limits';
