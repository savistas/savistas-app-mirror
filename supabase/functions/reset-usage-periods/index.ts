import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

/**
 * This Edge Function should be called periodically (via cron) to:
 * 1. Check for subscriptions that have expired
 * 2. Downgrade canceled subscriptions to basic
 * 3. Reset usage periods for active subscriptions
 *
 * Recommended schedule: Run every hour or daily
 */
serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date();

    console.log('🔄 Starting period reset check at:', now.toISOString());

    // Get all subscriptions where current_period_end has passed
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('user_subscriptions')
      .select('*')
      .lte('current_period_end', now.toISOString());

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`📊 Found ${expiredSubs?.length || 0} expired periods`);

    let downgradedCount = 0;
    let renewedCount = 0;

    for (const sub of expiredSubs || []) {
      try {
        // Check if subscription should be canceled
        if (sub.cancel_at_period_end || sub.status === 'canceled' || !sub.stripe_subscription_id) {
          // Downgrade to basic
          await supabase
            .from('user_subscriptions')
            .update({
              plan: 'basic',
              status: 'canceled',
              stripe_subscription_id: null,
              cancel_at_period_end: false,
              current_period_start: now.toISOString(),
              current_period_end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('user_id', sub.user_id);

          // Update profile
          await supabase
            .from('profiles')
            .update({ subscription: 'basic' })
            .eq('user_id', sub.user_id);

          downgradedCount++;
          console.log(`⬇️ Downgraded user ${sub.user_id} to basic`);
        } else {
          // Renew subscription for another month
          const newPeriodStart = new Date(sub.current_period_end);
          const newPeriodEnd = new Date(newPeriodStart.getTime() + 30 * 24 * 60 * 60 * 1000);

          await supabase
            .from('user_subscriptions')
            .update({
              current_period_start: newPeriodStart.toISOString(),
              current_period_end: newPeriodEnd.toISOString(),
            })
            .eq('user_id', sub.user_id);

          renewedCount++;
          console.log(`🔄 Renewed subscription for user ${sub.user_id}`);
        }

        // Note: The usage period will be automatically created when user next creates a resource
        // via the get_or_create_usage_period PostgreSQL function
      } catch (error) {
        console.error(`Error processing subscription for user ${sub.user_id}:`, error);
        // Continue with next subscription
      }
    }

    const summary = {
      checked_at: now.toISOString(),
      total_expired: expiredSubs?.length || 0,
      downgraded: downgradedCount,
      renewed: renewedCount,
    };

    console.log('✅ Period reset completed:', summary);

    return new Response(
      JSON.stringify(summary),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('❌ Error in reset-usage-periods:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});
