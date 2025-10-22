import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EQUOS_API_BASE = 'https://api.equos.ai/v1';

interface CreateAgentRequest {
  instructions: string;
  studentName: string;
}

interface CreateAgentResponse {
  id: string;
  organizationId: string;
  name?: string;
  provider: string;
  config: {
    instructions: string;
    model: string;
    voice: string;
  };
  createdAt: string;
  updatedAt: string;
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Récupérer la clé secrète depuis les secrets Supabase
    const EQUOS_SECRET_KEY = Deno.env.get('EQUOS_SECRET_KEY');

    if (!EQUOS_SECRET_KEY) {
      throw new Error('EQUOS_SECRET_KEY not configured in Supabase secrets');
    }

    // Parser la requête
    const { instructions, studentName }: CreateAgentRequest = await req.json();

    if (!instructions || !studentName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: instructions, studentName' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Vérifier la longueur des instructions (max 10000 chars)
    let finalInstructions = instructions;
    if (instructions.length > 10000) {
      console.warn('⚠️ Instructions too long, truncating to 10000 chars');
      finalInstructions = instructions.substring(0, 10000);
    }

    console.log('🎭 [EQUOS] Creating agent for:', studentName);
    console.log('📏 [EQUOS] Instructions length:', finalInstructions.length, 'chars');

    // Créer l'agent via l'API Equos
    const requestBody = {
      name: `Professeur Virtuel - ${studentName}`,
      provider: 'openai',
      config: {
        instructions: finalInstructions,
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy'
      }
    };

    const response = await fetch(`${EQUOS_API_BASE}/agents`, {
      method: 'POST',
      headers: {
        'x-api-key': EQUOS_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [EQUOS] Error creating agent:', {
        status: response.status,
        error: errorData
      });

      return new Response(
        JSON.stringify({
          error: `Equos API error (${response.status})`,
          details: errorData
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const agent: CreateAgentResponse = await response.json();
    console.log('✅ [EQUOS] Agent created:', agent.id);

    return new Response(
      JSON.stringify(agent),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ [EQUOS] Unexpected error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
