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

/**
 * Progressive Tier Pricing (per seat per month):
 * - Tier 1 (1-20 seats): €35/seat
 * - Tier 2 (21-50 seats): €32/seat
 * - Tier 3 (51-100 seats): €29/seat
 */

// Stripe Price IDs for each tier
const TIER_PRICE_IDS = {
  monthly: {
    tier_1: 'price_1SPt4237eeTawvFRmxg2xSQv', // €35/seat/month
    tier_2: 'price_1SPt4537eeTawvFRskKJeO4a', // €32/seat/month
    tier_3: 'price_1SPt4837eeTawvFRKF3WzGwQ', // €29/seat/month
  },
  yearly: {
    tier_1: 'price_1SPt4437eeTawvFRlhZCxm5m', // €420/seat/year
    tier_2: 'price_1SPt4637eeTawvFRoo51e4k5', // €384/seat/year
    tier_3: 'price_1SPt4937eeTawvFRCLFRUNOG', // €348/seat/year
  },
};

// Calculate tier breakdown for progressive pricing
function calculateTierBreakdown(totalSeats: number): {
  tier_1: number;
  tier_2: number;
  tier_3: number;
} {
  if (totalSeats < 1 || totalSeats > 100) {
    throw new Error(`Seat count must be between 1 and 100, got: ${totalSeats}`);
  }

  const tier_1 = Math.min(totalSeats, 20); // First 20 seats
  const tier_2 = Math.min(Math.max(totalSeats - 20, 0), 30); // Seats 21-50
  const tier_3 = Math.max(totalSeats - 50, 0); // Seats 51-100

  return { tier_1, tier_2, tier_3 };
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
    const { organizationId, seatCount, billingPeriod, applyImmediately, successUrl, cancelUrl } = await req.json();

    console.log('🪑 Seat purchase request:', {
      organizationId,
      seatCount,
      billingPeriod,
      applyImmediately: applyImmediately !== false, // Default to true if not specified
      userId: user.id,
    });

    // Validate inputs
    if (!organizationId || !seatCount || !billingPeriod) {
      throw new Error('Missing required parameters: organizationId, seatCount, or billingPeriod');
    }

    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      throw new Error('Invalid billing period. Must be "monthly" or "yearly"');
    }

    if (seatCount < 1 || seatCount > 100) {
      throw new Error('Seat count must be between 1 and 100');
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

    console.log('✅ Organization validated:', {
      currentSeats: organization.seat_limit || 0,
    });

    // Calculate tier breakdown for progressive pricing
    const tierBreakdown = calculateTierBreakdown(seatCount);
    console.log('📊 Tier breakdown:', tierBreakdown);

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

      // Create or update organization subscription record
      if (orgSubscriptions?.length > 0) {
        await supabaseClient
          .from('organization_subscriptions')
          .update({ stripe_customer_id: customerId })
          .eq('id', orgSubscriptions[0].id);
      } else {
        await supabaseClient
          .from('organization_subscriptions')
          .insert({
            organization_id: organizationId,
            stripe_customer_id: customerId,
            status: 'incomplete',
          });
      }
    }

    // Check if organization already has an active seat subscription
    const existingSubscriptionId = orgSubscriptions?.[0]?.stripe_subscription_id;

    if (existingSubscriptionId) {
      // UPDATE existing subscription (handles seat increase/decrease)
      console.log('🔄 Updating existing seat subscription:', {
        subscriptionId: existingSubscriptionId,
        newSeatCount: seatCount,
      });

      try {
        // Retrieve the existing subscription
        const subscription = await stripe.subscriptions.retrieve(existingSubscriptionId);

        // Verify subscription is active
        if (subscription.status !== 'active' && subscription.status !== 'trialing') {
          throw new Error(`Cannot update subscription with status: ${subscription.status}`);
        }

        // Build new line items for tier breakdown
        const lineItems: Stripe.SubscriptionUpdateParams.Item[] = [];

        // Find existing items by price ID
        const existingItems = subscription.items.data;
        const priceIds = TIER_PRICE_IDS[billingPeriod as 'monthly' | 'yearly'];

        // Tier 1
        const tier1Item = existingItems.find(item => item.price.id === priceIds.tier_1);
        if (tierBreakdown.tier_1 > 0) {
          lineItems.push({
            id: tier1Item?.id,
            price: priceIds.tier_1,
            quantity: tierBreakdown.tier_1,
          });
        } else if (tier1Item) {
          lineItems.push({ id: tier1Item.id, deleted: true });
        }

        // Tier 2
        const tier2Item = existingItems.find(item => item.price.id === priceIds.tier_2);
        if (tierBreakdown.tier_2 > 0) {
          lineItems.push({
            id: tier2Item?.id,
            price: priceIds.tier_2,
            quantity: tierBreakdown.tier_2,
          });
        } else if (tier2Item) {
          lineItems.push({ id: tier2Item.id, deleted: true });
        }

        // Tier 3
        const tier3Item = existingItems.find(item => item.price.id === priceIds.tier_3);
        if (tierBreakdown.tier_3 > 0) {
          lineItems.push({
            id: tier3Item?.id,
            price: priceIds.tier_3,
            quantity: tierBreakdown.tier_3,
          });
        } else if (tier3Item) {
          lineItems.push({ id: tier3Item.id, deleted: true });
        }

        // Determine proration behavior based on applyImmediately flag
        // IMPORTANT: Understanding Stripe proration behavior:
        //
        // 'create_prorations' (immediate):
        //   - Seat changes apply IMMEDIATELY
        //   - Prorated invoice created and charged NOW
        //   - User gets immediate access to new seats (or loses access if reducing)
        //
        // 'none' (scheduled billing):
        //   - Seat changes STILL APPLY IMMEDIATELY (subscription items update now)
        //   - NO prorated invoice generated
        //   - New amount charged at next renewal date
        //   - Use case: Adding seats near period end to avoid small prorated charge
        //
        // Note: There is NO Stripe option to defer the functional seat change itself.
        // The 'scheduled' option only defers the billing, not the seat availability.
        const shouldApplyImmediately = applyImmediately !== false;

        const updateParams: Stripe.SubscriptionUpdateParams = {
          items: lineItems,
          proration_behavior: shouldApplyImmediately ? 'create_prorations' : 'none',
          billing_cycle_anchor: 'unchanged', // Keep the same renewal date
        };

        if (!shouldApplyImmediately) {
          console.log('📅 Using deferred billing (seats available immediately, invoiced at next period)');
        } else {
          console.log('⚡ Using immediate billing with proration');
        }

        // Update subscription
        const updatedSubscription = await stripe.subscriptions.update(existingSubscriptionId, updateParams);

        console.log('✅ Subscription updated successfully:', {
          subscriptionId: updatedSubscription.id,
          newSeatCount: seatCount,
          status: updatedSubscription.status,
        });

        // Update database (webhook will also handle this, but update immediately for consistency)
        await supabaseClient
          .from('organization_subscriptions')
          .update({
            total_seats: seatCount,
            tier_1_seats: tierBreakdown.tier_1,
            tier_2_seats: tierBreakdown.tier_2,
            tier_3_seats: tierBreakdown.tier_3,
            billing_period: billingPeriod,
          })
          .eq('id', orgSubscriptions[0].id);

        const responseMessage = shouldApplyImmediately
          ? 'Sièges mis à jour avec succès et effet immédiat'
          : `Modification planifiée pour le prochain renouvellement (${seatCount} sièges)`;

        return new Response(
          JSON.stringify({
            success: true,
            message: responseMessage,
            subscriptionId: updatedSubscription.id,
            quantity: seatCount,
            prorated: shouldApplyImmediately,
            scheduled: !shouldApplyImmediately,
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
      seatCount,
      tierBreakdown,
    });

    // Build line items for each tier
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    const priceIds = TIER_PRICE_IDS[billingPeriod as 'monthly' | 'yearly'];

    if (tierBreakdown.tier_1 > 0) {
      lineItems.push({
        price: priceIds.tier_1,
        quantity: tierBreakdown.tier_1,
      });
    }

    if (tierBreakdown.tier_2 > 0) {
      lineItems.push({
        price: priceIds.tier_2,
        quantity: tierBreakdown.tier_2,
      });
    }

    if (tierBreakdown.tier_3 > 0) {
      lineItems.push({
        price: priceIds.tier_3,
        quantity: tierBreakdown.tier_3,
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: lineItems,
      success_url: successUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/dashboard-organization?seat-checkout=success`,
      cancel_url: cancelUrl || `${Deno.env.get('SITE_URL') || 'http://localhost:8080'}/dashboard-organization?seat-checkout=canceled`,
      allow_promotion_codes: true,
      metadata: {
        organization_id: organizationId,
        user_id: user.id,
        seat_count: seatCount.toString(),
        billing_period: billingPeriod,
        checkout_type: 'seat_purchase',
        tier_1_seats: tierBreakdown.tier_1.toString(),
        tier_2_seats: tierBreakdown.tier_2.toString(),
        tier_3_seats: tierBreakdown.tier_3.toString(),
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
