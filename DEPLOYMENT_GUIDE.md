# Seat-Based Billing System - Deployment Guide

## ✅ Build Status
The frontend build is successful and all TypeScript errors are resolved.

---

## 📋 Deployment Checklist

### Phase 1: Database Migration (⚠️ CRITICAL - Do this first!)

#### Step 1: Apply the Migration

```bash
# Push the migration to your Supabase project
npx supabase db push
```

**What this does:**
- ✅ Removes `subscription_plan` column from `organizations` table
- ✅ Removes all plan-based functions and triggers
- ✅ Adds new tier-based columns to `organization_subscriptions`
- ✅ Creates new helper functions for progressive pricing
- ✅ Sets up automatic seat_limit syncing

#### Step 2: Verify Migration Success

```bash
# Check that migration was applied
npx supabase migration list
```

You should see: `20251106000000_migrate_to_seat_only_billing` with status `Applied`

#### Step 3: Inspect Database Changes

```sql
-- Connect to your database and verify
\d organizations
-- Should NOT have subscription_plan column

\d organization_subscriptions
-- Should have: total_seats, tier_1_seats, tier_2_seats, tier_3_seats

-- Check functions exist
\df calculate_tier_breakdown
\df calculate_seat_cost
```

---

### Phase 2: Deploy Edge Functions

#### Step 1: Delete Old Function (if it exists in production)

```bash
# List current functions
npx supabase functions list

# If create-org-checkout-session exists, you can ignore it - it's been removed locally
```

#### Step 2: Deploy Updated Seat Checkout Function

```bash
npx supabase functions deploy create-seat-checkout-session
```

**Expected output:**
```
Deploying create-seat-checkout-session (project ref: vvmkbpkoccxpmfpxhacv)
Deployed: create-seat-checkout-session
```

#### Step 3: Verify Environment Variables

Make sure these are set in Supabase dashboard:

```bash
# Check secrets
npx supabase secrets list
```

**Required secrets:**
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key

If missing, set them:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_your_key_here
```

---

### Phase 3: Stripe Configuration

#### Verify Price IDs Match

Check that these Stripe price IDs exist and are active:

**Monthly Prices:**
- Tier 1 (€35): `price_1SPt4237eeTawvFRmxg2xSQv`
- Tier 2 (€32): `price_1SPt4537eeTawvFRskKJeO4a`
- Tier 3 (€29): `price_1SPt4837eeTawvFRKF3WzGwQ`

**Yearly Prices:**
- Tier 1 (€420): `price_1SPt4437eeTawvFRlhZCxm5m`
- Tier 2 (€384): `price_1SPt4637eeTawvFRoo51e4k5`
- Tier 3 (€348): `price_1SPt4937eeTawvFRCLFRUNOG`

**To verify:**
```bash
~/.local/bin/stripe prices list --limit 10
```

If prices don't exist, create them:
```bash
# Tier 1 - €35/month
~/.local/bin/stripe prices create \
  --unit-amount 3500 \
  --currency eur \
  --recurring[interval]=month \
  --product prod_YOUR_PRODUCT_ID

# Tier 1 - €420/year (35 × 12)
~/.local/bin/stripe prices create \
  --unit-amount 42000 \
  --currency eur \
  --recurring[interval]=year \
  --product prod_YOUR_PRODUCT_ID

# Repeat for Tier 2 and Tier 3...
```

Then update the price IDs in:
- `supabase/functions/create-seat-checkout-session/index.ts`
- `src/constants/organizationPlans.ts`

---

### Phase 4: Frontend Deployment

#### Step 1: Rebuild and Deploy

```bash
# Build production bundle
npm run build

# Deploy to your hosting (Vercel, Netlify, etc.)
# Example for Vercel:
vercel --prod

# Or commit and push (if using automatic deployment)
git add .
git commit -m "feat: Migrate to seat-based billing system"
git push origin main
```

---

## 🧪 Testing Procedures

### Test 1: First-Time Seat Purchase

**Steps:**
1. Log in as school/company admin
2. Navigate to organization dashboard (`/:role/dashboard-organization`)
3. Click "Acheter des sièges" button
4. Select seat count (try 25 seats to test progressive pricing)
5. Select billing period (monthly)
6. Click purchase button

**Expected Behavior:**
- Redirects to Stripe Checkout
- Shows 2 line items:
  - 20 seats @ €35 = €700
  - 5 seats @ €32 = €160
  - Total: €860/month
- After payment, redirects back with success message
- Organization `seat_limit` updates to 25
- Database shows:
  ```sql
  SELECT total_seats, tier_1_seats, tier_2_seats, tier_3_seats
  FROM organization_subscriptions
  WHERE organization_id = 'xxx';
  -- Should show: 25, 20, 5, 0
  ```

**Test Stripe:**
```bash
# View recent charges
~/.local/bin/stripe charges list --limit 5

# Check subscription
~/.local/bin/stripe subscriptions list --limit 5
```

---

### Test 2: Seat Increase (Proration)

**Steps:**
1. From existing organization with active subscription
2. Click "Acheter / Modifier les sièges"
3. Increase from 25 to 40 seats
4. Confirm purchase

**Expected Behavior:**
- No redirect to checkout (updates in place)
- Immediate invoice created for prorated amount
- Database updates immediately
- Stripe subscription shows:
  - 20 seats @ €35
  - 20 seats @ €32
  - 0 seats @ €29
- Proration invoice created for 15 additional seats

**Verify:**
```sql
-- Check updated seat count
SELECT * FROM organization_billing_summary
WHERE organization_id = 'xxx';

