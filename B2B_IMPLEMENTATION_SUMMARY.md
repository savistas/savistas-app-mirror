# B2B Subscription Implementation Summary

## 📋 Overview

This document summarizes the B2B subscription system implementation for Savistas AI-Cademy and lists all manual actions required to complete the deployment.

**Implementation Date:** November 4, 2025
**Status:** Foundational work completed, UI components and final integration pending

---

## ✅ Completed Work

### 1. Database Schema & Migrations (4 files)

#### Migration 1: `organization_subscriptions` table
**File:** `supabase/migrations/20251104000001_create_organization_subscriptions.sql`

Created table to store B2B subscription data:
- Links organizations to Stripe subscriptions
- Tracks plan type (b2b_pro, b2b_max, b2b_ultra)
- Stores billing periods and subscription status
- RLS policies for security

#### Migration 2: Organization table updates
**File:** `supabase/migrations/20251104000002_add_subscription_fields_to_organizations.sql`

Added fields to `organizations` table:
- `subscription_plan` - Current B2B plan
- `active_members_count` - Cached member count
- `seat_limit` - Max members allowed

Created triggers to auto-update these fields.

#### Migration 3: `organization_monthly_usage` table
**File:** `supabase/migrations/20251104000003_create_organization_monthly_usage.sql`

Created per-student usage tracking within organizations:
- Tracks courses, exercises, fiches, AI minutes per student
- Enforces per-student limits (30/30/60)
- Unique constraint per organization/user/period

#### Migration 4: PostgreSQL Functions
**File:** `supabase/migrations/20251104000004_create_organization_functions.sql`

Implemented 7 business logic functions:
1. `check_organization_capacity()` - Verify if can add members
2. `get_or_create_org_usage_period()` - Manage usage periods
3. `get_organization_usage_limits()` - Return per-student limits
4. `can_create_resource_org()` - Check resource limits
5. `increment_organization_usage()` - Update usage counters
6. `get_required_plan_for_member_count()` - Plan calculation
7. `check_organization_plan_adjustment()` - Auto-downgrade logic

### 2. Constants & Configuration

#### Organization Plans Config
**File:** `src/constants/organizationPlans.ts`

Defines all 3 B2B plans with:
- Stripe product/price IDs
- Seat ranges (1-20, 21-50, 51-100)
- Per-student limits (30/30/60/unlimited)
- Helper functions for plan logic

**Key Constants:**
```typescript
PRO:   1200€/month (1-20 users)
MAX:   3000€/month (21-50 users)
ULTRA: 5000€/month (51-100 users)
```

### 3. TypeScript Types

**File:** `src/types/organizationSubscription.ts`

Complete type definitions for:
- OrganizationSubscription
- OrganizationMonthlyUsage
- OrganizationUsageLimits
- OrganizationCapacityCheck
- OrganizationWithSubscription

### 4. Utility Functions

**File:** `src/utils/organizationPlanHelpers.ts`

20+ helper functions including:
- Seat limit calculations
- Capacity percentage/status
- Plan upgrade/downgrade logic
- Message generation
- Auto-downgrade detection

### 5. Services

#### Organization Subscription Service
**File:** `src/services/organizationSubscriptionService.ts`

Complete service layer for:
- Fetching organization subscriptions
- Checking capacity and usage
- Creating checkout sessions
- Canceling subscriptions
- Usage increment/tracking

#### Updated Usage Service
**File:** `src/services/usageService.ts` (MODIFIED)

Enhanced to auto-detect organization membership:
- Automatically uses org limits for org members
- Falls back to individual limits for non-members
- Transparent usage tracking

### 6. React Hooks (3 files)

#### useOrganizationSubscription
**File:** `src/hooks/useOrganizationSubscription.ts`

- Fetches organization subscription data
- Provides plan info, seat limits, member counts
- Mutations for checkout creation and cancellation

#### useOrganizationCapacity
**File:** `src/hooks/useOrganizationCapacity.ts`

- Real-time capacity checking
- Computed values (percentage, status, isFull)
- Auto-refresh every minute

#### useOrganizationUsageLimits
**File:** `src/hooks/useOrganizationUsageLimits.ts`

- Per-student usage tracking
- Limit checking per resource type
- Helper functions for UI display

### 7. Edge Functions

#### create-org-checkout-session
**File:** `supabase/functions/create-org-checkout-session/index.ts`

Complete Stripe checkout handler for organizations:
- Verifies organization admin permissions
- Creates/retrieves Stripe customers
- Handles subscription upgrades with proration
- Returns checkout URL

---

## ⚠️ PENDING WORK

### High Priority (Required for Functionality)

#### 1. Update stripe-webhook Edge Function
**File:** `supabase/functions/stripe-webhook/index.ts`

**Required Changes:**
```typescript
// Add B2B product mappings
const ORG_PRODUCT_TO_PLAN: Record<string, string> = {
  'prod_TKZEnwNiSwAjiu': 'b2b_pro',
  'prod_TKZEg8FhoYWpQp': 'b2b_max',
  'prod_TKZEwBnUONQnHD': 'b2b_ultra',
};

// Add handler functions:
- handleOrgSubscriptionCreated()
- handleOrgSubscriptionUpdated()
- handleOrgSubscriptionDeleted()
- handleOrgRenewal()

// Update switch statement to detect organization vs individual subscriptions
// Check session.metadata.organization_id to route to org handlers
```

