import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

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

    const { resourceType } = await req.json();

    if (!resourceType) {
      throw new Error('Missing required parameter: resourceType');
    }

    // Validate resource type
    const validTypes = ['course', 'exercise', 'fiche', 'ai_minutes'];
    if (!validTypes.includes(resourceType)) {
      throw new Error(`Invalid resource type. Must be one of: ${validTypes.join(', ')}`);
    }

    // Call PostgreSQL function to check limits
    const { data, error } = await supabase
      .rpc('can_create_resource', {
        p_user_id: user.id,
        p_resource_type: resourceType,
      });

    if (error) {
      console.error('❌ Error checking limits:', error);
      throw error;
    }

    const result = data[0];

    return new Response(
      JSON.stringify({
        allowed: result.allowed,
        current: result.current_usage,
        limit: result.limit_value,
        remaining: result.remaining,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (err: any) {
    console.error('❌ Error in check-usage-limits:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
