-- ========================================================================
-- SQL Script to verify Premium/Pro subscription after subscribing
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vvmkbpkoccxpmfpxhacv/sql
-- ========================================================================

-- INSTRUCTIONS: Replace 'YOUR_EMAIL_HERE' below with your actual email address

-- ========================================================================
-- QUERY 1: YOUR ACTUAL SUBSCRIPTION DATA (MOST IMPORTANT)
-- ========================================================================
SELECT
  '🔍 YOUR SUBSCRIPTION DATA' as query_type,
  p.email,
  p.full_name,
  '⬇️ ACTUAL VALUES BELOW ⬇️' as separator,
  us.plan as "📦 CURRENT_PLAN",
  us.status as "✅ STATUS",
  us.stripe_customer_id as "💳 STRIPE_CUSTOMER",
  us.stripe_subscription_id as "🔑 STRIPE_SUBSCRIPTION",
  us.current_period_start as "📅 PERIOD_START",
  us.current_period_end as "📅 PERIOD_END",
  us.cancel_at_period_end as "⚠️ WILL_CANCEL",
  us.ai_minutes_purchased as "🤖 AI_MINUTES",
  CASE
    WHEN us.plan = 'premium' AND us.status = 'active' THEN '✅ PREMIUM ACTIVE - EVERYTHING IS CORRECT!'
    WHEN us.plan = 'pro' AND us.status = 'active' THEN '✅ PRO ACTIVE - EVERYTHING IS CORRECT!'
    WHEN us.plan = 'basic' THEN '⚠️ BASIC PLAN - You may not have completed payment'
    WHEN us.status != 'active' THEN '❌ SUBSCRIPTION NOT ACTIVE - Check Stripe'
    ELSE '❓ UNKNOWN STATE'
  END as "🎯 VERIFICATION_RESULT"
FROM
  profiles p
LEFT JOIN
  user_subscriptions us ON p.user_id = us.user_id
WHERE
  p.email = 'YOUR_EMAIL_HERE';  -- <-- REPLACE THIS WITH YOUR EMAIL


-- ========================================================================
-- QUERY 2: YOUR MONTHLY USAGE (OPTIONAL)
-- ========================================================================
SELECT
  '📊 YOUR CURRENT USAGE' as query_type,
  mu.period_start as "📅 PERIOD_START",
  mu.period_end as "📅 PERIOD_END",
  mu.courses_created as "📚 COURSES_USED",
  mu.exercises_created as "✏️ EXERCISES_USED",
  mu.fiches_created as "📄 FICHES_USED",
  mu.ai_minutes_used as "🤖 AI_MINUTES_USED"
FROM
  monthly_usage mu
JOIN
  profiles p ON mu.user_id = p.user_id
WHERE
  p.email = 'YOUR_EMAIL_HERE'  -- <-- REPLACE THIS WITH YOUR EMAIL
ORDER BY
  mu.period_start DESC
LIMIT 1;


-- ========================================================================
-- REFERENCE: EXPECTED VALUES FOR PREMIUM PLAN
-- ========================================================================
SELECT
  '📋 EXPECTED: Premium Plan' as reference_type,
  '9.90 EUR/month' as price,
  'premium' as expected_plan_value,
  'active' as expected_status,
  '10 per month' as courses_limit,
  '10 per month' as exercises_limit,
  '10 per month' as fiches_limit,
  'Should start with cus_' as customer_id_format,
  'Should start with sub_' as subscription_id_format;


-- ========================================================================
-- REFERENCE: EXPECTED VALUES FOR PRO PLAN
-- ========================================================================
SELECT
  '📋 EXPECTED: Pro Plan' as reference_type,
  '19.90 EUR/month' as price,
  'pro' as expected_plan_value,
  'active' as expected_status,
  '30 per month' as courses_limit,
  '30 per month' as exercises_limit,
  '30 per month' as fiches_limit,
  'Should start with cus_' as customer_id_format,
  'Should start with sub_' as subscription_id_format;
