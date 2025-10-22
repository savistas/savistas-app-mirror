/**
 * Service pour gérer les appels API Equos (Avatar IA)
 * Equos (equos.ai) fournit des avatars visuels avec voix IA
 *
 * SÉCURITÉ: Les appels à l'API Equos sont faits via Edge Functions Supabase
 * pour protéger la clé secrète. La clé n'est JAMAIS exposée côté client.
 *
 * Documentation: https://api.equos.ai/docs
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Provider options pour Equos
 */
export type EquosProvider = 'openai' | 'gemini' | 'elevenlabs';

/**
 * Configuration OpenAI pour Equos
 */
export interface OpenaiAgentConfig {
  instructions: string; // System prompt (max 10000 chars)
  model: 'gpt-4o-realtime-preview' | 'gpt-realtime';
  voice: 'alloy' | 'marin' | 'cedar' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse';
}

/**
 * Agent Equos
 */
export interface EquosAgent {
  id: string;
  organizationId: string;
  name?: string;
  provider: EquosProvider;
  client?: string;
  config: OpenaiAgentConfig;
  createdAt: string;
  updatedAt: string;
}

/**
 * Session Equos (pour l'avatar)
 * Basé sur LiveKit pour WebRTC
 */
export interface EquosSession {
  id: string;
  organizationId: string;
  name: string;
  status: string;
  host: {
    serverUrl: string; // URL du serveur LiveKit
  };
  avatarId: string;
  avatar: {
    id: string;
    name: string;
    thumbnailUrl?: string;
  };
  agentId?: string;
  agent?: EquosAgent;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Réponse de création de session
 */
export interface CreateSessionResponse {
  session: EquosSession;
  consumerAccessToken: string; // Token pour se connecter à LiveKit
  remoteAgentAccessToken?: string;
}

/**
 * Créer un agent Equos avec OpenAI GPT-4o Realtime
 *
 * SÉCURITÉ: Appelle une Edge Function Supabase qui protège la clé secrète
 *
 * @param instructions - System prompt personnalisé (instructions pour l'IA)
 * @param studentName - Nom de l'étudiant (pour identifier l'agent)
 * @returns Agent Equos créé
 */
export async function createEquosAgent(
  instructions: string,
  studentName: string
): Promise<EquosAgent> {
  console.log('🎭 [EQUOS] Création agent pour:', studentName);
  console.log('📏 [EQUOS] Longueur instructions:', instructions.length, 'caractères');

  // Appeler l'Edge Function Supabase (sécurisée)
  const { data, error } = await supabase.functions.invoke('create-equos-agent', {
    body: {
      instructions,
      studentName
    }
  });

  if (error) {
    console.error('❌ [EQUOS] Erreur Edge Function:', error);
    console.error('❌ [EQUOS] Détails:', JSON.stringify(error, null, 2));
    throw new Error(`Erreur Edge Function: ${error.message}`);
  }

  if (!data) {
    throw new Error('Aucune donnée retournée par l\'Edge Function');
  }

  // Si data contient une erreur (Edge Function a retourné 200 avec erreur)
  if (data.error) {
    console.error('❌ [EQUOS] Erreur API:', data.error);
    console.error('❌ [EQUOS] Détails:', data.details || data.message);
    throw new Error(`Erreur Equos API: ${data.error} - ${data.details?.message || data.message || 'Erreur inconnue'}`);
  }

  console.log('✅ [EQUOS] Agent créé:', data.id);
  console.log('📋 [EQUOS] Organization:', data.organizationId);

  return data as EquosAgent;
}

/**
 * Créer une session Equos (démarre l'avatar + conversation)
 *
 * SÉCURITÉ: Appelle une Edge Function Supabase qui protège la clé secrète
 *
 * @param agentId - ID de l'agent Equos (ou création à la volée)
 * @param avatarId - ID de l'avatar visuel (ou création à la volée)
 * @param studentName - Nom de l'étudiant (pour la session)
 * @param consumerIdentity - Identité du consommateur (utilisateur final)
 * @param maxDuration - Durée maximale de la session en secondes (optionnel, pour limiter les users gratuits)
 * @returns Réponse avec session + consumerAccessToken pour LiveKit
 */
export async function createEquosSession(
  agentId: string,
  avatarId: string,
  studentName: string,
  consumerIdentity?: { identity: string; name: string },
  maxDuration?: number
): Promise<CreateSessionResponse> {
  console.log('🎬 [EQUOS] Création session...');
  console.log('🎭 [EQUOS] Agent ID:', agentId);
  console.log('🎨 [EQUOS] Avatar ID:', avatarId);
  console.log('👤 [EQUOS] Student:', studentName);
  if (maxDuration) {
    console.log('⏱️ [EQUOS] Max Duration:', maxDuration, 'secondes');
  }

  // Appeler l'Edge Function Supabase (sécurisée)
  const { data, error } = await supabase.functions.invoke('create-equos-session', {
    body: {
      agentId,
      avatarId,
      studentName,
      consumerIdentity,
      maxDuration
    }
  });

  if (error) {
    console.error('❌ [EQUOS] Erreur Edge Function:', error);
    console.error('❌ [EQUOS] Détails:', JSON.stringify(error, null, 2));
    throw new Error(`Erreur Edge Function: ${error.message}`);
  }

  if (!data) {
    throw new Error('Aucune donnée retournée par l\'Edge Function');
  }

  // Si data contient une erreur (Edge Function a retourné 200 avec erreur)
  if (data.error) {
    console.error('❌ [EQUOS] Erreur API:', data.error);
    console.error('❌ [EQUOS] Détails:', data.details || data.message);
    throw new Error(`Erreur Equos API: ${data.error} - ${data.details?.message || data.message || 'Erreur inconnue'}`);
  }

  console.log('✅ [EQUOS] Session créée:', data.session.id);
  console.log('🔗 [EQUOS] LiveKit server:', data.session.host.serverUrl);
  console.log('🎟️ [EQUOS] Consumer token:', data.consumerAccessToken ? 'Présent' : 'Manquant');

  return data as CreateSessionResponse;
}

/**
 * Terminer une session Equos
 *
 * NOTE: Actuellement non implémenté via Edge Function
 * Les sessions se terminent automatiquement quand l'utilisateur quitte
 *
 * @param sessionId - ID de la session à terminer
 */
export async function endEquosSession(sessionId: string): Promise<void> {
  console.log('⏹️ [EQUOS] Fin de session:', sessionId);
  console.log('ℹ️ [EQUOS] La session se termine automatiquement côté Equos');

  // TODO: Créer une Edge Function pour terminer les sessions si nécessaire
}

/**
 * Récupérer l'avatar ID par défaut depuis .env
 *
 * @returns Avatar ID configuré (optionnel)
 */
export function getDefaultAvatarId(): string | undefined {
  const avatarId = import.meta.env.VITE_ECOS_DEFAULT_AVATAR_ID;

  if (!avatarId) {
    console.warn('⚠️ [EQUOS] VITE_ECOS_DEFAULT_AVATAR_ID non configuré - Avatar par défaut sera utilisé');
    return undefined;
  }

  return avatarId;
}
