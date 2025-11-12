# B2B Organization Subscriptions - Manual Deployment Actions

This document contains all manual actions required to complete the B2B organization subscription system deployment.

**IMPORTANT**: Follow these steps **in order**. Each section must be completed before moving to the next.

---

## Table of Contents

1. [Database Migrations](#1-database-migrations)
2. [Supabase Dashboard Configuration](#2-supabase-dashboard-configuration)
3. [Edge Functions Deployment](#3-edge-functions-deployment)
4. [Stripe Webhook Configuration](#4-stripe-webhook-configuration)
5. [Environment Variables & Secrets](#5-environment-variables--secrets)
6. [Testing Checklist](#6-testing-checklist)
7. [Monitoring & Maintenance](#7-monitoring--maintenance)

---

## 1. Database Migrations

### Apply All B2B Migrations

Run the following migrations in order via Supabase Dashboard:

1. **Navigate to**: Supabase Dashboard → SQL Editor
2. **Apply each migration file** in this exact order:

#### Migration 1: Organization Subscriptions Table
**File**: `supabase/migrations/20251104000001_create_organization_subscriptions.sql`

```sql
-- Creates organization_subscriptions table with Stripe integration
-- This migration is already in your codebase
```

#### Migration 2: Organization Subscription Fields
**File**: `supabase/migrations/20251104000002_add_subscription_fields_to_organizations.sql`

```sql
-- Adds subscription_plan, active_members_count, seat_limit to organizations
-- Creates triggers for automatic updates
```

#### Migration 3: Organization Monthly Usage (Per-Student Tracking)
**File**: `supabase/migrations/20251104000003_create_organization_monthly_usage.sql`

```sql
-- Creates organization_monthly_usage table
-- IMPORTANT: Tracks PER-STUDENT usage, not shared across organization
```

#### Migration 4: Business Logic Functions
**File**: `supabase/migrations/20251104000004_create_organization_functions.sql`

```sql
-- Creates 7 PostgreSQL functions:
-- - check_organization_capacity()
-- - get_or_create_org_usage_period()
-- - get_organization_usage_limits()
-- - can_create_resource_org()
-- - increment_organization_usage()
-- - get_required_plan_for_member_count()
-- - check_organization_plan_adjustment()
```

### Verification

After applying all migrations, verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('organization_subscriptions', 'organization_monthly_usage');

-- Check functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%organization%';

-- Should return 7 functions
```

---

## 2. Supabase Dashboard Configuration

### Update RLS Policies

#### For `organization_subscriptions` table:

1. **Navigate to**: Authentication → Policies → organization_subscriptions
2. **Verify these policies exist**:
   - `Organization admins can view subscription` (SELECT)
   - `Service role can manage subscriptions` (ALL)

#### For `organization_monthly_usage` table:

1. **Create policy for service role** (full access)
2. **Create policy for org members** (view own usage only)

```sql
-- Policy: Members can view own usage
CREATE POLICY "org_members_view_own_usage" ON organization_monthly_usage
FOR SELECT
USING (
  user_id = auth.uid() OR
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);
```

---

## 3. Edge Functions Deployment

### Deploy New Edge Function

#### create-org-checkout-session

**Command**:
```bash
npx supabase functions deploy create-org-checkout-session
```

**Purpose**: Creates Stripe checkout sessions for organization subscriptions

**Test**:
```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/create-org-checkout-session \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "test-org-id",
    "priceId": "price_1SNu6M37eeTawvFRnK6RfHSx",
    "billingPeriod": "monthly"
  }'
```

### Update Existing Edge Function

#### stripe-webhook

**IMPORTANT**: The stripe-webhook function has been updated to handle organization subscriptions.

**Re-deploy with**:
```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

**Note**: `--no-verify-jwt` is REQUIRED because Stripe sends unsigned requests.

**Verification**: Check logs after deployment:
```bash
npx supabase functions logs stripe-webhook --tail
```

---

## 4. Stripe Webhook Configuration

### Update Webhook Events

1. **Navigate to**: Stripe Dashboard → Developers → Webhooks
2. **Select** your existing webhook endpoint
3. **Add these events** (if not already present):
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### Test Webhook

Use Stripe CLI to send test events:

```bash
# Test organization subscription creation
~/.local/bin/stripe trigger customer.subscription.created \
  --add customer_subscription:metadata.organization_id=test-org-id

# Test organization subscription update (upgrade/downgrade)
~/.local/bin/stripe trigger customer.subscription.updated \
  --add customer_subscription:metadata.organization_id=test-org-id
```

**Expected Result**: Check Supabase logs for successful handling:
```bash
npx supabase functions logs stripe-webhook | grep "organization"
```

---

## 5. Environment Variables & Secrets

### Verify Supabase Secrets

Check that these secrets are set:

```bash
npx supabase secrets list
```

**Required secrets**:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (sk_live_... or sk_test_...)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (whsec_...)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key

**Set if missing**:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 6. Testing Checklist

### Functional Tests

Complete each test and check off:

#### ✅ Subscription Creation
- [ ] Admin can view organization plans (monthly/yearly toggle works)
- [ ] Clicking "Souscrire" opens plan selection
- [ ] Selecting a plan creates Stripe checkout session
- [ ] Completing payment creates organization_subscriptions record
- [ ] Webhook updates organizations table with plan and seat_limit
- [ ] Active members count displays correctly

#### ✅ Capacity Management
- [ ] Capacity percentage shows correctly (e.g., "15 / 20 membres")
- [ ] Capacity warning appears at 80% (orange)
- [ ] Capacity critical appears at 90% (red)
- [ ] Admin cannot approve member when at capacity
- [ ] OrganizationCapacityModal shows when capacity exceeded
- [ ] Modal displays upgrade options correctly

#### ✅ Member Approval Flow
- [ ] Pending member request appears
- [ ] Click "Approuver" checks capacity first
- [ ] If at capacity, shows modal with error
- [ ] If capacity available, approves member successfully
- [ ] Active members count increments

#### ✅ Member Removal & Auto-Downgrade
- [ ] Remove a member from organization
- [ ] Active members count decrements
- [ ] If member count drops below plan threshold, plan adjusts
- [ ] AutoDowngradeNotification shows with correct info
- [ ] Prorated credit is applied to next invoice
- [ ] New plan and seat limit are correct

#### ✅ Per-Student Usage Tracking
- [ ] Each student has individual usage record in organization_monthly_usage
- [ ] Student can create up to 30 exercises per month
- [ ] Student can create up to 30 fiches per month
- [ ] Student can use up to 60 AI minutes per month
- [ ] Student can create unlimited courses
- [ ] Usage resets on subscription anniversary date
- [ ] Usage from previous period does not carry over

#### ✅ Organization Member Restrictions
- [ ] User who is organization member sees UserOrganizationBanner on Profile page
- [ ] Banner shows organization name and plan benefits
- [ ] Banner explains they cannot buy individual subscription
- [ ] Attempting individual subscription checkout returns error
- [ ] Error message: "Vous êtes membre d'une organisation..."

#### ✅ Plan Upgrades
- [ ] Admin can upgrade from PRO → MAX
- [ ] Admin can upgrade from MAX → ULTRA
- [ ] Upgrade creates prorated invoice
- [ ] Seat limit increases immediately
- [ ] Old subscription is canceled
- [ ] New subscription is created

#### ✅ Plan Downgrades
- [ ] Admin can manually downgrade
- [ ] System auto-downgrades when members leave
- [ ] Downgrade credits unused time
- [ ] Seat limit decreases
- [ ] Existing members remain unaffected

#### ✅ Yearly Subscriptions
- [ ] Yearly tab displays prices correctly
- [ ] Yearly price is 12x monthly (no discount currently)
- [ ] Selecting yearly creates annual subscription
- [ ] Subscription renews yearly on anniversary
- [ ] Usage periods reset monthly (not yearly)

---

## 7. Monitoring & Maintenance

### Dashboard Queries for Monitoring

Save these queries in Supabase SQL Editor:

#### Active Organization Subscriptions
```sql
SELECT
  o.name AS organization_name,
  os.plan,
  os.status,
  o.active_members_count,
  o.seat_limit,
  os.current_period_end
FROM organizations o
JOIN organization_subscriptions os ON o.id = os.organization_id
WHERE os.status = 'active'
ORDER BY os.current_period_end DESC;
```

#### Organizations Near Capacity
```sql
SELECT
  o.name,
  o.active_members_count,
  o.seat_limit,
  ROUND((o.active_members_count::NUMERIC / o.seat_limit::NUMERIC) * 100, 2) AS capacity_percentage
FROM organizations o
WHERE o.seat_limit > 0
  AND (o.active_members_count::NUMERIC / o.seat_limit::NUMERIC) > 0.8
ORDER BY capacity_percentage DESC;
```

#### Per-Student Usage Report
```sql
SELECT
  o.name AS organization_name,
  p.full_name AS student_name,
  omu.exercises_created,
  omu.fiches_created,
  omu.ai_minutes_used,
  omu.period_start,
  omu.period_end
FROM organization_monthly_usage omu
JOIN organizations o ON omu.organization_id = o.id
JOIN profiles p ON omu.user_id = p.user_id
WHERE omu.period_start >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY o.name, p.full_name;
```

### Cron Jobs / Scheduled Tasks

**IMPORTANT**: Set up automated checks for:

1. **Usage Period Reset** (daily):
   - Check for subscriptions that have passed their period_end
   - Create new usage records for next period
   - (Optional) Send usage summary emails

2. **Capacity Alerts** (daily):
   - Query organizations at >90% capacity
   - Send admin notification to upgrade

3. **Failed Payments** (daily):
   - Check organization_subscriptions with status = 'past_due'
   - Send reminder emails
   - Auto-downgrade after grace period

---

## 8. Common Issues & Solutions

### Issue: Webhook not receiving events
**Solution**:
1. Check webhook URL in Stripe Dashboard
2. Verify `--no-verify-jwt` flag was used during deployment
3. Check Edge Function logs for errors
4. Test with Stripe CLI: `stripe listen --forward-to YOUR_FUNCTION_URL`

### Issue: Capacity check failing
**Solution**:
1. Verify triggers are active: `SELECT * FROM pg_trigger WHERE tgname LIKE '%org%';`
2. Manually update active_members_count: `UPDATE organizations SET active_members_count = (SELECT COUNT(*) FROM organization_members WHERE organization_id = 'ORG_ID' AND status = 'active');`

### Issue: Usage not resetting
**Solution**:
1. Check `get_or_create_org_usage_period` function
2. Verify period_start and period_end logic
3. Manually create new period if needed

### Issue: Auto-downgrade not working
**Solution**:
1. Check `check_organization_plan_adjustment` function
2. Verify it's called after member removal in useOrganizationMembers hook
3. Check function return value structure

---

## 9. Rollback Plan

If issues occur, rollback in reverse order:

1. **Disable webhooks** in Stripe Dashboard
2. **Rollback Edge Functions**:
   ```bash
   npx supabase functions deploy stripe-webhook --version PREVIOUS_VERSION
   npx supabase functions delete create-org-checkout-session
   ```
3. **Remove RLS policies** added in step 2
4. **Drop tables** (DANGER - only if needed):
   ```sql
   DROP TABLE IF EXISTS organization_monthly_usage CASCADE;
   DROP TABLE IF EXISTS organization_subscriptions CASCADE;
   ```

---

## 10. Support & Documentation

For reference, see:
- `B2B_ENHANCEMENT_COMPLETE.md` - Full technical implementation details
- `B2B_IMPLEMENTATION_SUMMARY.md` - Original implementation summary
- `SUBSCRIPTION_IMPLEMENTATION.md` - B2C subscription system (for comparison)

---

## Completion Checklist

Before considering deployment complete:

- [ ] All 4 migrations applied successfully
- [ ] RLS policies verified
- [ ] Both Edge Functions deployed and tested
- [ ] Stripe webhook configured and tested
- [ ] All secrets set correctly
- [ ] Functional tests passed (section 6)
- [ ] Monitoring queries saved
- [ ] Scheduled tasks configured
- [ ] Rollback plan documented and understood

---

**Date Completed**: _________________
**Deployed By**: _________________
**Production URL**: _________________

---

## Next Steps

After deployment:
1. Monitor webhook logs for 24 hours
2. Test with real Stripe payment in test mode
3. Create test organization and simulate full lifecycle
4. Train support team on org member restrictions
5. Update user documentation with B2B subscription flow

---

**IMPORTANT REMINDER**:

Users in organizations CANNOT purchase individual subscriptions. This is enforced at:
1. Frontend: `useUserOrganizationStatus` hook
2. Backend: `create-checkout-session` Edge Function
3. UI: `UserOrganizationBanner` component

Test this thoroughly before production deployment!
