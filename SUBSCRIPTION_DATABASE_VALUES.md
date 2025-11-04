# Database Values Reference for Premium/Pro Subscriptions

This document lists the exact values that should appear in your database tables after subscribing to Premium or Pro plans.

---

## How to Check Your Database

1. Go to: https://supabase.com/dashboard/project/vvmkbpkoccxpmfpxhacv/editor
2. Select the table from the left sidebar
3. Find your row (filter by your email or user_id)
4. Compare values with this document

---

## Table 1: `profiles`

**Location:** Table Editor → profiles → Find your row

| Column | Premium Value | Pro Value | Notes |
|--------|---------------|-----------|-------|
| `subscription` | `premium` | `pro` | Must match exactly |
| `user_id` | (your UUID) | (your UUID) | Should exist |
| `email` | (your email) | (your email) | Should exist |

**How to check:**
- Click on `profiles` table
- Find your email
- Check the `subscription` column

---

## Table 2: `user_subscriptions` ⭐ MOST IMPORTANT

**Location:** Table Editor → user_subscriptions → Find your row

### For PREMIUM Plan:

| Column | Expected Value | Format | Notes |
|--------|----------------|--------|-------|
| `plan` | `premium` | text | **MUST be 'premium'** |
| `status` | `active` | text | **MUST be 'active'** |
| `stripe_customer_id` | `cus_...` | text | Starts with `cus_` |
| `stripe_subscription_id` | `sub_...` | text | Starts with `sub_` |
| `current_period_start` | (timestamp) | timestamptz | Recent date |
| `current_period_end` | (timestamp) | timestamptz | ~30 days after start |
| `cancel_at_period_end` | `false` | boolean | Should be false |
| `canceled_at` | `null` | timestamptz | Should be null |
| `ai_minutes_purchased` | `0` (or more) | integer | Purchased AI minutes |

### For PRO Plan:

| Column | Expected Value | Format | Notes |
|--------|----------------|--------|-------|
| `plan` | `pro` | text | **MUST be 'pro'** |
| `status` | `active` | text | **MUST be 'active'** |
| `stripe_customer_id` | `cus_...` | text | Starts with `cus_` |
| `stripe_subscription_id` | `sub_...` | text | Starts with `sub_` |
| `current_period_start` | (timestamp) | timestamptz | Recent date |
| `current_period_end` | (timestamp) | timestamptz | ~30 days after start |
| `cancel_at_period_end` | `false` | boolean | Should be false |
| `canceled_at` | `null` | timestamptz | Should be null |
| `ai_minutes_purchased` | `0` (or more) | integer | Purchased AI minutes |

**How to check:**
- Click on `user_subscriptions` table
- Find your `user_id`
- Verify `plan` and `status` columns

---

## Table 3: `monthly_usage`

**Location:** Table Editor → monthly_usage → Find your row

This table tracks your monthly usage. It should have a row for the current billing period.

| Column | Premium Limit | Pro Limit | Notes |
|--------|---------------|-----------|-------|
| `period_start` | (current period start) | (current period start) | From subscription |
| `period_end` | (current period end) | (current period end) | From subscription |
| `courses_created` | 0-10 | 0-30 | Cannot exceed limit |
| `exercises_created` | 0-10 | 0-30 | Cannot exceed limit |
| `fiches_created` | 0-10 | 0-30 | Cannot exceed limit |
| `ai_minutes_used` | 0+ | 0+ | No limit, deducts from purchased |

**How to check:**
- Click on `monthly_usage` table
- Find your `user_id`
- Check that usage numbers make sense

---

## Quick Verification Checklist

### ✅ Premium Plan Checklist:

- [ ] `profiles.subscription` = `premium`
- [ ] `user_subscriptions.plan` = `premium`
- [ ] `user_subscriptions.status` = `active`
- [ ] `user_subscriptions.stripe_customer_id` starts with `cus_`
- [ ] `user_subscriptions.stripe_subscription_id` starts with `sub_`
- [ ] `user_subscriptions.cancel_at_period_end` = `false`
- [ ] `user_subscriptions.current_period_end` is ~30 days from `current_period_start`
- [ ] `monthly_usage` row exists for current period

