# Seat-Based Billing Deployment Guide

This guide contains all the migrations, edge functions, and webhook updates needed to implement seat-based billing for organizations.

## Overview

The seat billing system allows organizations to purchase seats as subscriptions (monthly or yearly) to unlock member capacity. Key features:

- **Per-seat pricing**: PRO (35€/month), MAX (32€/month), ULTRA (29€/month)
- **Plan-specific limits**: PRO (1-20 seats), MAX (21-50 seats), ULTRA (51-100 seats)
- **Automatic allocation**: Active members automatically consume available seats
- **Mid-period purchases**: Organizations can buy more seats anytime with proration
- **Stripe integration**: Seats purchased as Stripe subscriptions with quantity parameter

## Stripe Products Created

The following products and prices have been created in Stripe:

### PRO Plan
- Monthly Seat: `prod_TMcFeLhPKrQqhe` / `price_1SPt4237eeTawvFRmxg2xSQv` (35€/seat/month)
- Yearly Seat: `prod_TMcFoSQbqXRkZx` / `price_1SPt4437eeTawvFRlhZCxm5m` (420€/seat/year)

### MAX Plan
- Monthly Seat: `prod_TMcFldyhZIpeqt` / `price_1SPt4537eeTawvFRskKJeO4a` (32€/seat/month)
- Yearly Seat: `prod_TMcFTcRVB9TMIZ` / `price_1SPt4637eeTawvFRoo51e4k5` (384€/seat/year)

### ULTRA Plan
- Monthly Seat: `prod_TMcFSZsOLXiBNo` / `price_1SPt4837eeTawvFRKF3WzGwQ` (29€/seat/month)
- Yearly Seat: `prod_TMcFl0jWJoP2C6` / `price_1SPt4937eeTawvFRCLFRUNOG` (348€/seat/year)

---

## 1. Database Migration

Create and apply this migration to add seat billing fields to the database:

```bash
npx supabase migration new add_seat_subscription_fields
```

### Migration SQL

⚠️ **IMPORTANT**: This migration fixes a conflict with an existing trigger. See `SEAT_BILLING_IMPLEMENTATION_ISSUES_AND_FIXES.md` for details.

