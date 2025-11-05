# Seat-Based Billing Migration - Complete Implementation

## Overview
Successfully migrated from plan-based billing (b2b_pro, b2b_max, b2b_ultra) to a pure seat-based billing system with progressive tier pricing.

## What Changed

### 1. Database Schema (`20251106000000_migrate_to_seat_only_billing.sql`)

**Removed:**
- `organizations.subscription_plan` column and CHECK constraint
- All plan-based functions:
  - `get_included_seats_for_plan()`
  - `get_seat_limit_for_plan()`
  - `get_max_purchasable_seats()`
  - `recalculate_seat_limit_on_plan_change()`
  - `update_organization_seat_limit()`
  - `sync_organization_seat_limit()`
- All plan-based triggers

**Added:**
- `organization_subscriptions.total_seats` - Total purchased seats (1-100)
- `organization_subscriptions.tier_1_seats` - Seats at €35/month (max 20)
- `organization_subscriptions.tier_2_seats` - Seats at €32/month (max 30)
- `organization_subscriptions.tier_3_seats` - Seats at €29/month (max 50)
- `organization_subscriptions.billing_period` - 'monthly' or 'yearly'
- `organization_subscriptions.next_billing_date` - Tracks next renewal
- `organization_subscriptions.seats_pending_decrease` - For scheduled reductions

**New Functions:**
- `calculate_tier_breakdown(total_seats)` - Splits seats across tiers
- `calculate_seat_cost(tier_1, tier_2, tier_3, period)` - Computes total cost
- `sync_seat_limit_from_subscription()` - Syncs org.seat_limit with subscription

**New View:**
- `organization_billing_summary` - Comprehensive billing overview

### 2. Edge Functions

**Deleted:**
- `create-org-checkout-session/` - No longer needed (plan-based)

**Completely Rewritten:**
- `create-seat-checkout-session/index.ts`
  - Removed all plan dependencies
  - Implements progressive tier pricing
  - Handles seat increases with immediate proration
  - Manages multiple Stripe line items (one per tier)
  - No minimum seat requirement

### 3. Progressive Tier Pricing

**How It Works:**
```
Example: 35 seats
- Tier 1: 20 seats × €35 = €700/month
- Tier 2: 15 seats × €32 = €480/month
- Total: €1,180/month
```

**Stripe Structure:**
Each subscription has up to 3 line items:
```javascript
{
  items: [
    { price: tier_1_price_id, quantity: 20 },
    { price: tier_2_price_id, quantity: 15 },
  ]
}
```

**Price IDs:**
- Tier 1 (1-20): `price_1SPt4237eeTawvFRmxg2xSQv` (€35/month)
- Tier 2 (21-50): `price_1SPt4537eeTawvFRskKJeO4a` (€32/month)
- Tier 3 (51-100): `price_1SPt4837eeTawvFRKF3WzGwQ` (€29/month)

### 4. Frontend Changes

**Updated Files:**
- `src/constants/organizationPlans.ts` - Removed plan types, added tier pricing
- `src/utils/organizationPlanHelpers.ts` - Simplified to seat-only functions
- `src/hooks/useOrganizationSubscription.ts` - No more plan logic
- `src/components/organization/SeatPurchaseModal.tsx` - Shows tier breakdown
- `src/components/organization/OrganizationSubscriptionCard.tsx` - Seat-focused UI
- `src/components/organization/OrganizationCapacityModal.tsx` - Suggests seat purchase
- `src/components/organization/UserOrganizationBanner.tsx` - Removed plan badge
- `src/pages/Profile.tsx` - Removed plan selection
- `src/pages/DashboardOrganization.tsx` - Removed auto-downgrade notification

**Deleted Files:**
- `src/components/organization/OrganizationPlanSelection.tsx`
- `src/components/organization/AutoDowngradeNotification.tsx`

## How Billing Now Works

### First-Time Seat Purchase
1. Admin selects seat count (1-100)
2. System calculates tier breakdown
3. Creates Stripe checkout with multiple line items
4. On payment success, webhook updates database
5. Organization seat_limit = total_seats

