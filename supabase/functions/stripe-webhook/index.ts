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

// Product ID to plan mapping
const PRODUCT_TO_PLAN: Record<string, string> = {
  'prod_TKZEuhKCVXME7l': 'premium', // Plan personnel premium
  'prod_TKZEcbBNDNMCmR': 'pro',     // Plan personnel pro
};

// AI minutes products
const AI_MINUTES_PRODUCTS: Record<string, number> = {
  'prod_TKZEb1hffKMjt9': 10,  // Avatar IA - 10min
  'prod_TKZEPlyD9oRz7p': 30,  // Avatar IA - 30min
  'prod_TKZE9LG0MXrH1i': 60,  // Avatar IA - 60min
};

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
        });

        if (session.mode === 'subscription') {
          // Subscription checkout
          await handleSubscriptionCreated(supabase, session);
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
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      // Subscription deleted (canceled)
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log('❌ Subscription deleted:', subscription.id);
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      // Invoice payment succeeded (renewal)
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription && invoice.billing_reason === 'subscription_cycle') {
          console.log('💰 Renewal payment succeeded:', invoice.subscription);
          await handleRenewal(supabase, invoice);
        }
        break;
      }

      // Invoice payment failed
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log('⚠️ Payment failed:', invoice.subscription);
        await handlePaymentFailed(supabase, invoice);
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
