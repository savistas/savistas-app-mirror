import { supabase } from '@/integrations/supabase/client';

export interface AvatarConfig {
  avatar_id?: string;
  quality?: 'low' | 'medium' | 'high';
  avatar_style?: 'professional' | 'casual' | 'friendly';
}

export interface EquosStreamOptions {
  audioSource: MediaStream | ArrayBuffer;
  config?: AvatarConfig;
}

/**
 * Service pour intégrer Equos.ai (ou alternative comme D-ID)
 * Ce service gère l'animation d'avatar synchronisée avec l'audio ElevenLabs
 */
export class EquosService {
  private videoElement: HTMLVideoElement | null = null;
  private mediaStream: MediaStream | null = null;
  private isStreaming = false;

  // Event handlers
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
  onStreamEnd?: () => void;

  /**
   * Initialiser le streaming vidéo avec audio
   */
  async startAvatarStream(options: EquosStreamOptions): Promise<MediaStream> {
    try {
      // Appeler l'Edge Function pour créer le stream avatar
      const { data, error } = await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'create_avatar_stream',
          payload: {
            avatar_id: options.config?.avatar_id || 'default_teacher',
            quality: options.config?.quality || 'medium',
            avatar_style: options.config?.avatar_style || 'professional',
          },
        },
      });

      if (error) throw error;

      // Récupérer l'URL du stream vidéo
      const streamUrl = data.stream_url;

      // Créer un MediaStream à partir de l'URL
      // Note: Ceci est une implémentation simplifiée
      // En production, utiliser WebRTC ou le SDK fourni par Equos.ai/D-ID
      const response = await fetch(streamUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Créer un élément vidéo temporaire pour extraire le stream
      const video = document.createElement('video');
      video.src = url;
      video.autoplay = true;
      video.muted = false;

      await video.play();

      // @ts-ignore - captureStream existe mais pas dans tous les types
      this.mediaStream = video.captureStream ? video.captureStream() : null;

      if (!this.mediaStream) {
        throw new Error('Impossible de capturer le stream vidéo');
      }

      this.isStreaming = true;
      this.videoElement = video;
      this.onStreamReady?.(this.mediaStream);

      return this.mediaStream;
    } catch (error) {
      console.error('Erreur démarrage avatar stream:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Mettre à jour l'audio du stream (pour D-ID)
   * D-ID permet de fournir un nouvel audio pour animer l'avatar
   */
  async updateAudioStream(audioData: ArrayBuffer): Promise<void> {
    try {
      // Convertir ArrayBuffer en Blob
      const audioBlob = new Blob([audioData], { type: 'audio/wav' });

      // Envoyer à l'Edge Function pour mise à jour
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const { data, error } = await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'update_avatar_audio',
          payload: {
            audio_data: await this.blobToBase64(audioBlob),
          },
        },
      });

      if (error) throw error;

      console.log('Audio avatar mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour audio avatar:', error);
      this.onError?.(error as Error);
    }
  }

  /**
   * Arrêter le streaming
   */
  stopStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
      this.videoElement = null;
    }

    this.isStreaming = false;
    this.onStreamEnd?.();
  }

  /**
   * Vérifier si le streaming est actif
   */
  get streaming(): boolean {
    return this.isStreaming;
  }

  /**
   * Obtenir le stream vidéo actuel
   */
  get stream(): MediaStream | null {
    return this.mediaStream;
  }

  /**
   * Convertir Blob en base64
   */
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Enlever le préfixe data:audio/wav;base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * Alternative: Service D-ID (plus accessible que Equos.ai)
 * D-ID est une alternative populaire pour créer des avatars parlants
 */
export class DIDService {
  private talkId: string | null = null;

  onVideoReady?: (videoUrl: string) => void;
  onError?: (error: Error) => void;

  /**
   * Créer une vidéo avatar avec D-ID
   */
  async createTalk(audioUrl: string, avatarImage?: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'did_create_talk',
          payload: {
            source_url: avatarImage || 'https://d-id-public-bucket.s3.amazonaws.com/alice.jpg',
            audio_url: audioUrl,
          },
        },
      });

      if (error) throw error;

      this.talkId = data.id;

      // Attendre que la vidéo soit prête
      const videoUrl = await this.waitForVideo(data.id);
      this.onVideoReady?.(videoUrl);

      return videoUrl;
    } catch (error) {
      console.error('Erreur création talk D-ID:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Attendre que la vidéo soit générée
   */
  private async waitForVideo(talkId: string, maxAttempts = 30): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2s

      const { data, error } = await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'did_get_talk',
          payload: { talk_id: talkId },
        },
      });

      if (error) throw error;

      if (data.status === 'done') {
        return data.result_url;
      }

      if (data.status === 'error') {
        throw new Error('D-ID video generation failed');
      }

      // Status: 'created' | 'processing' -> continuer à attendre
    }

    throw new Error('Timeout: Video generation took too long');
  }

  /**
   * Supprimer une vidéo
   */
  async deleteTalk(talkId: string): Promise<void> {
    try {
      await supabase.functions.invoke('virtual-teacher-proxy', {
        body: {
          action: 'did_delete_talk',
          payload: { talk_id: talkId },
        },
      });
    } catch (error) {
      console.error('Erreur suppression talk:', error);
    }
  }
}

// Instance singleton
export const equosService = new EquosService();
export const didService = new DIDService();
