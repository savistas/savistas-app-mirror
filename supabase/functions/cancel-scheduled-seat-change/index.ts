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
 * Cancel Scheduled Seat Change
 *
 * This function cancels a scheduled seat reduction by releasing the Stripe
 * subscription schedule, converting it back to a normal subscription.
 *
 * This allows organization admins to cancel a planned seat reduction before
 * it takes effect at the next billing period.
 */

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
    const { organizationId } = await req.json();

    console.log('🔄 Cancel scheduled seat change request:', {
      organizationId,
      userId: user.id,
    });

    // Validate inputs
    if (!organizationId) {
      throw new Error('Missing required parameter: organizationId');
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
      throw new Error('Only organization owner can cancel scheduled changes');
    }

    const orgSubscriptions = organization.organization_subscriptions as any[];
    const subscription = orgSubscriptions?.[0];

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    if (!subscription.stripe_schedule_id) {
      throw new Error('No scheduled change to cancel');
    }

    console.log('📅 Releasing subscription schedule:', {
      scheduleId: subscription.stripe_schedule_id,
    });

    // Release the schedule (converts back to regular subscription)
    await stripe.subscriptionSchedules.release(subscription.stripe_schedule_id);

    // Update database to clear schedule info
    await supabaseClient
      .from('organization_subscriptions')
      .update({
        stripe_schedule_id: null,
        seats_pending_decrease: 0,
      })
      .eq('id', subscription.id);

    console.log('✅ Scheduled seat change cancelled successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Modification planifiée annulée avec succès',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error canceling scheduled seat change:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
