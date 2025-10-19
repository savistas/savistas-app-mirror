import { supabase } from '@/integrations/supabase/client';

export interface AgentConfig {
  system_prompt: string;
  voice_id?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface AudioMessage {
  type: 'audio' | 'text' | 'transcript';
  data?: string; // base64 for audio, text for transcript
  transcript?: string;
}

export class ElevenLabsService {
  private ws: WebSocket | null = null;
  private agentId: string | null = null;
  private isConnected: boolean = false;
  private messageQueue: AudioMessage[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;

  // Event handlers
  onAudioReceived?: (audio: ArrayBuffer, transcript: string) => void;
  onTranscriptReceived?: (transcript: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onError?: (error: Error) => void;

  /**
   * Créer un agent ElevenLabs personnalisé
   */
  async createAgent(config: AgentConfig): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'create_agent',
          payload: {
            system_prompt: config.system_prompt,
            voice_id: config.voice_id || '21m00Tcm4TlvDq8ikWAM', // Rachel voice
            temperature: config.temperature || 0.7,
            max_tokens: config.max_tokens || 500,
          },
        },
      });

      if (error) throw error;

      this.agentId = data.agent_id;
      console.log('Agent ElevenLabs créé:', this.agentId);

      return data.agent_id;
    } catch (error) {
      console.error('Erreur création agent:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Connecter au WebSocket ElevenLabs
   */
  async connectWebSocket(agentId: string): Promise<void> {
    try {
      // Obtenir token de session
      const { data, error } = await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'get_conversation_token',
          payload: { agent_id: agentId },
        },
      });

      if (error) throw error;

      const token = data.token;

      // Fermer connexion existante si présente
      if (this.ws) {
        this.ws.close();
      }

      // Connexion WebSocket
      this.ws = new WebSocket(
        `wss://api.elevenlabs.io/v1/convai/conversation?token=${token}`
      );

      this.ws.onopen = () => {
        console.log('WebSocket ElevenLabs connecté');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);

        // Envoyer les messages en file d'attente
        while (this.messageQueue.length > 0) {
          const message = this.messageQueue.shift();
          if (message) {
            this.ws?.send(JSON.stringify(message));
          }
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Erreur parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnected = false;
        this.onConnectionChange?.(false);
        this.onError?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('WebSocket fermé');
        this.isConnected = false;
        this.onConnectionChange?.(false);

        // Tentative de reconnexion
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
          setTimeout(() => this.connectWebSocket(agentId), 2000 * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('Erreur connexion WebSocket:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Envoyer audio à l'agent
   */
  sendAudio(audioData: ArrayBuffer): void {
    if (!this.ws || !this.isConnected) {
      console.warn('WebSocket non connecté, message mis en file d\'attente');
      this.messageQueue.push({
        type: 'audio',
        data: this.arrayBufferToBase64(audioData),
      });
      return;
    }

    try {
      const base64 = this.arrayBufferToBase64(audioData);
      this.ws.send(
        JSON.stringify({
          type: 'audio',
          data: base64,
        })
      );
    } catch (error) {
      console.error('Erreur envoi audio:', error);
      this.onError?.(error as Error);
    }
  }

  /**
   * Envoyer texte à l'agent (fallback)
   */
  sendText(text: string): void {
    if (!this.ws || !this.isConnected) {
      console.warn('WebSocket non connecté');
      return;
    }

    try {
      this.ws.send(
        JSON.stringify({
          type: 'text',
          data: text,
        })
      );
    } catch (error) {
      console.error('Erreur envoi texte:', error);
      this.onError?.(error as Error);
    }
  }

  /**
   * Gérer les messages reçus
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'audio':
        // Audio reçu de l'agent
        const audioData = this.base64ToArrayBuffer(message.data);
        const transcript = message.transcript || '';
        this.onAudioReceived?.(audioData, transcript);
        break;

      case 'transcript':
        // Transcription seule (intermédiaire)
        this.onTranscriptReceived?.(message.data);
        break;

      case 'error':
        console.error('Erreur ElevenLabs:', message.message);
        this.onError?.(new Error(message.message));
        break;

      default:
        console.log('Message non géré:', message);
    }
  }

  /**
   * Déconnecter le WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.onConnectionChange?.(false);
    }
  }

  /**
   * Vérifier si connecté
   */
  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Convertir ArrayBuffer en base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convertir base64 en ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// Instance singleton (optionnel)
export const elevenLabsService = new ElevenLabsService();
