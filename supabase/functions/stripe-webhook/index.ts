import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

// Individual user product ID to plan mapping
const PRODUCT_TO_PLAN: Record<string, string> = {
  'prod_TKZEuhKCVXME7l': 'premium', // Plan personnel premium
  'prod_TKZEcbBNDNMCmR': 'pro',     // Plan personnel pro
};

// Old B2B plan-based products (DEPRECATED - migrated to seat-based billing)
// These are kept for reference only and will log errors if encountered
const DEPRECATED_ORG_PRODUCTS = new Set([
  'prod_TKZEnwNiSwAjiu', 'prod_TKZEg8FhoYWpQp', 'prod_TKZEwBnUONQnHD', // Monthly
  'prod_TKZERNkKTiGW4k', 'prod_TKZEGlgJJhRX20', 'prod_TKZE2ydWNgjoR6', // Yearly
]);

// AI minutes products
const AI_MINUTES_PRODUCTS: Record<string, number> = {
  'prod_TKZEb1hffKMjt9': 10,  // Avatar IA - 10min
  'prod_TKZEPlyD9oRz7p': 30,  // Avatar IA - 30min
  'prod_TKZE9LG0MXrH1i': 60,  // Avatar IA - 60min
};

// NOTE: Invoice emails are handled by Stripe automatic emails
// Configure in Stripe Dashboard → Settings → Emails → "Successful payments"

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response(
      JSON.stringify({ error: 'No signature provided' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log('✅ Webhook verified:', event.type);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      // Checkout completed - Initial subscription or one-time purchase
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('💳 Checkout completed:', {
          mode: session.mode,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
        });

        if (session.mode === 'subscription') {
          // Check if this is a seat purchase (has checkout_type: 'seat_purchase')
          if (session.metadata?.checkout_type === 'seat_purchase') {
            console.log('🪑 Seat purchase detected');
            await handleSeatPurchase(supabase, session);
          }
          // Check if this is an old organization subscription (DEPRECATED)
          else if (session.metadata?.organization_id) {
            console.error('❌ DEPRECATED: Old plan-based organization subscription detected. System has migrated to seat-based billing.');
            console.error('   Organization ID:', session.metadata.organization_id);
            console.error('   Please use seat-based purchasing instead.');
            // Do not process - these subscriptions are no longer supported
          } else {
            console.log('👤 Individual subscription detected');
            await handleSubscriptionCreated(supabase, session);
          }
        } else if (session.mode === 'payment') {
          // One-time payment (AI minutes)
          await handleOneTimePayment(supabase, session);
        }
        break;
      }

      // Subscription updated (plan changed, renewed, etc.)
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('🔄 Subscription updated:', subscription.id);

        // Check if this is a seat subscription update (quantity change, etc.)
        if (subscription.metadata?.checkout_type === 'seat_purchase' || subscription.metadata?.seat_count) {
          console.log('🪑 Seat subscription update');
          await handleSeatSubscriptionUpdated(supabase, subscription);
        }
        // Check if this is an old organization subscription (DEPRECATED)
        else if (subscription.metadata?.organization_id) {
          console.error('❌ DEPRECATED: Old plan-based organization subscription update detected. System has migrated to seat-based billing.');
          console.error('   Subscription ID:', subscription.id);
          console.error('   Organization ID:', subscription.metadata.organization_id);
          // Do not process - these subscriptions are no longer supported
        } else {
          console.log('👤 Individual subscription update');
          await handleSubscriptionUpdated(supabase, subscription);
        }
        break;
      }

      // Subscription deleted (canceled)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription deleted:', subscription.id);

        // Check if this is a seat subscription cancellation
        if (subscription.metadata?.checkout_type === 'seat_purchase' || subscription.metadata?.seat_count) {
          console.log('🪑 Seat subscription cancellation');
          await handleSeatSubscriptionDeleted(supabase, subscription);
        }
        // Check if organization subscription
        else if (subscription.metadata?.organization_id) {
          console.log('🏢 Organization subscription deletion');
          await handleOrgSubscriptionDeleted(supabase, subscription);
        } else {
          console.log('👤 Individual subscription deletion');
          await handleSubscriptionDeleted(supabase, subscription);
        }
        break;
      }

      // Invoice payment succeeded (renewal)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          console.log('💰 Renewal payment succeeded:', invoice.subscription);

          // Retrieve subscription to check metadata
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const organizationId = subscription.metadata?.organization_id;

          if (organizationId) {
            console.log('🏢 Organization renewal');
            await handleOrgRenewal(supabase, invoice);
          } else {
            console.log('👤 Individual renewal');
            await handleRenewal(supabase, invoice);
          }

          // NOTE: Invoice emails are sent automatically by Stripe
          // No manual email sending needed
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('⚠️ Payment failed:', invoice.subscription);

        if (invoice.subscription) {
          // Retrieve subscription to check metadata
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const organizationId = subscription.metadata?.organization_id;

          if (organizationId) {
            console.log('🏢 Organization payment failed');
            await handleOrgPaymentFailed(supabase, invoice);
          } else {
            console.log('👤 Individual payment failed');
            await handlePaymentFailed(supabase, invoice);
          }
        }
        break;
      }

      default:
        console.log('ℹ️ Unhandled event type:', event.type);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('❌ Webhook error:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// Handle new subscription creation
async function handleSubscriptionCreated(supabase: any, session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  console.log('🔄 Processing subscription creation:', {
    customerId,
    subscriptionId,
    sessionId: session.id
  });

  // Retrieve full subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const productId = subscription.items.data[0].price.product as string;
  const plan = PRODUCT_TO_PLAN[productId] || 'basic';

  console.log('📦 Product details:', {
    productId,
    plan,
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end
  });

  // Get user_id from session metadata
  const userId = session.metadata?.user_id;

  if (!userId) {
    console.error('❌ No user_id in session metadata');
    return;
  }

  console.log('👤 Processing for user_id:', userId);

  // Upsert user subscription
  const { error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan: plan,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('❌ Error upserting subscription:', error);
    throw error;
  }

  // Update profile subscription field for backward compatibility
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ subscription: plan })
    .eq('user_id', userId);

  if (profileError) {
    console.error('❌ Error updating profile subscription:', profileError);
    throw profileError;
  }

  console.log(`✅ Subscription created for user ${userId} with plan ${plan}`);
}

