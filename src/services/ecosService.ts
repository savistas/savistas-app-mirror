/**
 * Service pour gérer les appels API Écos (Avatar IA)
 * Écos (equos.ai) fournit des avatars visuels synchronisés avec ElevenLabs
 */

const ECOS_API_BASE = 'https://api.equos.ai/v1';
const ECOS_API_KEY = import.meta.env.VITE_ECOS_API_KEY;

export interface EcosAgent {
  id: string;
  name: string;
  config: {
    eleven_labs_agent_id: string;
    provider: 'elevenlabs';
    auto_connect?: boolean;
  };
}

export interface EcosSession {
  session_id: string;
  agent_id: string;
  avatar_id: string;
  status: 'initializing' | 'active' | 'ended' | 'error';
  iframe_url?: string;
}

/**
 * Créer un agent Écos lié à un agent ElevenLabs
 *
 * @param elevenLabsAgentId - ID de l'agent ElevenLabs créé dynamiquement
 * @param studentName - Nom de l'étudiant (pour identification)
 * @returns Agent Écos créé
 */
export async function createEcosAgent(
  elevenLabsAgentId: string,
  studentName: string
): Promise<EcosAgent> {
  console.log('🎭 [ECOS] Création agent lié à ElevenLabs:', elevenLabsAgentId);

  if (!ECOS_API_KEY) {
    throw new Error('VITE_ECOS_API_KEY non configurée dans .env');
  }

  const response = await fetch(`${ECOS_API_BASE}/agents`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ECOS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `Professeur Virtuel - ${studentName}`,
      config: {
        eleven_labs_agent_id: elevenLabsAgentId, // ← LIAISON CRITIQUE
        provider: 'elevenlabs',
        auto_connect: true
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ [ECOS] Erreur création agent:', errorData);
    throw new Error(`Écos API error: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ [ECOS] Agent créé:', data.id);

  return data;
}

/**
 * Créer une session Écos (démarre l'avatar)
 *
 * @param ecosAgentId - ID de l'agent Écos
 * @param avatarId - ID de l'avatar visuel
 * @returns Session avec iframe_url
 */
export async function createEcosSession(
  ecosAgentId: string,
  avatarId: string
): Promise<EcosSession> {
  console.log('🎬 [ECOS] Création session avec avatar:', avatarId);

  if (!ECOS_API_KEY) {
    throw new Error('VITE_ECOS_API_KEY non configurée dans .env');
  }

  const response = await fetch(`${ECOS_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ECOS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      agent_id: ecosAgentId,
      avatar_id: avatarId
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('❌ [ECOS] Erreur création session:', errorData);
    throw new Error(`Failed to create Écos session: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ [ECOS] Session créée:', data.session_id);
  console.log('🔗 [ECOS] Iframe URL:', data.iframe_url);

  return data;
}

/**
 * Terminer une session Écos
 *
 * @param sessionId - ID de la session à terminer
 */
export async function endEcosSession(sessionId: string): Promise<void> {
  console.log('⏹️ [ECOS] Fin de session:', sessionId);

  if (!ECOS_API_KEY) {
    console.warn('⚠️ [ECOS] Impossible de terminer session - API key manquante');
    return;
  }

  const response = await fetch(`${ECOS_API_BASE}/sessions/${sessionId}/end`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ECOS_API_KEY}`
    }
  });

  if (!response.ok) {
    console.error('❌ [ECOS] Erreur fin de session:', response.statusText);
    // Ne pas throw pour éviter de bloquer la fermeture
  } else {
    console.log('✅ [ECOS] Session terminée');
  }
}

/**
 * Récupérer l'avatar ID par défaut depuis .env
 *
 * @returns Avatar ID configuré
 */
export function getDefaultAvatarId(): string {
  const avatarId = import.meta.env.VITE_ECOS_DEFAULT_AVATAR_ID;

  if (!avatarId) {
    throw new Error('VITE_ECOS_DEFAULT_AVATAR_ID non configuré dans .env.local');
  }

  return avatarId;
}
