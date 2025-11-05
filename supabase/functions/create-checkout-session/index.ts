import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Price IDs from Stripe
const PRICE_IDS = {
  premium: 'price_1SNu6P37eeTawvFRvh1JGgOC',      // Plan personnel premium - 9.90€/month
  pro: 'price_1SNu6N37eeTawvFR0CRbzo7F',          // Plan personnel pro - 19.90€/month
  ai_10min: 'price_1SNu6D37eeTawvFRAVwbpsol',    // Avatar IA - 10min - 5€
  ai_30min: 'price_1SNu6B37eeTawvFRjJ20hc7w',    // Avatar IA - 30min - 15€
  ai_60min: 'price_1SNu5g37eeTawvFRdsQ1vIYp',    // Avatar IA - 60min - 20€
};

// Price tier mapping for upgrade/downgrade detection
const PRICE_TIERS: Record<string, number> = {
  [PRICE_IDS.premium]: 990,  // 9.90€ in cents
  [PRICE_IDS.pro]: 1990,     // 19.90€ in cents
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { priceId, mode, successUrl, cancelUrl } = await req.json();

    if (!priceId || !mode) {
      throw new Error('Missing required parameters: priceId and mode');
    }

    // Validate mode
    if (!['subscription', 'payment'].includes(mode)) {
      throw new Error('Invalid mode. Must be "subscription" or "payment"');
    }

    // CRITICAL VALIDATION: Check if user is in an organization
    // Users in organizations should NOT be able to purchase individual subscriptions
    // They already benefit from the organization subscription
    if (mode === 'subscription') {
      const { data: orgMembership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (orgMembership) {
        throw new Error(
          'Vous êtes membre d\'une organisation et bénéficiez déjà d\'un abonnement. ' +
          'Vous ne pouvez pas souscrire à un plan individuel. ' +
          'Contactez l\'administrateur de votre organisation pour toute question.'
        );
      }
    }

    // Get or create Stripe customer
    let customerId: string;

    // Check if user already has a Stripe customer ID
    const { data: userSub } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (userSub?.stripe_customer_id) {
      customerId = userSub.stripe_customer_id;
    } else {
      // Get user email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', user.id)
        .single();

      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: profile?.email || user.email!,
        metadata: {
          user_id: user.id,
        },
      });

      customerId = customer.id;

      // Save customer ID to database
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: user.id,
          stripe_customer_id: customerId,
        }, {
          onConflict: 'user_id'
        });
    }

    // Determine success and cancel URLs
    const baseUrl = req.headers.get('origin') || 'http://localhost:8080';
    const finalSuccessUrl = successUrl || `${baseUrl}/profile?checkout=success`;
    const finalCancelUrl = cancelUrl || `${baseUrl}/profile?checkout=canceled`;

    // Create checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: mode as 'subscription' | 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        user_id: user.id,
      },
      allow_promotion_codes: true,
    };

    // Add subscription-specific options
    if (mode === 'subscription') {
      // Check if user already has an active subscription
      if (userSub?.stripe_subscription_id) {
        // User is changing their subscription (upgrade or downgrade)
        // Instead of using Checkout, update the subscription directly with proration
        console.log('🔄 Changing existing subscription:', userSub.stripe_subscription_id);

        try {
          // Retrieve the current subscription
          const currentSubscription = await stripe.subscriptions.retrieve(userSub.stripe_subscription_id);
          const currentPriceId = currentSubscription.items.data[0].price.id;

          // Detect if this is an upgrade or downgrade
          const currentTier = PRICE_TIERS[currentPriceId] || 0;
          const newTier = PRICE_TIERS[priceId] || 0;

          let changeType = 'change';
          let message = 'Subscription updated successfully';

          if (newTier > currentTier) {
            changeType = 'upgrade';
            message = 'Subscription upgraded successfully';
            console.log('⬆️ Upgrading from', currentTier, 'to', newTier);
          } else if (newTier < currentTier) {
            changeType = 'downgrade';
            message = 'Subscription downgraded successfully';
            console.log('⬇️ Downgrading from', currentTier, 'to', newTier);
          } else {
            console.log('🔄 Same tier, updating subscription');
          }

          // Update the subscription to the new price with proration
          const updatedSubscription = await stripe.subscriptions.update(userSub.stripe_subscription_id, {
            items: [
              {
                id: currentSubscription.items.data[0].id,
                price: priceId,
              },
            ],
            proration_behavior: 'create_prorations', // Credit unused time, charge/refund difference
            metadata: {
              user_id: user.id,
            },
          });

          console.log('✅ Subscription updated successfully:', updatedSubscription.id);

          // Return success - no checkout needed
          return new Response(
            JSON.stringify({
              success: true,
              changeType: changeType,
              subscriptionId: updatedSubscription.id,
              message: message,
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          );
        } catch (updateError: any) {
          console.error('❌ Error updating subscription:', updateError);
          throw new Error(`Failed to update subscription: ${updateError.message}`);
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

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
  } catch (err: any) {
    console.error('❌ Error creating checkout session:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