-- Should show total_seats = 40, tier breakdown = (20, 20, 0)
```

---

### Test 3: Tier Transitions

**Test different seat counts to verify tier breakdown:**

```
Seats | Tier 1 | Tier 2 | Tier 3 | Monthly Cost
------|--------|--------|--------|-------------
  1   |   1    |   0    |   0    |   €35
 10   |  10    |   0    |   0    |   €350
 20   |  20    |   0    |   0    |   €700
 25   |  20    |   5    |   0    |   €860
 50   |  20    |  30    |   0    |  €1,660
 75   |  20    |  30    |  25    |  €2,385
100   |  20    |  30    |  50    |  €3,110
```

**Test each:**
```bash
# Use the database function
SELECT * FROM calculate_tier_breakdown(25);
# Should return: (20, 5, 0)

SELECT calculate_seat_cost(20, 5, 0, 'monthly');
# Should return: 860
```

---

### Test 4: Organization Member Limits

**Steps:**
1. Purchase 5 seats
2. Try to add 6th member
3. Verify capacity modal appears

**Expected Behavior:**
- Modal shows: "Capacité maximale atteinte"
- Suggests buying more seats
- Shows current usage: 5/5
- Button to purchase more seats

---

### Test 5: Billing Portal Access

**Steps:**
1. Click "Gérer la facturation" button
2. Should redirect to Stripe Customer Portal

**Expected Behavior:**
- View invoices
- Update payment method
- Cancel subscription
- View billing history

---

## 🔍 Monitoring & Debugging

### Check Active Subscriptions

```sql
-- View all active org subscriptions
SELECT
  o.name,
  os.total_seats,
  os.tier_1_seats,
  os.tier_2_seats,
  os.tier_3_seats,
  os.status,
  os.current_period_end
FROM organization_subscriptions os
JOIN organizations o ON o.id = os.organization_id
WHERE os.status = 'active';
```

### Check Billing Summary

```sql
-- Use the view
SELECT * FROM organization_billing_summary;
```

### Monitor Edge Function Logs

```bash
# View function logs
npx supabase functions logs create-seat-checkout-session --tail

# Or specific time range
npx supabase functions logs create-seat-checkout-session --since 1h
```

### Check Stripe Events

```bash
# List recent events
~/.local/bin/stripe events list --limit 20

# Watch for subscription updates
~/.local/bin/stripe events list --type subscription.updated
```

---

## 🚨 Rollback Plan (If Needed)

If something goes wrong, you can roll back:

### Step 1: Revert Database Migration

```bash
# Create a rollback migration
npx supabase migration new rollback_seat_billing

# Edit the new migration file and add:
ALTER TABLE organizations ADD COLUMN subscription_plan TEXT;
# ... (restore old schema)

# Apply rollback
npx supabase db push
```

### Step 2: Restore Old Edge Function

```bash
# Redeploy from git history
git checkout HEAD~1 -- supabase/functions/create-seat-checkout-session
npx supabase functions deploy create-seat-checkout-session
```

---

## 📊 Success Criteria

✅ **Database:**
- Migration applied successfully
- Old plan columns removed
- New tier columns present
- Helper functions working

✅ **Edge Functions:**
- `create-seat-checkout-session` deployed
- `create-org-checkout-session` removed/ignored
- Function logs show no errors
- Test purchases work

✅ **Frontend:**
- Build successful (no TS errors)
- Seat purchase modal shows tier breakdown
- Subscription card displays seat count
- No references to old plans (b2b_pro/max/ultra)

✅ **Stripe:**
- Subscriptions created with multiple line items
- Proration working correctly
- Invoices generated properly
- Customer portal accessible

✅ **User Experience:**
- Organizations can purchase any seat count (1-100)
- Progressive pricing displayed correctly
- Seat increases work instantly
- Capacity limits enforced properly

---

## 📞 Need Help?

### Common Issues

**Issue:** Migration fails with "column does not exist"
**Fix:** Check if you have pending migrations. Run `npx supabase db reset` locally first.

**Issue:** Edge function can't find price IDs
**Fix:** Verify price IDs exist in Stripe and match the constants in the code.

**Issue:** Proration not working
**Fix:** Ensure `proration_behavior: 'create_prorations'` is set in subscription update.

**Issue:** RLS policy blocking updates
**Fix:** Check that service role policy exists on `organization_subscriptions` table.

---

## 🎉 Post-Deployment

Once everything is working:

1. **Monitor for 24 hours** - Check logs and user reports
2. **Verify billing** - Ensure invoices are generated correctly
3. **Test with real users** - Have a few organizations test the flow
4. **Update documentation** - Mark old plan docs as deprecated
5. **Celebrate** - You've successfully migrated to a cleaner system!

---

## Summary of Changes

**What was removed:**
- ❌ Plan types (b2b_pro, b2b_max, b2b_ultra)
- ❌ Plan selection UI components
- ❌ Plan-based functions and triggers
- ❌ `create-org-checkout-session` edge function
- ❌ Auto-downgrade notifications

**What was added:**
- ✅ Progressive tier pricing (€35/€32/€29)
- ✅ Flexible seat count (1-100, no minimums)
- ✅ Tier breakdown in UI
- ✅ Database functions for tier calculations
- ✅ Improved seat purchase modal
- ✅ Comprehensive billing summary view

**The system now:**
- Charges based purely on seat count
- Applies progressive discounts automatically
- Handles proration via Stripe
- Simplifies the admin experience
- Removes complex plan migration logic