#### 2. Update useOrganizationMembers Hook
**File:** `src/hooks/useOrganizationMembers.ts`

**Required Changes:**
- Import `useOrganizationCapacity` hook
- Check capacity before adding members
- Show OrganizationCapacityModal if full
- Trigger auto-downgrade check after member removal
- Call `check_organization_plan_adjustment()` function

### Medium Priority (UI Components)

All components below need to be created in `src/components/organization/`:

1. **OrganizationSubscriptionCard.tsx**
   - Display current plan, seat usage, renewal date
   - Show per-student limits info
   - Buttons for upgrade/downgrade/cancel

2. **OrganizationPlanSelection.tsx**
   - Grid of 3 B2B plans
   - Highlight current plan
   - Feature comparison
   - Call to action buttons

3. **OrganizationCapacityModal.tsx**
   - "Organization is full" message
   - Suggest upgrade to next plan
   - Link to OrganizationPlanSelection

4. **MemberJoinBlockedModal.tsx**
   - Shown to user trying to join full org
   - "Organization cannot accept you" message

5. **AutoDowngradeNotification.tsx**
   - Alert after automatic downgrade
   - Display old and new plan

6. **OrganizationPlanDetailsDialog.tsx**
   - Detailed plan comparison modal
   - Proration calculation display

7. **OrganizationUpgradeDialog.tsx**
   - Wrapper for upgrade flow
   - Combines plan selection + details + checkout

### Medium Priority (Page Updates)

1. **Update DashboardOrganization.tsx**
   - Import and display OrganizationSubscriptionCard
   - Add subscription management section
   - Handle capacity modals

---

## 🔧 MANUAL ACTIONS REQUIRED

### Step 1: Database Setup (Via Supabase Dashboard)

1. **Run All Migrations**
   ```bash
   # Option A: If you have Supabase CLI and want to apply locally first
   npx supabase db push

   # Option B: Manually via Supabase Dashboard
   # Navigate to SQL Editor and run each migration file in order:
   # 1. 20251104000001_create_organization_subscriptions.sql
   # 2. 20251104000002_add_subscription_fields_to_organizations.sql
   # 3. 20251104000003_create_organization_monthly_usage.sql
   # 4. 20251104000004_create_organization_functions.sql
   ```

2. **Verify Tables Created**
   - Check `organization_subscriptions` table exists
   - Check `organization_monthly_usage` table exists
   - Verify new columns on `organizations` table:
     - `subscription_plan`
     - `active_members_count`
     - `seat_limit`

3. **Verify Functions Created**
   - Navigate to Database → Functions
   - Confirm all 7 functions are listed

4. **Check RLS Policies**
   - Verify policies created for `organization_subscriptions`
   - Verify policies created for `organization_monthly_usage`

### Step 2: Generate TypeScript Types

After running migrations, regenerate Supabase types:

```bash
npx supabase gen types typescript --local > src/integrations/supabase/types.ts
```

Or if using remote:
```bash
npx supabase gen types typescript --project-id vvmkbpkoccxpmfpxhacv > src/integrations/supabase/types.ts
```

### Step 3: Deploy Edge Functions

```bash
# Deploy new organization checkout function
npx supabase functions deploy create-org-checkout-session

# Update webhook function (AFTER you modify it per pending work)
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

### Step 4: Stripe Webhook Configuration

1. **Get Webhook Endpoint URL**
   ```
   https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook
   ```

2. **Add Endpoint in Stripe Dashboard**
   - Navigate to Developers → Webhooks
   - If endpoint already exists, verify it includes these events:
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

3. **Get Webhook Secret**
   - Copy the webhook signing secret
   - Update Supabase secrets:
   ```bash
   npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Step 5: Verify Stripe Products (Already Created ✅)

The B2B products are already set up in Stripe:

| Plan | Product ID | Price ID | Monthly Price |
|------|-----------|---------|---------------|
| PRO | prod_TKZEnwNiSwAjiu | price_1SNu6M37eeTawvFRnK6RfHSx | 1200€ |
| MAX | prod_TKZEg8FhoYWpQp | price_1SNu6L37eeTawvFR3rSzsjbQ | 3000€ |
| ULTRA | prod_TKZEwBnUONQnHD | price_1SNu6J37eeTawvFRw1XwsG3Q | 5000€ |

✅ No action needed here!

### Step 6: Testing Checklist

Once all pending work is completed and deployed:

#### Basic Flow Tests
- [ ] Create organization as school/company
- [ ] Subscribe to PRO plan (1-20 users)
- [ ] Add 10 members successfully
- [ ] Verify per-student usage limits work
- [ ] Create courses (should be unlimited)
- [ ] Create exercises (should limit at 30 per student)
- [ ] Create fiches (should limit at 30 per student)
- [ ] Use AI agent (should limit at 60 min per student)