### Seat Increase
1. Admin increases seat count
2. System updates Stripe subscription quantities
3. Stripe automatically prorates and bills immediately
4. New billing cycle starts from purchase date
5. Database updated via webhook

### Seat Decrease (To Be Implemented)
1. Admin requests seat reduction
2. System uses Stripe subscription schedule
3. Decrease applied at next renewal date
4. Seats removed at end of current billing period
5. No refunds issued

### Billing Cycles
- Each subscription has ONE renewal date
- When seats are added, Stripe prorates to align with existing cycle
- Proration ensures fair billing for partial months
- All seats eventually align to the same renewal date

## Deployment Steps

### 1. Apply Database Migration
```bash
# Local development
npx supabase db reset

# Production
npx supabase db push
```

### 2. Deploy Edge Function
```bash
npx supabase functions deploy create-seat-checkout-session
```

### 3. Verify Stripe Configuration
Ensure price IDs match in both:
- Edge function (`create-seat-checkout-session/index.ts`)
- Database constants (`organizationPlans.ts`)

### 4. Test Flow
1. Create test organization
2. Purchase seats (test progressive pricing)
3. Increase seats (verify proration)
4. Check database updates
5. Verify Stripe subscription structure

## Key Benefits

✅ **Simplified Architecture** - No complex plan tiers to manage
✅ **Fair Pricing** - Pay less per seat as you scale
✅ **Flexible Scaling** - Any seat count from 1-100
✅ **Transparent Costs** - Clear tier breakdown in UI
✅ **Automatic Proration** - Stripe handles billing complexity
✅ **No Minimums** - Start with just 1 seat

## Important Notes

### Database Integrity
- `total_seats` must equal sum of `tier_1_seats + tier_2_seats + tier_3_seats`
- This is enforced by CHECK constraint
- Trigger automatically syncs `organizations.seat_limit`

### Stripe Behavior
- Proration is immediate on seat increases
- No prorated refunds on seat decreases
- Subscription keeps same renewal date
- Multiple line items allow native tier pricing

### Backwards Compatibility
- Old `subscription_plan` column removed
- Existing organizations will have `seat_limit = 0` until they subscribe
- No data migration needed (clean break from old system)

## Monitoring

### Check Billing Status
```sql
SELECT * FROM organization_billing_summary;
```

### Verify Tier Breakdown
```sql
SELECT
  organization_id,
  total_seats,
  tier_1_seats,
  tier_2_seats,
  tier_3_seats,
  calculate_seat_cost(tier_1_seats, tier_2_seats, tier_3_seats, billing_period) as monthly_cost
FROM organization_subscriptions
WHERE status = 'active';
```

### Find Mismatched Seats
```sql
SELECT *
FROM organization_subscriptions
WHERE total_seats != (tier_1_seats + tier_2_seats + tier_3_seats);
```

## Troubleshooting

### Issue: Subscription not updating
**Cause:** RLS policies may be blocking service role
**Fix:** Ensure `service_role` policy exists on `organization_subscriptions`

### Issue: Tier breakdown incorrect
**Cause:** Calculation logic mismatch between edge function and database
**Fix:** Verify `calculateTierBreakdown()` matches `calculate_tier_breakdown()`

### Issue: Proration not working
**Cause:** Stripe subscription update missing `proration_behavior`
**Fix:** Ensure `proration_behavior: 'create_prorations'` in subscription update

## Future Enhancements

### Seat Decrease Implementation
1. Add UI to request seat reduction
2. Update edge function to use Stripe subscription schedules
3. Schedule quantity decrease for next renewal date
4. Add confirmation email for scheduled changes

### Usage-Based Billing
1. Track actual member activity
2. Recommend optimal seat count
3. Auto-suggest downgrades if underutilized

### Bulk Discounts
1. Add custom pricing tiers for 100+ seats
2. Implement negotiated enterprise rates
3. Support custom billing agreements

## Migration Complete ✅

The seat-based billing system is now fully operational with:
- ✅ Progressive tier pricing
- ✅ Immediate seat increases with proration
- ✅ No plan dependencies
- ✅ Clean database schema
- ✅ Updated UI components
- ✅ Comprehensive documentation

**No more plan-based code exists in the codebase!**