### ✅ Pro Plan Checklist:

- [ ] `profiles.subscription` = `pro`
- [ ] `user_subscriptions.plan` = `pro`
- [ ] `user_subscriptions.status` = `active`
- [ ] `user_subscriptions.stripe_customer_id` starts with `cus_`
- [ ] `user_subscriptions.stripe_subscription_id` starts with `sub_`
- [ ] `user_subscriptions.cancel_at_period_end` = `false`
- [ ] `user_subscriptions.current_period_end` is ~30 days from `current_period_start`
- [ ] `monthly_usage` row exists for current period

---

## Common Issues

### ❌ Problem: `plan` is `basic` instead of `premium`/`pro`

**Cause:** Webhook didn't fire or failed

**Solution:**
1. Check Stripe Dashboard → Webhooks → View logs
2. Check if webhook secret is configured correctly
3. Deploy the updated `stripe-webhook` function with `constructEventAsync`

---

### ❌ Problem: `status` is not `active`

**Possible values and meanings:**

| Status | Meaning | Action |
|--------|---------|--------|
| `active` | ✅ Everything is working | None needed |
| `incomplete` | Payment pending | Complete payment in Stripe |
| `past_due` | Payment failed | Update payment method |
| `canceled` | Subscription canceled | Resubscribe |
| `trialing` | In trial period | Wait for trial to end |

---

### ❌ Problem: `stripe_subscription_id` is `null`

**Cause:** Webhook didn't create the subscription record

**Solution:**
1. Check if payment completed in Stripe dashboard
2. Manually trigger webhook or re-subscribe

---

### ❌ Problem: No row in `user_subscriptions` table

**Cause:** Webhook never received or user never completed checkout

**Solution:**
1. Complete a new checkout session
2. Ensure webhook endpoint is configured in Stripe
3. Ensure webhook is deployed to Supabase

---

## Expected Limits by Plan

### Premium Plan (9.90€/month)

| Feature | Monthly Limit |
|---------|---------------|
| Courses | 10 |
| Exercises | 10 |
| Fiches de révision | 10 |
| AI Minutes | Purchase separately |
| Max days per course | 10 |

### Pro Plan (19.90€/month)

| Feature | Monthly Limit |
|---------|---------------|
| Courses | 30 |
| Exercises | 30 |
| Fiches de révision | 30 |
| AI Minutes | Purchase separately |
| Max days per course | 10 |

### Basic Plan (Free)

| Feature | Monthly Limit |
|---------|---------------|
| Courses | 3 |
| Exercises | 3 |
| Fiches de révision | 3 |
| AI Minutes | Cannot purchase |
| Max days per course | 10 |

---

## Stripe Product IDs Reference

These are the Stripe Price IDs used in the code:

| Plan/Product | Price ID | Price |
|--------------|----------|-------|
| Premium Monthly | `price_1SNu6P37eeTawvFRvh1JGgOC` | 9.90€ |
| Pro Monthly | `price_1SNu6N37eeTawvFR0CRbzo7F` | 19.90€ |
| AI 10min | `price_1SNu6D37eeTawvFRAVwbpsol` | 5€ |
| AI 30min | `price_1SNu6B37eeTawvFRjJ20hc7w` | 15€ |
| AI 60min | `price_1SNu5g37eeTawvFRdsQ1vIYp` | 20€ |

---

## Need Help?

If values don't match what's expected:

1. **Check Stripe Dashboard:**
   - Payments: https://dashboard.stripe.com/test/payments
   - Subscriptions: https://dashboard.stripe.com/test/subscriptions
   - Webhooks: https://dashboard.stripe.com/test/webhooks

2. **Check Supabase Logs:**
   - Edge Functions: https://supabase.com/dashboard/project/vvmkbpkoccxpmfpxhacv/functions
   - Find `stripe-webhook` and check logs

3. **Verify Webhook Configuration:**
   - Stripe → Developers → Webhooks
   - Ensure endpoint exists: `https://vvmkbpkoccxpmfpxhacv.supabase.co/functions/v1/stripe-webhook`
   - Ensure signing secret is set in Supabase secrets as `STRIPE_WEBHOOK_SECRET`