#### Capacity Tests
- [ ] Add 20 members to PRO plan (should succeed)
- [ ] Try to add 21st member (should show upgrade modal)
- [ ] Upgrade to MAX plan
- [ ] Add member 21-30 (should succeed)
- [ ] Verify proration appears on Stripe invoice

#### Auto-Downgrade Tests
- [ ] Have 50 members on MAX plan
- [ ] Remove members until 20 remain
- [ ] Verify auto-downgrade to PRO triggers
- [ ] Verify downgrade notification shown
- [ ] Check Stripe subscription updated
- [ ] Verify proration credit applied

#### Edge Cases
- [ ] Try to downgrade manually with too many members (should block)
- [ ] Cancel subscription (should take effect at period end)
- [ ] Test payment failure scenario
- [ ] User tries to join full organization (should be blocked)
- [ ] Organization at 20 members on PRO invites 21st (blocked until upgrade)

---

## 📂 File Structure Summary

### Created Files (17)
```
src/
├── constants/
│   └── organizationPlans.ts ✅
├── types/
│   └── organizationSubscription.ts ✅
├── utils/
│   └── organizationPlanHelpers.ts ✅
├── services/
│   └── organizationSubscriptionService.ts ✅
├── hooks/
│   ├── useOrganizationSubscription.ts ✅
│   ├── useOrganizationCapacity.ts ✅
│   └── useOrganizationUsageLimits.ts ✅
└── components/
    └── organization/
        ├── OrganizationSubscriptionCard.tsx ❌
        ├── OrganizationPlanSelection.tsx ❌
        ├── OrganizationCapacityModal.tsx ❌
        ├── MemberJoinBlockedModal.tsx ❌
        ├── AutoDowngradeNotification.tsx ❌
        ├── OrganizationPlanDetailsDialog.tsx ❌
        └── OrganizationUpgradeDialog.tsx ❌

supabase/
├── migrations/
│   ├── 20251104000001_create_organization_subscriptions.sql ✅
│   ├── 20251104000002_add_subscription_fields_to_organizations.sql ✅
│   ├── 20251104000003_create_organization_monthly_usage.sql ✅
│   └── 20251104000004_create_organization_functions.sql ✅
└── functions/
    └── create-org-checkout-session/
        └── index.ts ✅
```

### Modified Files (2)
```
src/
├── services/
│   └── usageService.ts ✅
└── hooks/
    └── useOrganizationMembers.ts ❌ (NEEDS UPDATE)

supabase/
└── functions/
    └── stripe-webhook/
        └── index.ts ❌ (NEEDS UPDATE)
```

### To Be Modified (1)
```
src/
└── pages/
    └── DashboardOrganization.tsx ❌ (NEEDS UPDATE)
```

---

## 🎯 Next Steps Priority

### Immediate (Critical Path)
1. ✅ Run all 4 database migrations via Supabase Dashboard
2. ✅ Regenerate TypeScript types
3. ⚠️  Update `stripe-webhook` Edge Function with org support
4. ✅ Deploy `create-org-checkout-session` Edge Function
5. ⚠️  Update `useOrganizationMembers` hook with capacity checks

### Short Term (Complete Feature)
6. Create all 7 UI components listed above
7. Update `DashboardOrganization` page
8. Full end-to-end testing

### Optional Enhancements
- Email notifications for plan changes
- Admin dashboard for viewing all org subscriptions
- Analytics for organization usage patterns
- Bulk member import feature
- Custom seat limits (override defaults)

---

## 💡 Implementation Notes

### Auto-Downgrade Logic
- Triggers when `active_members_count` drops below plan tier minimum
- Example: MAX plan (21-50) → 20 members → auto-downgrade to PRO
- Handled by `check_organization_plan_adjustment()` function
- Should be called after member removal in `useOrganizationMembers`

### Proration Handling
- Stripe automatically handles proration on plan changes
- `proration_behavior: 'create_prorations'` in checkout session
- Credits unused time when upgrading
- Charges pro-rated amount when downgrading

### Usage Tracking Architecture
- Individual users: `monthly_usage` table
- Organization members: `organization_monthly_usage` table
- `usageService.ts` auto-detects which to use
- No code changes needed in resource creation logic!

### Security Considerations
- RLS policies enforce organization admin access
- Only `created_by` user can manage subscriptions
- Service role bypasses RLS for webhook updates
- Edge Functions verify user authentication

---

## 📞 Support & Questions

If you encounter issues during implementation:

1. **Database Errors**: Check Supabase logs in Dashboard → Logs
2. **Stripe Webhook Failures**: Check Stripe Dashboard → Webhooks → Recent Events
3. **Edge Function Errors**: Check Supabase Dashboard → Edge Functions → Logs
4. **Type Errors**: Regenerate types after schema changes

For questions about this implementation, refer to:
- CLAUDE.md (project documentation)
- SUBSCRIPTION_IMPLEMENTATION.md (B2C reference)
- This file (B2B_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated:** November 4, 2025
**Implementation Progress:** ~65% Complete