// Handle subscription update
async function handleSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const productId = subscription.items.data[0].price.product as string;
  const plan = PRODUCT_TO_PLAN[productId] || 'basic';

  // Find user by stripe_subscription_id
  const { data: userSub, error: findError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (findError || !userSub) {
    console.error('❌ User subscription not found for:', subscription.id);
    return;
  }

  // Update subscription
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      plan: plan,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
    })
    .eq('user_id', userSub.user_id);

  if (error) {
    console.error('❌ Error updating subscription:', error);
    throw error;
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ subscription: plan })
    .eq('user_id', userSub.user_id);

  if (profileError) {
    console.error('❌ Error updating profile subscription:', profileError);
    throw profileError;
  }

  console.log(`✅ Subscription updated for user ${userSub.user_id} to plan ${plan}`);
}

// Handle subscription deletion (downgrade to basic)
async function handleSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  // Find user by stripe_subscription_id
  const { data: userSub, error: findError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscription.id)
    .single();

  if (findError || !userSub) {
    console.error('❌ User subscription not found for:', subscription.id);
    return;
  }

  // Downgrade to basic
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      plan: 'basic',
      status: 'canceled',
      stripe_subscription_id: null,
      cancel_at_period_end: false,
      canceled_at: new Date().toISOString(),
    })
    .eq('user_id', userSub.user_id);

  if (error) {
    console.error('❌ Error downgrading subscription:', error);
    throw error;
  }

  // Update profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ subscription: 'basic' })
    .eq('user_id', userSub.user_id);

  if (profileError) {
    console.error('❌ Error updating profile to basic:', profileError);
    throw profileError;
  }

  console.log(`✅ User ${userSub.user_id} downgraded to basic`);
}

// Handle renewal
async function handleRenewal(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  // Retrieve subscription
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find user
  const { data: userSub, error: findError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (findError || !userSub) {
    console.error('❌ User subscription not found for:', subscriptionId);
    return;
  }

  // Update period dates
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      status: 'active',
    })
    .eq('user_id', userSub.user_id);

  if (error) {
    console.error('❌ Error updating renewal:', error);
    throw error;
  }

  console.log(`✅ Subscription renewed for user ${userSub.user_id}`);
}

// Handle payment failure
async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;

  if (!subscriptionId) return;

  // Find user
  const { data: userSub, error: findError } = await supabase
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();

  if (findError || !userSub) {
    console.error('❌ User subscription not found for:', subscriptionId);
    return;
  }

  // Update status to past_due
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'past_due',
    })
    .eq('user_id', userSub.user_id);

  if (error) {
    console.error('❌ Error updating payment failure:', error);
    throw error;
  }

  console.log(`⚠️ Payment failed for user ${userSub.user_id}`);
}

// Handle one-time payment (AI minutes)
async function handleOneTimePayment(supabase: any, session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;

  if (!userId) {
    console.error('❌ No user_id in session metadata');
    return;
  }

  // Get purchased items
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  let totalMinutes = 0;
  for (const item of lineItems.data) {
    const productId = item.price?.product as string;
    const minutes = AI_MINUTES_PRODUCTS[productId];

    if (minutes) {
      totalMinutes += minutes * item.quantity!;
    }
  }

  if (totalMinutes === 0) {
    console.log('ℹ️ No AI minutes in this purchase');
    return;
  }

  // Increment ai_minutes_purchased
  const { error } = await supabase.rpc('increment', {
    table_name: 'user_subscriptions',
    column_name: 'ai_minutes_purchased',
    increment_by: totalMinutes,
    match_column: 'user_id',
    match_value: userId
  });

  // If RPC doesn't exist, use update directly
  if (error) {
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('ai_minutes_purchased')
      .eq('user_id', userId)
      .single();

    const newTotal = (currentSub?.ai_minutes_purchased || 0) + totalMinutes;

    await supabase
      .from('user_subscriptions')
      .update({ ai_minutes_purchased: newTotal })
      .eq('user_id', userId);
  }

  console.log(`✅ Added ${totalMinutes} AI minutes to user ${userId}`);
}


