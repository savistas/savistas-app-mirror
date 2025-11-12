-- Create organization_monthly_usage table for per-student usage tracking
-- Each student in an organization has their own monthly usage limits

CREATE TABLE IF NOT EXISTS public.organization_monthly_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  courses_created INTEGER NOT NULL DEFAULT 0,
  exercises_created INTEGER NOT NULL DEFAULT 0,
  fiches_created INTEGER NOT NULL DEFAULT 0,
  ai_minutes_used INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_org_user_period UNIQUE (organization_id, user_id, period_start)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_organization_monthly_usage_org_id
  ON public.organization_monthly_usage(organization_id);

CREATE INDEX IF NOT EXISTS idx_organization_monthly_usage_user_id
  ON public.organization_monthly_usage(user_id);

CREATE INDEX IF NOT EXISTS idx_organization_monthly_usage_period_start
  ON public.organization_monthly_usage(period_start);

CREATE INDEX IF NOT EXISTS idx_organization_monthly_usage_org_user
  ON public.organization_monthly_usage(organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_organization_monthly_usage_org_user_period
  ON public.organization_monthly_usage(organization_id, user_id, period_start);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_organization_monthly_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_organization_monthly_usage_updated_at
  BEFORE UPDATE ON public.organization_monthly_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_monthly_usage_updated_at();

-- Enable Row Level Security
ALTER TABLE public.organization_monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own usage within their organization
CREATE POLICY "Users can view own organization usage"
  ON public.organization_monthly_usage
  FOR SELECT
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.organization_id = organization_monthly_usage.organization_id
      AND organization_members.user_id = auth.uid()
      AND organization_members.status = 'active'
    )
  );

-- Organization admins can view all member usage
CREATE POLICY "Organization admins can view all member usage"
  ON public.organization_monthly_usage
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = organization_monthly_usage.organization_id
      AND organizations.created_by = auth.uid()
    )
  );

-- Service role can manage all usage records
CREATE POLICY "Service role can manage all usage"
  ON public.organization_monthly_usage
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role')
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Add comment
COMMENT ON TABLE public.organization_monthly_usage IS
  'Tracks per-student monthly usage within B2B organizations';

COMMENT ON COLUMN public.organization_monthly_usage.organization_id IS
  'The organization this usage belongs to';

COMMENT ON COLUMN public.organization_monthly_usage.user_id IS
  'The student/user whose usage is tracked';

COMMENT ON COLUMN public.organization_monthly_usage.period_start IS
  'Start date of the usage period (based on organization subscription anniversary)';

COMMENT ON COLUMN public.organization_monthly_usage.period_end IS
  'End date of the usage period';

COMMENT ON COLUMN public.organization_monthly_usage.courses_created IS
  'Number of courses created (unlimited for B2B, tracked for reference only)';

COMMENT ON COLUMN public.organization_monthly_usage.exercises_created IS
  'Number of exercises created (limit: 30 per student per month)';

COMMENT ON COLUMN public.organization_monthly_usage.fiches_created IS
  'Number of revision sheets created (limit: 30 per student per month)';

COMMENT ON COLUMN public.organization_monthly_usage.ai_minutes_used IS
  'AI avatar minutes used (limit: 60 per student per month)';
