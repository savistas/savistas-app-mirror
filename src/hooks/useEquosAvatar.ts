import { useState, useEffect, useCallback, useRef } from 'react';
import { EquosService, DIDService, type AvatarConfig } from '@/services/equosService';
import { useToast } from '@/hooks/use-toast';

export interface UseEquosAvatarOptions {
  provider?: 'equos' | 'did'; // Choix du provider (Equos.ai ou D-ID)
  config?: AvatarConfig;
  onStreamReady?: (stream: MediaStream) => void;
  onVideoReady?: (videoUrl: string) => void;
}

/**
 * Hook pour gérer l'avatar animé (Equos.ai ou D-ID)
 * Gère le streaming vidéo synchronisé avec l'audio ElevenLabs
 */
export function useEquosAvatar(options: UseEquosAvatarOptions = {}) {
  const { toast } = useToast();
  const provider = options.provider || 'did'; // D-ID par défaut (plus accessible)

  const equosServiceRef = useRef<EquosService | null>(null);
  const didServiceRef = useRef<DIDService | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Initialiser les services
   */
  useEffect(() => {
    if (provider === 'equos' && !equosServiceRef.current) {
      equosServiceRef.current = new EquosService();

      equosServiceRef.current.onStreamReady = (stream) => {
        setVideoStream(stream);
        setIsStreaming(true);
        options.onStreamReady?.(stream);
      };

      equosServiceRef.current.onError = (err) => {
        setError(err);
        toast({
          title: 'Erreur Avatar',
          description: err.message,
          variant: 'destructive',
        });
      };

      equosServiceRef.current.onStreamEnd = () => {
        setIsStreaming(false);
        setVideoStream(null);
      };
    }

    if (provider === 'did' && !didServiceRef.current) {
      didServiceRef.current = new DIDService();

      didServiceRef.current.onVideoReady = (url) => {
        setVideoUrl(url);
        setIsGenerating(false);
        options.onVideoReady?.(url);
      };

      didServiceRef.current.onError = (err) => {
        setError(err);
        setIsGenerating(false);
        toast({
          title: 'Erreur Avatar',
          description: err.message,
          variant: 'destructive',
        });
      };
    }
  }, [provider, options, toast]);

  /**
   * Démarrer le streaming avatar (Equos.ai)
   */
  const startStream = useCallback(
    async (audioSource: MediaStream | ArrayBuffer) => {
      if (!equosServiceRef.current) {
        console.error('Service Equos non initialisé');
        return;
      }

      setError(null);

      try {
        const stream = await equosServiceRef.current.startAvatarStream({
          audioSource,
          config: options.config,
        });

        setVideoStream(stream);
        setIsStreaming(true);

        toast({
          title: 'Avatar activé',
          description: 'Votre professeur virtuel est en ligne',
        });
      } catch (err) {
        console.error('Erreur démarrage stream:', err);
        setError(err as Error);
      }
    },
    [options.config, toast]
  );

  /**
   * Mettre à jour l'audio du stream (Equos.ai)
   */
  const updateAudio = useCallback(
    async (audioData: ArrayBuffer) => {
      if (!equosServiceRef.current) {
        console.error('Service Equos non initialisé');
        return;
      }

      try {
        await equosServiceRef.current.updateAudioStream(audioData);
      } catch (err) {
        console.error('Erreur mise à jour audio:', err);
        setError(err as Error);
      }
    },
    []
  );

  /**
   * Générer une vidéo avatar (D-ID)
   */
  const generateVideo = useCallback(
    async (audioUrl: string, avatarImage?: string) => {
      if (!didServiceRef.current) {
        console.error('Service D-ID non initialisé');
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const url = await didServiceRef.current.createTalk(audioUrl, avatarImage);
        setVideoUrl(url);

        toast({
          title: 'Vidéo générée',
          description: 'Votre professeur est prêt',
        });

        return url;
      } catch (err) {
        console.error('Erreur génération vidéo:', err);
        setError(err as Error);
        throw err;
      }
    },
    [toast]
  );

  /**
   * Arrêter le streaming
   */
  const stopStream = useCallback(() => {
    if (equosServiceRef.current) {
      equosServiceRef.current.stopStream();
      setIsStreaming(false);
      setVideoStream(null);
    }
  }, []);

  /**
   * Nettoyer la vidéo (D-ID)
   */
  const clearVideo = useCallback(() => {
    setVideoUrl(null);
    setIsGenerating(false);
  }, []);

  /**
   * Nettoyer lors du démontage
   */
  useEffect(() => {
    return () => {
      stopStream();
      clearVideo();
    };
  }, [stopStream, clearVideo]);

  return {
    // État
    isStreaming,
    isGenerating,
    videoStream,
    videoUrl,
    error,
    provider,

    // Actions Equos.ai
    startStream,
    updateAudio,
    stopStream,

    // Actions D-ID
    generateVideo,
    clearVideo,
  };
}
