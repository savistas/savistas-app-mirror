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

    const { context, organization_id, return_url } = await req.json();

    if (!context || !['individual', 'organization'].includes(context)) {
      throw new Error('Invalid context. Must be "individual" or "organization"');
    }

    let customerId: string;
    let defaultReturnUrl: string;

    if (context === 'individual') {
      console.log('🔐 Creating portal session for individual user:', user.id);

      // Get user's Stripe customer ID
      const { data: userSub, error: subError } = await supabase
        .from('user_subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

      if (subError || !userSub?.stripe_customer_id) {
        throw new Error('No active subscription found');
      }

      customerId = userSub.stripe_customer_id;
      defaultReturnUrl = `${req.headers.get('origin') || 'http://localhost:8080'}/profile`;

    } else if (context === 'organization') {
      console.log('🏢 Creating portal session for organization:', organization_id);

      if (!organization_id) {
        throw new Error('organization_id is required for organization context');
      }

      // Verify user is admin of the organization
      const { data: membership, error: memberError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organization_id)
        .eq('status', 'active')
        .single();

      if (memberError || !membership) {
        throw new Error('You are not a member of this organization');
      }

      if (membership.role !== 'admin') {
        throw new Error('Only organization admins can access billing management');
      }

      // Get organization's Stripe customer ID
      const { data: orgSub, error: orgSubError } = await supabase
        .from('organization_subscriptions')
        .select('stripe_customer_id')
        .eq('organization_id', organization_id)
        .single();

      if (orgSubError || !orgSub?.stripe_customer_id) {
        throw new Error('No active organization subscription found');
      }

      customerId = orgSub.stripe_customer_id;
      defaultReturnUrl = `${req.headers.get('origin') || 'http://localhost:8080'}/dashboard-organization`;
    } else {
      throw new Error('Invalid context');
    }

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: return_url || defaultReturnUrl,
    });

    console.log('✅ Portal session created:', portalSession.id);

    return new Response(
      JSON.stringify({
        url: portalSession.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('❌ Error creating portal session:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