```sql
-- Migration: add_seat_subscription_fields
-- Adds seat-based billing support to organization subscriptions

-- ============================================
-- STEP 1: Remove conflicting trigger behavior
-- ============================================

-- Drop and recreate the trigger to NOT set seat_limit based on plan
DROP TRIGGER IF EXISTS trigger_update_organization_seat_limit ON public.organizations;
DROP FUNCTION IF EXISTS public.update_organization_seat_limit();

-- New function that does NOT touch seat_limit
-- seat_limit will only be controlled by purchased_seats
CREATE OR REPLACE FUNCTION public.update_organization_plan_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used for other plan-related logic in the future
  -- but does NOT set seat_limit (that's controlled by purchased_seats)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger without seat_limit logic
CREATE TRIGGER trigger_update_organization_plan_metadata
  BEFORE INSERT OR UPDATE OF subscription_plan ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_organization_plan_metadata();

-- ============================================
-- STEP 2: Reset all existing seat_limits to 0
-- ============================================

-- Organizations must purchase seats to add members
-- Set all existing seat_limits to 0 (will be updated by seat purchases)
UPDATE public.organizations
SET seat_limit = 0
WHERE seat_limit IS NOT NULL;

-- Set default to 0 for new organizations
ALTER TABLE public.organizations
ALTER COLUMN seat_limit SET DEFAULT 0;

-- ============================================
-- STEP 3: Add seat subscription fields
-- ============================================

ALTER TABLE organization_subscriptions
ADD COLUMN IF NOT EXISTS stripe_seat_subscription_id text,
ADD COLUMN IF NOT EXISTS purchased_seats integer DEFAULT 0 NOT NULL CHECK (purchased_seats >= 0),
ADD COLUMN IF NOT EXISTS seat_billing_period text CHECK (seat_billing_period IN ('monthly', 'yearly'));

COMMENT ON COLUMN organization_subscriptions.stripe_seat_subscription_id IS 'Stripe subscription ID for seat-based billing';
COMMENT ON COLUMN organization_subscriptions.purchased_seats IS 'Number of seats purchased via subscription';
COMMENT ON COLUMN organization_subscriptions.seat_billing_period IS 'Billing period for seats: monthly or yearly';

-- ============================================
-- STEP 4: Create trigger to sync seat_limit
-- ============================================

-- This trigger ensures seat_limit always matches purchased_seats
CREATE OR REPLACE FUNCTION sync_organization_seat_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the organization's seat_limit to match purchased_seats
  UPDATE organizations
  SET seat_limit = NEW.purchased_seats,
      updated_at = NOW()
  WHERE id = NEW.organization_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires when purchased_seats changes
DROP TRIGGER IF EXISTS sync_seat_limit_trigger ON organization_subscriptions;
CREATE TRIGGER sync_seat_limit_trigger
AFTER INSERT OR UPDATE OF purchased_seats
ON organization_subscriptions
FOR EACH ROW
EXECUTE FUNCTION sync_organization_seat_limit();

-- ============================================
-- STEP 5: Update capacity check function
-- ============================================

-- Update check_organization_capacity to prioritize purchased_seats
CREATE OR REPLACE FUNCTION check_organization_capacity(p_organization_id uuid)
RETURNS TABLE (
  can_add boolean,
  current_members integer,
  seat_limit integer,
  remaining_seats integer
) AS $$
DECLARE
  v_org organizations%ROWTYPE;
  v_subscription organization_subscriptions%ROWTYPE;
  v_seat_limit integer;
BEGIN
  -- Get organization data
  SELECT * INTO v_org FROM organizations WHERE id = p_organization_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;

  -- Get subscription data
  SELECT * INTO v_subscription
  FROM organization_subscriptions
  WHERE organization_id = p_organization_id;

  -- CRITICAL: Use purchased_seats if available, otherwise use seat_limit
  -- This allows backward compatibility but prioritizes purchased seats
  IF v_subscription.purchased_seats IS NOT NULL AND v_subscription.purchased_seats > 0 THEN
    v_seat_limit := v_subscription.purchased_seats;
  ELSIF v_org.seat_limit IS NOT NULL THEN
    v_seat_limit := v_org.seat_limit;
  ELSE
    -- No seats available at all
    v_seat_limit := 0;
  END IF;

  -- Return capacity check
  RETURN QUERY SELECT
    (v_org.active_members_count < v_seat_limit),
    v_org.active_members_count,
    v_seat_limit,
    (v_seat_limit - v_org.active_members_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- STEP 6: Create seat availability check
-- ============================================

-- Simple function to check if org has seats available
CREATE OR REPLACE FUNCTION check_seat_availability(p_organization_id uuid)
RETURNS TABLE (
  has_seats boolean,
  current_members integer,
  purchased_seats integer,
  remaining_seats integer
) AS $$
DECLARE
  v_current_members integer;
  v_purchased_seats integer;
BEGIN
  -- Get current active member count
  SELECT active_members_count INTO v_current_members
  FROM organizations
  WHERE id = p_organization_id;

  -- Get purchased seats (defaults to 0 if no subscription)
  SELECT COALESCE(purchased_seats, 0) INTO v_purchased_seats
  FROM organization_subscriptions
  WHERE organization_id = p_organization_id;

  -- Return availability
  RETURN QUERY SELECT
    (v_current_members < v_purchased_seats),
    v_current_members,
    v_purchased_seats,
    (v_purchased_seats - v_current_members);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Apply Migration

```bash
npx supabase db push
```

---

## 2. Edge Function: create-seat-checkout-session

Create a new edge function to handle seat purchase checkout sessions:

```bash
npx supabase functions new create-seat-checkout-session
```

### Function Code

Create the file at `supabase/functions/create-seat-checkout-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get user from JWT
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Parse request body
    const { organizationId, seatCount, billingPeriod, successUrl, cancelUrl } = await req.json();

    // Validate inputs
    if (!organizationId || !seatCount || !billingPeriod) {
      throw new Error('Missing required parameters');
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      throw new Error('Invalid billing period');
    }

    if (seatCount < 1 || seatCount > 100) {
      throw new Error('Seat count must be between 1 and 100');
    }

    // Get organization
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('*, organization_subscriptions(*)')
      .eq('id', organizationId)
      .single();

    if (orgError || !organization) {
      throw new Error('Organization not found');
    }

    // Verify user is the organization owner
    if (organization.created_by !== user.id) {
      throw new Error('Only organization owner can purchase seats');
    }

    // Verify organization is approved
    if (organization.validation_status !== 'approved') {
      throw new Error('Organization must be approved before purchasing seats');
    }

    // Get organization plan
    const plan = organization.subscription_plan;
    if (!plan) {
      throw new Error('Organization must have a subscription plan');
    }

    // Map plan to price IDs
    const seatPriceIds: Record<string, { monthly: string; yearly: string }> = {
      b2b_pro: {
        monthly: 'price_1SPt4237eeTawvFRmxg2xSQv',
        yearly: 'price_1SPt4437eeTawvFRlhZCxm5m',
      },
      b2b_max: {
        monthly: 'price_1SPt4537eeTawvFRskKJeO4a',
        yearly: 'price_1SPt4637eeTawvFRoo51e4k5',
      },
      b2b_ultra: {
        monthly: 'price_1SPt4837eeTawvFRKF3WzGwQ',
        yearly: 'price_1SPt4937eeTawvFRCLFRUNOG',
      },
    };

    const priceId = seatPriceIds[plan]?.[billingPeriod];
    if (!priceId) {
      throw new Error('Invalid plan or billing period');
    }

    // Validate seat count against plan limits
    const planLimits: Record<string, { min: number; max: number }> = {
      b2b_pro: { min: 1, max: 20 },
      b2b_max: { min: 21, max: 50 },
      b2b_ultra: { min: 51, max: 100 },
    };

    const limits = planLimits[plan];
    if (seatCount < limits.min || seatCount > limits.max) {
      throw new Error(`Seat count must be between ${limits.min} and ${limits.max} for ${plan} plan`);
    }

    // Get or create Stripe customer
    let customerId = organization.organization_subscriptions?.[0]?.stripe_customer_id;

    if (!customerId) {
      // Get user profile for email
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email, full_name')
        .eq('user_id', user.id)
        .single();

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: organization.name,
        metadata: {
          organization_id: organizationId,
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Update organization subscription with customer ID
      if (organization.organization_subscriptions?.[0]?.id) {
        await supabaseClient
          .from('organization_subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('id', organization.organization_subscriptions[0].id);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: seatCount,
        },
      ],
      success_url: successUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/dashboard-organization?seat-checkout=success`,
      cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/dashboard-organization?seat-checkout=canceled`,
      metadata: {
        organization_id: organizationId,
        user_id: user.id,
        seat_count: seatCount.toString(),
        billing_period: billingPeriod,
        checkout_type: 'seat_purchase',
      },
      subscription_data: {
        metadata: {
          organization_id: organizationId,
          seat_count: seatCount.toString(),
          billing_period: billingPeriod,
        },
      },
    });

    return new Response(
      JSON.stringify({
        checkoutUrl: session.url,
        sessionId: session.id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating seat checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
```

### Deploy Function

```bash
npx supabase functions deploy create-seat-checkout-session
```

---

## 3. Webhook Updates

Update the existing `stripe-webhook` edge function to handle seat subscription events.

### Updated Webhook Code

Add the following to `supabase/functions/stripe-webhook/index.ts` (add to the event handling switch statement):

```typescript
// Add this case to handle checkout.session.completed for seat purchases
case 'checkout.session.completed': {
  const session = event.data.object as Stripe.Checkout.Session;

  // Check if this is a seat purchase checkout
  if (session.metadata?.checkout_type === 'seat_purchase') {
    const organizationId = session.metadata.organization_id;
    const seatCount = parseInt(session.metadata.seat_count || '0', 10);
    const billingPeriod = session.metadata.billing_period;
    const subscriptionId = session.subscription as string;

    // Update organization subscription with seat data
    const { error: updateError } = await supabaseAdmin
      .from('organization_subscriptions')
      .upsert({
        organization_id: organizationId,
        stripe_customer_id: session.customer as string,
        stripe_seat_subscription_id: subscriptionId,
        purchased_seats: seatCount,
        seat_billing_period: billingPeriod,
        status: 'active',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'organization_id',
      });

    if (updateError) {
      console.error('Error updating organization subscription:', updateError);
    }

    // The trigger will automatically update seat_limit in organizations table
  }
  break;
}

// Add this case to handle subscription updates (quantity changes)
case 'customer.subscription.updated': {
  const subscription = event.data.object as Stripe.Subscription;

  // Check if this subscription has organization metadata
  if (subscription.metadata?.organization_id) {
    const organizationId = subscription.metadata.organization_id;
    const seatCount = subscription.items.data[0]?.quantity || 0;

    // Update purchased seats
    const { error: updateError } = await supabaseAdmin
      .from('organization_subscriptions')
      .update({
        purchased_seats: seatCount,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_seat_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating seat subscription:', updateError);
    }
  }
  break;
}

// Add this case to handle subscription cancellation
case 'customer.subscription.deleted': {
  const subscription = event.data.object as Stripe.Subscription;

  if (subscription.metadata?.organization_id) {
    // Set purchased seats to 0 when subscription is cancelled
    const { error: updateError } = await supabaseAdmin
      .from('organization_subscriptions')
      .update({
        purchased_seats: 0,
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_seat_subscription_id', subscription.id);

    if (updateError) {
      console.error('Error updating cancelled seat subscription:', updateError);
    }
  }
  break;
}
```

### Redeploy Webhook

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

---

## 4. Update RLS Policies (Optional but Recommended)

Ensure users can only purchase seats for their own organizations:

```sql
-- Policy to allow organization owners to read their seat subscriptions
CREATE POLICY "Organization owners can read seat subscriptions"
ON organization_subscriptions
FOR SELECT
USING (
  organization_id IN (
    SELECT id FROM organizations WHERE created_by = auth.uid()
  )
);
```

---

## 6. Testing Checklist

After deploying all changes:

- [ ] Test seat purchase flow with slider UI
- [ ] Verify Stripe checkout session is created with correct quantity
- [ ] Confirm webhook updates database with purchased_seats
- [ ] Test that seat_limit is automatically synced
- [ ] Verify users cannot join orgs without available seats
- [ ] Test seat quantity updates (upgrading mid-period)
- [ ] Confirm proration works correctly
- [ ] Test cancellation sets purchased_seats to 0
- [ ] Verify monthly and yearly billing both work
- [ ] Test all three plan tiers (PRO, MAX, ULTRA)
- [ ] Check plan-specific seat limits are enforced

---

## 7. Frontend Components

The following components have been created and integrated:

1. **SeatPurchaseModal** - Modal with slider for seat selection
2. **OrganizationSubscriptionCard** - Updated with "Acheter des sièges" button
3. **Constants** - Updated `organizationPlans.ts` with seat pricing
4. **Service** - Added `createSeatCheckoutSession` function

---

## Deployment Order

1. Apply database migration (`npx supabase db push`)
2. Deploy `create-seat-checkout-session` edge function
3. Update and redeploy `stripe-webhook` edge function
4. Test the complete flow end-to-end
5. Monitor Stripe webhook events for any issues

---

## Support & Troubleshooting

### Common Issues

**Issue**: Webhook not receiving seat purchase events
**Solution**: Check Stripe webhook endpoint configuration and ensure `--no-verify-jwt` flag is used

**Issue**: Seat limit not updating after purchase
**Solution**: Verify the `sync_seat_limit_trigger` is active and check Supabase logs

**Issue**: Users can still join without seats
**Solution**: Ensure RPC function `check_seat_availability` is being called during member approval

**Issue**: Proration not working
**Solution**: Verify Stripe subscription settings allow proration for quantity changes

---

## Next Steps

After successful deployment:

1. Monitor first few seat purchases closely
2. Set up Stripe webhook monitoring/alerting
3. Consider adding email notifications for seat purchase confirmations
4. Add analytics tracking for seat purchase conversions
5. Implement seat usage reports for organization admins

---

**Last Updated**: 2025-01-04
**Status**: Ready for Deployment
