import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Trigger course generation started');

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('🔑 Token extracted, verifying user...');

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('✅ User authenticated:', user.id);

    // Parse request body
    const body = await req.json();
    console.log('📦 Request body:', body);

    const { course_id, user_id, qcm_per_day, document_id, hasExistingContent } = body;

    // Validate required fields
    if (!course_id || !user_id) {
      console.error('❌ Missing required fields');
      throw new Error('Missing required fields: course_id and user_id');
    }

    // Verify that the user_id matches the authenticated user
    if (user_id !== user.id) {
      console.error('❌ User ID mismatch:', { provided: user_id, authenticated: user.id });
      throw new Error('User ID mismatch');
    }

    console.log('✅ Validation passed');

    // Choose webhook based on whether course content already exists
    const webhookUrl = hasExistingContent
      ? "https://n8n.srv932562.hstgr.cloud/webhook/upload-course-with-content-ok"
      : "https://n8n.srv932562.hstgr.cloud/webhook/gneration-cours-savistas";

    // Prepare webhook payload
    const webhookPayload: any = {
      course_id: String(course_id),
      user_id: String(user_id),
      qcm_per_day: qcm_per_day || 5,
    };

    // Add document_id if it exists (for standalone documents)
    if (document_id) {
      webhookPayload.document_id = String(document_id);
    }

    console.log('Calling n8n webhook:', webhookUrl);
    console.log('Payload:', webhookPayload);

    // Call n8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Webhook error:', errorText);
      throw new Error(`Webhook error: ${webhookResponse.status} - ${errorText}`);
    }

    // Parse webhook response
    const webhookData = await webhookResponse.json();
    console.log('Webhook response:', webhookData);

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: webhookData,
        course_id: webhookData.id_course || course_id,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('❌ Error in trigger-course-generation:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
