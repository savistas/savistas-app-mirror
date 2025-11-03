-- Create user_subscriptions table
-- This table tracks user subscription details from Stripe
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Stripe identifiers
  stripe_customer_id text,
  stripe_subscription_id text,

  -- Subscription details
  plan text NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'pro')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trialing')),

  -- Billing period
  current_period_start timestamptz,
  current_period_end timestamptz,

  -- Cancellation
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamptz,

  -- Additional AI minutes purchased (accumulates, doesn't expire)
  ai_minutes_purchased integer DEFAULT 0 CHECK (ai_minutes_purchased >= 0),

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription_id ON public.user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON public.user_subscriptions(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_subscriptions_updated_at();

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own subscription
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own subscription (for initial creation)
CREATE POLICY "Users can create their own subscription"
  ON public.user_subscriptions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Only service role can update subscriptions (via Edge Functions)
CREATE POLICY "Service role can update subscriptions"
  ON public.user_subscriptions
  FOR UPDATE
  USING (true);

-- Initialize subscriptions for existing users
-- Create basic plan subscription for all users who don't have one yet
INSERT INTO public.user_subscriptions (user_id, plan, status, current_period_start, current_period_end)
SELECT
  id,
  'basic',
  'active',
  now(),
  now() + interval '1 month'
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_subscriptions WHERE user_id = auth.users.id
);

-- Comment
COMMENT ON TABLE public.user_subscriptions IS 'Stores user subscription information synced with Stripe';
COMMENT ON COLUMN public.user_subscriptions.ai_minutes_purchased IS 'Additional AI avatar minutes purchased (10, 30, or 60 min packs). These accumulate and do not expire.';
COMMENT ON COLUMN public.user_subscriptions.current_period_start IS 'Start date of current billing period (subscription anniversary date)';
COMMENT ON COLUMN public.user_subscriptions.current_period_end IS 'End date of current billing period';
