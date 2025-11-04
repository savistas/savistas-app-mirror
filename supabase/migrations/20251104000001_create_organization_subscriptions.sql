-- Create organization_subscriptions table for B2B subscription management
-- This table stores Stripe subscription data for organizations

CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('b2b_pro', 'b2b_max', 'b2b_ultra')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active',
    'canceled',
    'past_due',
    'incomplete',
    'incomplete_expired',
    'trialing',
    'unpaid'
  )),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 month'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_organization_id
  ON public.organization_subscriptions(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_customer_id
  ON public.organization_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_stripe_subscription_id
  ON public.organization_subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_status
  ON public.organization_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_plan
  ON public.organization_subscriptions(plan);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_organization_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_subscriptions_updated_at
  BEFORE UPDATE ON public.organization_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_subscriptions_updated_at();

-- Enable Row Level Security
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Organization creators/admins can view their organization's subscription
CREATE POLICY "Organization admins can view their subscription"
  ON public.organization_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = organization_subscriptions.organization_id
      AND organizations.created_by = auth.uid()
    )
  );

-- Service role can manage all subscriptions (for Stripe webhooks)
CREATE POLICY "Service role can manage all subscriptions"
  ON public.organization_subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE public.organization_subscriptions IS
  'Stores B2B organization subscription data from Stripe';
