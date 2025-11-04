-- Add subscription-related fields to organizations table
-- These fields help track subscription status and member capacity

-- Add subscription_plan column
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS subscription_plan TEXT
CHECK (subscription_plan IN ('b2b_pro', 'b2b_max', 'b2b_ultra'));

-- Add active_members_count column (cached count for performance)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS active_members_count INTEGER NOT NULL DEFAULT 0;

-- Add seat_limit column (derived from subscription plan)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS seat_limit INTEGER;

-- Create index for subscription_plan
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_plan
  ON public.organizations(subscription_plan);

-- Create index for active_members_count
CREATE INDEX IF NOT EXISTS idx_organizations_active_members_count
  ON public.organizations(active_members_count);

-- Function to calculate seat limit based on plan
CREATE OR REPLACE FUNCTION public.get_seat_limit_for_plan(p_plan TEXT)
RETURNS INTEGER AS $$
BEGIN
  CASE p_plan
    WHEN 'b2b_pro' THEN RETURN 20;
    WHEN 'b2b_max' THEN RETURN 50;
    WHEN 'b2b_ultra' THEN RETURN 100;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to update seat_limit when subscription_plan changes
CREATE OR REPLACE FUNCTION public.update_organization_seat_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subscription_plan IS NOT NULL THEN
    NEW.seat_limit = get_seat_limit_for_plan(NEW.subscription_plan);
  ELSE
    NEW.seat_limit = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update seat_limit
CREATE TRIGGER trigger_update_organization_seat_limit
  BEFORE INSERT OR UPDATE OF subscription_plan ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_seat_limit();

-- Function to update active_members_count
CREATE OR REPLACE FUNCTION public.update_organization_member_count()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_count INTEGER;
BEGIN
  -- Determine which organization to update
  IF TG_OP = 'DELETE' THEN
    v_org_id = OLD.organization_id;
  ELSE
    v_org_id = NEW.organization_id;
  END IF;

  -- Count active members
  SELECT COUNT(*)
  INTO v_count
  FROM public.organization_members
  WHERE organization_id = v_org_id
  AND status = 'active';

  -- Update the organization
  UPDATE public.organizations
  SET active_members_count = v_count
  WHERE id = v_org_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on organization_members to update count
DROP TRIGGER IF EXISTS trigger_update_org_member_count_on_insert ON public.organization_members;
CREATE TRIGGER trigger_update_org_member_count_on_insert
  AFTER INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_member_count();

DROP TRIGGER IF EXISTS trigger_update_org_member_count_on_update ON public.organization_members;
CREATE TRIGGER trigger_update_org_member_count_on_update
  AFTER UPDATE OF status ON public.organization_members
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.update_organization_member_count();

DROP TRIGGER IF EXISTS trigger_update_org_member_count_on_delete ON public.organization_members;
CREATE TRIGGER trigger_update_org_member_count_on_delete
  AFTER DELETE ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_member_count();

-- Initialize active_members_count for existing organizations
UPDATE public.organizations
SET active_members_count = (
  SELECT COUNT(*)
  FROM public.organization_members
  WHERE organization_members.organization_id = organizations.id
  AND organization_members.status = 'active'
);

-- Add comments
COMMENT ON COLUMN public.organizations.subscription_plan IS
  'Current B2B subscription plan (b2b_pro, b2b_max, b2b_ultra)';

COMMENT ON COLUMN public.organizations.active_members_count IS
  'Cached count of active members for performance';

COMMENT ON COLUMN public.organizations.seat_limit IS
  'Maximum number of members allowed based on subscription plan';
