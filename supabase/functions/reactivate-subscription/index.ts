import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    const { subscription_id } = await req.json();

    if (!subscription_id) {
      throw new Error('Subscription ID is required');
    }

    console.log(`🔄 Reactivating subscription ${subscription_id} for user ${user.id}`);

    // Verify the subscription belongs to the user
    const { data: userSub, error: findError } = await supabase
      .from('user_subscriptions')
      .select('user_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscription_id)
      .single();

    if (findError || !userSub) {
      throw new Error('Subscription not found or does not belong to user');
    }

    // Reactivate subscription (remove cancel_at_period_end flag)
    const subscription = await stripe.subscriptions.update(subscription_id, {
      cancel_at_period_end: false,
    });

    console.log(`✅ Subscription ${subscription_id} reactivated, will continue after ${new Date(subscription.current_period_end * 1000).toISOString()}`);

    // Update database to reflect reactivation
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('stripe_subscription_id', subscription_id);

    if (updateError) {
      console.error('❌ Error updating database:', updateError);
      throw updateError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Subscription has been reactivated successfully',
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('❌ Error reactivating subscription:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
