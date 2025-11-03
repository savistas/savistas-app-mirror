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

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('Missing required parameter: sessionId');
    }

    // Expire the checkout session on Stripe
    try {
      await stripe.checkout.sessions.expire(sessionId);
      console.log(`✅ Checkout session ${sessionId} expired successfully`);
    } catch (stripeError: any) {
      // If the session is already expired or completed, that's fine
      if (stripeError.code === 'resource_missing' || stripeError.code === 'checkout_session_already_completed') {
        console.log(`ℹ️ Session ${sessionId} is already expired or completed`);
      } else {
        throw stripeError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Checkout session canceled successfully',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('❌ Error canceling checkout session:', err);
    return new Response(
      JSON.stringify({
        error: err.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
