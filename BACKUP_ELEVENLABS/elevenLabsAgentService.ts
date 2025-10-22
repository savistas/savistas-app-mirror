/**
 * Service pour créer des agents ElevenLabs personnalisés dynamiquement
 * Intégration avec Écos pour avatars visuels
 */

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8';

export interface ElevenLabsAgentConfig {
  systemPrompt: string;
  firstMessage: string;
  voiceId: string;
  language?: string;
}

export interface ElevenLabsAgent {
  agent_id: string;
}

/**
 * Créer un agent ElevenLabs avec prompt personnalisé
 *
 * @param config - Configuration de l'agent (prompt, voice, etc.)
 * @returns Agent ID unique
 */
export async function createElevenLabsAgent(
  config: ElevenLabsAgentConfig
): Promise<ElevenLabsAgent> {
  console.log('🎙️ [ELEVENLABS] Création agent personnalisé...');
  console.log('📏 Longueur prompt:', config.systemPrompt.length, 'caractères');
  console.log('🔑 [ELEVENLABS] API Key présente:', ELEVENLABS_API_KEY ? 'Oui' : 'Non');

  // Vérifier limite ElevenLabs (5000 chars)
  if (config.systemPrompt.length > 5000) {
    throw new Error(`System prompt trop long (${config.systemPrompt.length} chars). Max: 5000.`);
  }

  const requestBody = {
    name: `Agent ${Date.now()}`, // Nom unique pour l'agent
    conversation_config: {
      agent: {
        prompt: {
          prompt: config.systemPrompt
        },
        first_message: config.firstMessage,
        language: config.language || 'fr'
      },
      llm: {
        provider: 'openai',
        model: 'gpt-4'
      },
      tts: {
        voice_id: config.voiceId,
        stability: 0.8,
        similarity_boost: 0.8
      }
    }
  };

  console.log('📤 [ELEVENLABS] Request body:', JSON.stringify(requestBody, null, 2).substring(0, 500) + '...');
  console.log('🌐 [ELEVENLABS] Endpoint:', `${ELEVENLABS_API_BASE}/convai/agents`);

  // Note: L'endpoint correct est /convai/agents (sans /create)
  const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  console.log('📥 [ELEVENLABS] Response status:', response.status, response.statusText);

  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch (e) {
      errorData = await response.text();
    }
    console.error('❌ [ELEVENLABS] Erreur création agent:');
    console.error('   Status:', response.status);
    console.error('   Status Text:', response.statusText);
    console.error('   Error Data:', errorData);
    throw new Error(`ElevenLabs API error (${response.status}): ${JSON.stringify(errorData)}`);
  }

  const data = await response.json();
  console.log('✅ [ELEVENLABS] Agent créé:', data.agent_id);

  return data;
}

/**
 * Mettre à jour un agent ElevenLabs existant
 *
 * @param agentId - ID de l'agent à mettre à jour
 * @param updates - Champs à modifier
 */
export async function updateElevenLabsAgent(
  agentId: string,
  updates: Partial<ElevenLabsAgentConfig>
): Promise<void> {
  console.log('🔄 [ELEVENLABS] Mise à jour agent:', agentId);

  const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      conversation_config: {
        agent: updates.systemPrompt ? {
          prompt: { prompt: updates.systemPrompt },
          ...(updates.firstMessage && { first_message: updates.firstMessage }),
          ...(updates.language && { language: updates.language })
        } : undefined,
        tts: updates.voiceId ? {
          voice_id: updates.voiceId,
          stability: 0.8,
          similarity_boost: 0.8
        } : undefined
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to update ElevenLabs agent: ${response.statusText}`);
  }

  console.log('✅ [ELEVENLABS] Agent mis à jour');
}

/**
 * Obtenir une signed URL pour un agent
 *
 * @param agentId - ID de l'agent
 * @returns Signed URL pour démarrer la session
 */
export async function getElevenLabsSignedUrl(agentId: string): Promise<string> {
  const response = await fetch(
    `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${agentId}`,
    {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    }
  );

  if (!response.ok) {
    throw new Error('Impossible de récupérer la signed URL ElevenLabs');
  }

  const data = await response.json();
  return data.signed_url;
}

/**
 * Sélectionner la voix en fonction de la personnalité de l'enseignant
 *
 * @param personality - Type de personnalité ("encourageant", "socratique", etc.)
 * @returns Voice ID ElevenLabs
 */
export function getVoiceIdForPersonality(personality?: string): string {
  // TODO: Mapper avec de vraies voix ElevenLabs
  // Pour l'instant, utiliser une voix par défaut
  const voiceMap: Record<string, string> = {
    encourageant: '21m00Tcm4TlvDq8ikWAM', // Rachel - voix féminine chaleureuse
    socratique: 'EXAVITQu4vr4xnSDxMaL', // Sarah - voix féminine posée
    structuré: 'pNInz6obpgDQGcFmaJgB', // Adam - voix masculine claire
    amical: 'yoZ06aMxZJJ28mfd3POQ', // Sam - voix neutre amicale
    expert: 'onwK4e9ZLuTAKqWW03F9', // Daniel - voix masculine professionnelle
  };

  return voiceMap[personality || 'encourageant'] || '21m00Tcm4TlvDq8ikWAM';
}
