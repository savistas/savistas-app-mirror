/**
 * Types pour le système de professeur virtuel avec avatar Écos
 */

export interface ElevenLabsAgent {
  agent_id: string;
}

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

export interface VirtualTeacherSession {
  conversationId: string;
  elevenLabsAgent: ElevenLabsAgent;
  ecosAgent: EcosAgent;
  ecosSession: EcosSession;
}

/**
 * Types pour le nouveau système de conversation contextualisée
 */

export type ConversationType = 'general' | 'course' | 'exercise' | 'error';

export interface Course {
  id: string;
  title: string;
  course_content: string;
  subject?: string;
}

export interface Exercise {
  id: string;
  exercice_title: string;
  metadata: Record<string, unknown>;
  course_id: string;
}

export interface ErrorResponse {
  id: string;
  matiere: string;
  categorie: string;
  message: string;
  justification?: string;
  course_id: string;
  exercice_id: string;
  created_at: string;
}
