import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to get included seats for a plan
function getIncludedSeatsForPlan(plan: string): number {
  switch (plan) {
    case 'b2b_pro': return 0;
    case 'b2b_max': return 20;
    case 'b2b_ultra': return 50;
    default: return 0;
  }
}

// Helper to get max purchasable seats for a plan
function getMaxPurchasableSeats(plan: string): number {
  const maxTotal: Record<string, number> = {
    'b2b_pro': 20,
    'b2b_max': 50,
    'b2b_ultra': 100,
  };
  const included = getIncludedSeatsForPlan(plan);
  return (maxTotal[plan] || 0) - included;
}

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

    console.log('🪑 Seat purchase request:', {
      organizationId,
      seatCount,
      billingPeriod,
      userId: user.id,
    });

    // Validate inputs
    if (!organizationId || !seatCount || !billingPeriod) {
      throw new Error('Missing required parameters: organizationId, seatCount, or billingPeriod');
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      throw new Error('Invalid billing period. Must be "monthly" or "yearly"');
    }

    if (seatCount < 1) {
      throw new Error('Seat count must be at least 1');
    }

    // Get organization with subscription
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select(`
        *,
        organization_subscriptions (*)
      `)
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
      throw new Error('Organization must have an active subscription plan before purchasing seats');
    }

    console.log('✅ Organization validated:', {
      plan,
      currentSeats: organization.seat_limit,
    });

    // Validate seat count against plan limits
    const maxPurchasable = getMaxPurchasableSeats(plan);
    if (seatCount > maxPurchasable) {
      throw new Error(
        `Cannot purchase ${seatCount} seats for ${plan.toUpperCase()} plan. ` +
        `Maximum purchasable: ${maxPurchasable} (plan includes ${getIncludedSeatsForPlan(plan)} free seats)`
      );
    }

    // Map plan to seat price IDs
    const seatPriceIds: Record<string, { monthly: string; yearly: string }> = {
      b2b_pro: {
        monthly: 'price_1SPt4237eeTawvFRmxg2xSQv',  // 35€/seat/month
        yearly: 'price_1SPt4437eeTawvFRlhZCxm5m',    // 420€/seat/year
      },
      b2b_max: {
        monthly: 'price_1SPt4537eeTawvFRskKJeO4a',  // 32€/seat/month
        yearly: 'price_1SPt4637eeTawvFRoo51e4k5',    // 384€/seat/year
      },
      b2b_ultra: {
        monthly: 'price_1SPt4837eeTawvFRKF3WzGwQ',  // 29€/seat/month
        yearly: 'price_1SPt4937eeTawvFRCLFRUNOG',    // 348€/seat/year
      },
    };

    const priceId = seatPriceIds[plan]?.[billingPeriod];
    if (!priceId) {
      throw new Error(`Invalid plan or billing period: ${plan} / ${billingPeriod}`);
    }

    // Get or create Stripe customer
    const orgSubscriptions = organization.organization_subscriptions as any[];
    let customerId = orgSubscriptions?.[0]?.stripe_customer_id;

    if (!customerId) {
      console.log('Creating new Stripe customer for organization');

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
      if (orgSubscriptions?.[0]?.id) {
        await supabaseClient
          .from('organization_subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('id', orgSubscriptions[0].id);
      }
    }

    // Check if organization already has a seat subscription
    const existingSeatSubscriptionId = orgSubscriptions?.[0]?.stripe_seat_subscription_id;

    if (existingSeatSubscriptionId) {
      // UPDATE existing subscription quantity (Stripe handles proration automatically)
      console.log('🔄 Updating existing seat subscription:', {
        subscriptionId: existingSeatSubscriptionId,
        newQuantity: seatCount,
      });

      try {
        // Retrieve the existing subscription
        const subscription = await stripe.subscriptions.retrieve(existingSeatSubscriptionId);

        // Verify subscription is active
        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
          throw new Error(`Cannot update subscription with status: ${subscription.status}`);
        }

        // Get the subscription item ID
        const subscriptionItemId = subscription.items.data[0]?.id;
        if (!subscriptionItemId) {
          throw new Error('Subscription item not found');
        }

        // Verify billing period matches (prevent switching between monthly/yearly via this endpoint)
        const currentPriceId = subscription.items.data[0]?.price.id;
        if (currentPriceId !== priceId) {
          throw new Error(
            'Cannot change billing period when updating seat count. ' +
            'Please cancel current seat subscription and create a new one with the desired billing period.'
          );
        }

        // Update subscription quantity (Stripe auto-prorates)
        const updatedSubscription = await stripe.subscriptions.update(existingSeatSubscriptionId, {
          items: [{
            id: subscriptionItemId,
            quantity: seatCount,
          }],
          proration_behavior: 'create_prorations', // Create prorated invoice immediately
        });

        console.log('✅ Subscription updated successfully:', {
          subscriptionId: updatedSubscription.id,
          newQuantity: seatCount,
          status: updatedSubscription.status,
        });

        // Update database (webhook will also handle this, but update immediately for consistency)
        await supabaseClient
          .from('organization_subscriptions')
          .update({
            purchased_seats: seatCount,
            seat_billing_period: billingPeriod,
          })
          .eq('id', orgSubscriptions[0].id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Seat quantity updated successfully',
            subscriptionId: updatedSubscription.id,
            quantity: seatCount,
            prorated: true,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (error: any) {
        console.error('❌ Error updating subscription:', error);
        throw new Error(`Failed to update seat subscription: ${error.message}`);
      }
    }

    // FIRST-TIME seat purchase: Create checkout session
    console.log('💳 Creating Stripe checkout session (first-time purchase):', {
      customerId,
      priceId,
      quantity: seatCount,
    });

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
      allow_promotion_codes: true, // Enable Stripe's built-in coupon field in checkout
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
          user_id: user.id,
          seat_count: seatCount.toString(),
          billing_period: billingPeriod,
          checkout_type: 'seat_purchase',
        },
      },
    });

    console.log('✅ Checkout session created:', session.id);

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
  } catch (error: any) {
    console.error('❌ Error creating seat checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