// ============================================================================
// DEPRECATED: OLD ORGANIZATION SUBSCRIPTION HANDLERS (PLAN-BASED)
// ============================================================================
// These handlers have been removed as the system migrated to seat-based billing.
// Old plan-based subscriptions (b2b_pro/max/ultra) are no longer supported.
// All organization billing now uses the seat purchase system with progressive
// tier pricing (€35/€32/€29 per seat).
//
// See handleSeatPurchase, handleSeatSubscriptionUpdated, and
// handleSeatSubscriptionDeleted below for the new implementation.
// ============================================================================

// ============================================================================
// SEAT PURCHASE HANDLERS (TIER-BASED)
// ============================================================================

// Calculate tier breakdown from total seats
function calculateTierBreakdown(totalSeats: number): { tier_1: number; tier_2: number; tier_3: number } {
  const tier_1 = Math.min(totalSeats, 20); // First 20 seats
  const tier_2 = Math.min(Math.max(totalSeats - 20, 0), 30); // Seats 21-50
  const tier_3 = Math.max(totalSeats - 50, 0); // Seats 51-100
  return { tier_1, tier_2, tier_3 };
}

// Extract total seats from Stripe subscription items
function getTotalSeatsFromSubscription(subscription: Stripe.Subscription): number {
  // Sum up all line items (they represent different tiers)
  return subscription.items.data.reduce((total, item) => total + (item.quantity || 0), 0);
}

// Handle new seat purchase
async function handleSeatPurchase(supabase: any, session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organization_id;
  const seatCount = parseInt(session.metadata?.seat_count || '0', 10);
  const tier1Seats = parseInt(session.metadata?.tier_1_seats || '0', 10);
  const tier2Seats = parseInt(session.metadata?.tier_2_seats || '0', 10);
  const tier3Seats = parseInt(session.metadata?.tier_3_seats || '0', 10);
  const billingPeriod = session.metadata?.billing_period;
  const subscriptionId = session.subscription as string;

  if (!organizationId || !seatCount) {
    console.error('❌ Missing organization_id or seat_count in metadata');
    return;
  }

  console.log('🪑 Processing seat purchase:', {
    organizationId,
    totalSeats: seatCount,
    tierBreakdown: { tier1Seats, tier2Seats, tier3Seats },
    billingPeriod,
    subscriptionId,
  });

  // Get subscription to retrieve next billing date
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const nextBillingDate = new Date(subscription.current_period_end * 1000).toISOString();

  // Update organization subscription with tier-based seats
  // The database trigger will automatically sync seat_limit with total_seats
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      stripe_subscription_id: subscriptionId,
      total_seats: seatCount,
      tier_1_seats: tier1Seats,
      tier_2_seats: tier2Seats,
      tier_3_seats: tier3Seats,
      billing_period: billingPeriod,
      next_billing_date: nextBillingDate,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: nextBillingDate,
    })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('❌ Error updating seat purchase:', error);
    throw error;
  }

  console.log(`✅ Purchased ${seatCount} seats for organization ${organizationId}`);
}

// Handle seat subscription update (quantity change, proration, etc.)
async function handleSeatSubscriptionUpdated(supabase: any, subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organization_id;

  if (!organizationId) {
    console.error('❌ No organization_id in seat subscription metadata');
    return;
  }

  // Calculate total seats from all line items
  const totalSeats = getTotalSeatsFromSubscription(subscription);

  // Calculate tier breakdown
  const tierBreakdown = calculateTierBreakdown(totalSeats);

  console.log('🪑 Updating seat subscription:', {
    organizationId,
    totalSeats,
    tierBreakdown,
    subscriptionId: subscription.id,
  });

  // Update with new tier breakdown
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      total_seats: totalSeats,
      tier_1_seats: tierBreakdown.tier_1,
      tier_2_seats: tierBreakdown.tier_2,
      tier_3_seats: tierBreakdown.tier_3,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      next_billing_date: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('❌ Error updating seat subscription:', error);
    throw error;
  }

  console.log(`✅ Updated seat count to ${totalSeats} for organization ${organizationId}`);
}

// Handle seat subscription cancellation
async function handleSeatSubscriptionDeleted(supabase: any, subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organization_id;

  if (!organizationId) {
    console.error('❌ No organization_id in seat subscription metadata');
    return;
  }

  console.log('🪑 Canceling seat subscription for organization:', organizationId);

  // Set all seats to 0 (organization loses all seats)
  const { error } = await supabase
    .from('organization_subscriptions')
    .update({
      total_seats: 0,
      tier_1_seats: 0,
      tier_2_seats: 0,
      tier_3_seats: 0,
      status: 'canceled',
    })
    .eq('organization_id', organizationId);

  if (error) {
    console.error('❌ Error canceling seat subscription:', error);
    throw error;
  }

  console.log(`✅ Seat subscription canceled for organization ${organizationId} - reverted to included seats only`);
}
