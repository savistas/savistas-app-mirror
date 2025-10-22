import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const EQUOS_API_BASE = 'https://api.equos.ai/v1';

interface CreateSessionRequest {
  agentId: string;
  avatarId: string;
  studentName: string;
  maxDuration?: number; // Durée max en secondes (optionnel)
  consumerIdentity?: {
    identity: string;
    name: string;
  };
}

interface EquosSession {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  host: {
    serverUrl: string;
  };
  avatarId: string;
  avatar: {
    id: string;
    name: string;
    thumbnailUrl?: string;
  };
  agentId?: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateSessionResponse {
  session: EquosSession;
  consumerAccessToken: string;
  remoteAgentAccessToken?: string;
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
    const { agentId, avatarId, studentName, maxDuration, consumerIdentity }: CreateSessionRequest = await req.json();

    if (!agentId || !avatarId || !studentName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: agentId, avatarId, studentName' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('🎬 [EQUOS] Creating session...');
    console.log('🎭 [EQUOS] Agent ID:', agentId);
    console.log('🎨 [EQUOS] Avatar ID:', avatarId);
    console.log('👤 [EQUOS] Student:', studentName);
    if (maxDuration) {
      console.log('⏱️ [EQUOS] Max Duration:', maxDuration, 'seconds');
    }

    // Générer une identité par défaut si non fournie
    const finalConsumerIdentity = consumerIdentity || {
      identity: `student_${Date.now()}`,
      name: studentName
    };

    // Créer la session via l'API Equos
    const requestBody: any = {
      name: `Session - ${studentName} - ${new Date().toISOString()}`,
      client: studentName,
      agent: {
        id: agentId
      },
      avatar: {
        id: avatarId
      },
      consumerIdentity: finalConsumerIdentity
    };

    // Ajouter maxDuration si fourni (pour limiter la durée de conversation)
    if (maxDuration) {
      requestBody.maxDuration = maxDuration;
    }

    const response = await fetch(`${EQUOS_API_BASE}/sessions`, {
      method: 'POST',
      headers: {
        'x-api-key': EQUOS_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [EQUOS] Error creating session:', {
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

    const sessionData: CreateSessionResponse = await response.json();
    console.log('✅ [EQUOS] Session created:', sessionData.session.id);
    console.log('🔗 [EQUOS] LiveKit server:', sessionData.session.host.serverUrl);

    return new Response(
      JSON.stringify(sessionData),
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
