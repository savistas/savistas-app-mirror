-- Create monthly_usage table
-- This table tracks resource usage per billing period
CREATE TABLE IF NOT EXISTS public.monthly_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Period boundaries (based on subscription anniversary date)
  period_start date NOT NULL,
  period_end date NOT NULL,

  -- Usage counters
  courses_created integer DEFAULT 0 CHECK (courses_created >= 0),
  exercises_created integer DEFAULT 0 CHECK (exercises_created >= 0),
  fiches_created integer DEFAULT 0 CHECK (fiches_created >= 0),
  ai_minutes_used integer DEFAULT 0 CHECK (ai_minutes_used >= 0),

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure one record per user per period
  UNIQUE(user_id, period_start)
);

-- Create indexes for faster lookups
CREATE INDEX idx_monthly_usage_user_id ON public.monthly_usage(user_id);
CREATE INDEX idx_monthly_usage_period_start ON public.monthly_usage(period_start);
CREATE INDEX idx_monthly_usage_user_period ON public.monthly_usage(user_id, period_start);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_monthly_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_usage_updated_at
  BEFORE UPDATE ON public.monthly_usage
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_monthly_usage_updated_at();

-- Enable RLS
ALTER TABLE public.monthly_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own usage
CREATE POLICY "Users can view their own usage"
  ON public.monthly_usage
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage usage (via Edge Functions)
CREATE POLICY "Service role can manage usage"
  ON public.monthly_usage
  FOR ALL
  USING (true);

-- Comment
COMMENT ON TABLE public.monthly_usage IS 'Tracks monthly resource usage per user based on subscription billing period';
COMMENT ON COLUMN public.monthly_usage.period_start IS 'Start date of the usage period (subscription anniversary date)';
COMMENT ON COLUMN public.monthly_usage.period_end IS 'End date of the usage period (one month after period_start)';
