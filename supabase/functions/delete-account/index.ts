import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2024-11-20.acacia',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');

    // Create Supabase admin client (for admin operations like deleteUser)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log(`🗑️ Starting account deletion for user ${user.id} (${user.email})`);

    // Step 0: Cancel all active Stripe subscriptions BEFORE deleting data
    console.log('💳 Step 0: Canceling active Stripe subscriptions...');

    let canceledSubscriptions = 0;

    try {
      // 0a. Get and cancel user's personal subscription
      const { data: userSub } = await supabaseAdmin
        .from('user_subscriptions')
        .select('stripe_subscription_id, stripe_customer_id, plan, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userSub?.stripe_subscription_id && userSub.status !== 'canceled') {
        console.log(`  ↳ Canceling user subscription: ${userSub.stripe_subscription_id} (${userSub.plan})`);

        try {
          await stripe.subscriptions.cancel(userSub.stripe_subscription_id, {
            prorate: true, // Provide prorated refund
          });

          // Update database to reflect cancellation
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          console.log(`  ✅ User subscription canceled successfully`);
          canceledSubscriptions++;
        } catch (stripeError: any) {
          console.error(`  ⚠️ Failed to cancel user subscription on Stripe: ${stripeError.message}`);
          // Continue anyway - don't block account deletion
        }
      }

      // 0b. Get and cancel organization subscriptions (for organizations created by this user)
      const { data: userOrgs } = await supabaseAdmin
        .from('organizations')
        .select(`
          id,
          name,
          organization_subscriptions (
            stripe_subscription_id,
            stripe_customer_id,
            plan,
            status
          )
        `)
        .eq('created_by', user.id);

      if (userOrgs && userOrgs.length > 0) {
        console.log(`  ↳ Found ${userOrgs.length} organization(s) created by user`);

        for (const org of userOrgs) {
          const orgSub = org.organization_subscriptions as any;

          if (orgSub?.stripe_subscription_id && orgSub.status !== 'canceled') {
            console.log(`  ↳ Canceling org subscription for "${org.name}": ${orgSub.stripe_subscription_id}`);

            try {
              await stripe.subscriptions.cancel(orgSub.stripe_subscription_id, {
                prorate: true, // Provide prorated refund
              });

              // Update database to reflect cancellation
              await supabaseAdmin
                .from('organization_subscriptions')
                .update({
                  status: 'canceled',
                  canceled_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq('organization_id', org.id);

              console.log(`  ✅ Organization subscription canceled successfully`);
              canceledSubscriptions++;
            } catch (stripeError: any) {
              console.error(`  ⚠️ Failed to cancel org subscription on Stripe: ${stripeError.message}`);
              // Continue anyway - don't block account deletion
            }
          }
        }
      }

      if (canceledSubscriptions > 0) {
        console.log(`✅ Canceled ${canceledSubscriptions} subscription(s) on Stripe`);
      } else {
        console.log('ℹ️ No active subscriptions to cancel');
      }
    } catch (subError: any) {
      console.error('⚠️ Error during subscription cancellation (non-critical):', subError.message);
      // Continue - subscription cancellation errors shouldn't block account deletion
    }

    // Create Supabase client with user token (for RPC call with auth.uid() context)
    // This is CRITICAL: RPC function uses auth.uid() which only works with user token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Step 1: Delete all user data from database tables using RPC function
    console.log('📊 Step 1: Deleting user data from database...');

    const { data: deleteResult, error: rpcError } = await supabaseUser.rpc('delete_user_account');

    if (rpcError) {
      console.error('❌ Error deleting user data:', rpcError);
      throw new Error(`Failed to delete user data: ${rpcError.message}`);
    }

    console.log('✅ User data deleted:', deleteResult);

    // Step 2: Delete user files from storage
    console.log('📁 Step 2: Deleting user files from storage...');

    try {
      // Delete profile photos
      const { data: photoFiles } = await supabaseAdmin.storage
        .from('profile-photos')
        .list(user.id);

      if (photoFiles && photoFiles.length > 0) {
        const photoFilePaths = photoFiles.map(file => `${user.id}/${file.name}`);
        const { error: photoDeleteError } = await supabaseAdmin.storage
          .from('profile-photos')
          .remove(photoFilePaths);

        if (photoDeleteError) {
          console.error('⚠️ Error deleting profile photos:', photoDeleteError);
          // Continue anyway - photos are not critical
        } else {
          console.log(`✅ Deleted ${photoFilePaths.length} profile photo(s)`);
        }
      }

      // Delete course files if bucket exists
      const { data: courseFiles } = await supabaseAdmin.storage
        .from('course-files')
        .list(user.id);

      if (courseFiles && courseFiles.length > 0) {
        const courseFilePaths = courseFiles.map(file => `${user.id}/${file.name}`);
        const { error: courseDeleteError } = await supabaseAdmin.storage
          .from('course-files')
          .remove(courseFilePaths);

        if (courseDeleteError) {
          console.error('⚠️ Error deleting course files:', courseDeleteError);
          // Continue anyway
        } else {
          console.log(`✅ Deleted ${courseFilePaths.length} course file(s)`);
        }
      }
    } catch (storageError: any) {
      console.error('⚠️ Storage deletion error (non-critical):', storageError.message);
      // Continue - storage errors shouldn't block account deletion
    }

    // Step 3: Delete auth user (THIS IS THE CRITICAL STEP)
    console.log('🔐 Step 3: Deleting authentication user...');

    const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteAuthError) {
      console.error('❌ Error deleting auth user:', deleteAuthError);
      throw new Error(`Failed to delete auth user: ${deleteAuthError.message}`);
    }

    console.log('✅ Auth user deleted successfully');

    console.log(`🎉 Account deletion completed successfully for user ${user.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account deleted successfully',
        user_id: user.id,
        subscriptions_canceled: canceledSubscriptions,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('❌ Error deleting account:', err.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || 'Failed to delete account'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
