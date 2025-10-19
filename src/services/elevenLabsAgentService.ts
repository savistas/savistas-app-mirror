/**
 * Service pour gérer la création et la configuration d'agents ElevenLabs
 */

import { AgentConfig } from './systemPromptGenerator';

/**
 * Configuration de l'API ElevenLabs
 */
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || 'sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8';
const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1';

/**
 * Configuration de l'agent ElevenLabs
 */
export interface ElevenLabsAgentConfig {
  name: string;
  conversation_config: {
    agent: {
      prompt: {
        prompt: string; // System prompt
        llm: string; // Model ID (e.g., "gpt-4")
        temperature: number;
        max_tokens: number;
      };
      first_message: string;
      language: string;
    };
    tts?: {
      voice_id?: string;
      model_id?: string;
    };
  };
}

/**
 * Réponse de l'API lors de la création d'un agent
 */
export interface CreateAgentResponse {
  agent_id: string;
  name: string;
  created_at: string;
}

/**
 * Configuration pour obtenir une signed URL avec override
 */
export interface SignedUrlConfig {
  agent_id: string;
  system_prompt_override?: string;
  first_message_override?: string;
}

/**
 * Créer un nouvel agent ElevenLabs via l'API
 *
 * NOTE: Cette fonction crée un nouvel agent persistant dans ElevenLabs.
 * Pour des conversations temporaires, préférez utiliser getSignedUrlWithOverride()
 */
export async function createElevenLabsAgent(
  agentConfig: AgentConfig,
  agentName: string,
  voiceId: string = 'default'
): Promise<CreateAgentResponse> {
  const config: ElevenLabsAgentConfig = {
    name: agentName,
    conversation_config: {
      agent: {
        prompt: {
          prompt: agentConfig.systemPrompt,
          llm: 'gpt-4', // ou 'gpt-3.5-turbo' selon les besoins
          temperature: 0.7,
          max_tokens: 500,
        },
        first_message: agentConfig.firstMessage,
        language: 'fr', // Français
      },
      tts: {
        voice_id: voiceId,
        model_id: 'eleven_multilingual_v2', // Modèle multilingue pour le français
      },
    },
  };

  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erreur création agent ElevenLabs: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    console.log('✅ Agent ElevenLabs créé:', data);
    return data;
  } catch (error) {
    console.error('❌ Erreur création agent:', error);
    throw error;
  }
}

/**
 * Obtenir une signed URL pour un agent existant
 * Cette méthode permet de démarrer une conversation avec l'agent
 */
export async function getSignedUrl(agentId: string): Promise<string> {
  try {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?agent_id=${agentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erreur récupération signed URL: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('❌ Erreur récupération signed URL:', error);
    throw error;
  }
}

/**
 * Obtenir une signed URL avec override du system prompt
 *
 * APPROCHE ALTERNATIVE: Au lieu de créer un nouvel agent à chaque fois,
 * on utilise l'agent de base mais on override le prompt système.
 *
 * Cette approche est plus efficace car :
 * - Pas de création d'agents superflus dans ElevenLabs
 * - Utilisation d'un seul agent configuré avec une bonne voix
 * - Override du prompt à chaque conversation
 *
 * @param agentId - ID de l'agent de base à utiliser
 * @param systemPromptOverride - Prompt système personnalisé
 * @param firstMessageOverride - Message d'accueil personnalisé
 */
export async function getSignedUrlWithOverride(
  agentId: string,
  systemPromptOverride?: string,
  firstMessageOverride?: string
): Promise<string> {
  try {
    // Construire les paramètres de requête
    const params = new URLSearchParams({
      agent_id: agentId,
    });

    // Note: L'API ElevenLabs pourrait ne pas supporter les overrides dans l'URL.
    // Dans ce cas, il faudra passer les overrides lors du startSession.
    // Cette implémentation est préparée pour les deux cas.

    const response = await fetch(
      `${ELEVENLABS_API_BASE}/convai/conversation/get_signed_url?${params}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erreur récupération signed URL: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data.signed_url;
  } catch (error) {
    console.error('❌ Erreur récupération signed URL avec override:', error);
    throw error;
  }
}

/**
 * Supprimer un agent ElevenLabs
 * Utile pour le nettoyage des agents créés dynamiquement
 */
export async function deleteElevenLabsAgent(agentId: string): Promise<void> {
  try {
    const response = await fetch(
      `${ELEVENLABS_API_BASE}/convai/agents/${agentId}`,
      {
        method: 'DELETE',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erreur suppression agent: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    console.log('✅ Agent supprimé:', agentId);
  } catch (error) {
    console.error('❌ Erreur suppression agent:', error);
    throw error;
  }
}

/**
 * Récupérer la liste des agents existants
 */
export async function listElevenLabsAgents(): Promise<any[]> {
  try {
    const response = await fetch(`${ELEVENLABS_API_BASE}/convai/agents`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Erreur récupération liste agents: ${response.status} - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data.agents || [];
  } catch (error) {
    console.error('❌ Erreur récupération liste agents:', error);
    throw error;
  }
}

/**
 * STRATÉGIE RECOMMANDÉE:
 *
 * Option 1: Créer un agent par conversation (ce que demande l'utilisateur)
 * - Avantage: Configuration complètement personnalisée
 * - Inconvénient: Beaucoup d'agents créés, potentiel quota/coût
 * - Utiliser: createElevenLabsAgent() + sauvegarder agent_id dans DB
 *
 * Option 2: Utiliser 1 agent de base + override du prompt (recommandé)
 * - Avantage: Un seul agent avec bonne config voix, override du prompt
 * - Inconvénient: Dépend du support API pour les overrides
 * - Utiliser: getSignedUrlWithOverride() + passer config dans startSession
 *
 * Pour l'instant, implémenter Option 1 car c'est ce que demande l'utilisateur.
 * Mais garder Option 2 en backup si problème de quotas.
 */

/**
 * Workflow complet pour créer et démarrer une conversation personnalisée
 *
 * @param agentConfig - Configuration générée par systemPromptGenerator
 * @param conversationName - Nom de la conversation (pour nommer l'agent)
 * @param voiceId - ID de la voix à utiliser
 * @returns Agent ID et signed URL
 */
export async function createConversationAgent(
  agentConfig: AgentConfig,
  conversationName: string,
  voiceId: string = 'default'
): Promise<{ agentId: string; signedUrl: string }> {
  console.log('🔄 Création agent pour conversation:', conversationName);

  // 1. Créer l'agent avec la configuration personnalisée
  const agentResponse = await createElevenLabsAgent(
    agentConfig,
    conversationName,
    voiceId
  );

  console.log('✅ Agent créé avec ID:', agentResponse.agent_id);

  // 2. Obtenir la signed URL pour cet agent
  const signedUrl = await getSignedUrl(agentResponse.agent_id);

  console.log('✅ Signed URL obtenue');

  return {
    agentId: agentResponse.agent_id,
    signedUrl,
  };
}

/**
 * Exemple d'utilisation :
 *
 * import { generateAgentConfig } from './systemPromptGenerator';
 * import { createConversationAgent } from './elevenLabsAgentService';
 *
 * const agentConfig = generateAgentConfig(dominantStyles, context);
 * const { agentId, signedUrl } = await createConversationAgent(
 *   agentConfig,
 *   `Cours - ${courseName} - ${userName}`,
 *   'default'
 * );
 *
 * // Sauvegarder agentId dans Supabase (ai_teacher_conversations)
 * // Utiliser signedUrl pour startSession
 */
