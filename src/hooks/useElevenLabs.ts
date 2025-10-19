import { useState, useEffect, useCallback, useRef } from 'react';
import { ElevenLabsService, type AgentConfig } from '@/services/elevenLabsService';
import { useToast } from '@/hooks/use-toast';

export interface UseElevenLabsOptions {
  onAudioReceived?: (audio: ArrayBuffer, transcript: string) => void;
  onTranscriptReceived?: (transcript: string) => void;
  autoConnect?: boolean;
}

/**
 * Hook pour gérer la connexion avec ElevenLabs
 * Gère la création d'agents, la connexion WebSocket, et l'envoi/réception d'audio
 */
export function useElevenLabs(options: UseElevenLabsOptions = {}) {
  const { toast } = useToast();
  const serviceRef = useRef<ElevenLabsService | null>(null);

  const [isConnected, setIsConnected] = useState(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');

  /**
   * Initialiser le service
   */
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new ElevenLabsService();

      // Configurer les event handlers
      serviceRef.current.onAudioReceived = (audio, transcript) => {
        options.onAudioReceived?.(audio, transcript);
        setCurrentTranscript(transcript);
      };

      serviceRef.current.onTranscriptReceived = (transcript) => {
        options.onTranscriptReceived?.(transcript);
        setCurrentTranscript(transcript);
      };

      serviceRef.current.onConnectionChange = (connected) => {
        setIsConnected(connected);
      };

      serviceRef.current.onError = (err) => {
        setError(err);
        toast({
          title: 'Erreur ElevenLabs',
          description: err.message,
          variant: 'destructive',
        });
      };
    }
  }, [options, toast]);

  /**
   * Créer un nouvel agent
   */
  const createAgent = useCallback(
    async (config: AgentConfig): Promise<string> => {
      if (!serviceRef.current) {
        throw new Error('Service non initialisé');
      }

      setIsCreatingAgent(true);
      setError(null);

      try {
        const id = await serviceRef.current.createAgent(config);
        setAgentId(id);

        toast({
          title: 'Agent créé',
          description: 'Votre professeur virtuel est configuré',
        });

        return id;
      } catch (err) {
        console.error('Erreur création agent:', err);
        setError(err as Error);
        throw err;
      } finally {
        setIsCreatingAgent(false);
      }
    },
    [toast]
  );

  /**
   * Se connecter au WebSocket
   */
  const connect = useCallback(
    async (agentIdToConnect: string) => {
      if (!serviceRef.current) {
        throw new Error('Service non initialisé');
      }

      setError(null);

      try {
        await serviceRef.current.connectWebSocket(agentIdToConnect);
        setAgentId(agentIdToConnect);
        setIsConnected(true);
      } catch (err) {
        console.error('Erreur connexion WebSocket:', err);
        setError(err as Error);
        throw err;
      }
    },
    []
  );

  /**
   * Créer un agent et se connecter automatiquement
   */
  const createAndConnect = useCallback(
    async (config: AgentConfig): Promise<string> => {
      const id = await createAgent(config);
      await connect(id);
      return id;
    },
    [createAgent, connect]
  );

  /**
   * Envoyer de l'audio
   */
  const sendAudio = useCallback(
    (audioData: ArrayBuffer) => {
      if (!serviceRef.current) {
        console.error('Service non initialisé');
        return;
      }

      if (!isConnected) {
        console.warn('WebSocket non connecté');
        toast({
          title: 'Attention',
          description: 'Connexion en cours, veuillez patienter',
          variant: 'default',
        });
        return;
      }

      try {
        serviceRef.current.sendAudio(audioData);
      } catch (err) {
        console.error('Erreur envoi audio:', err);
        setError(err as Error);
      }
    },
    [isConnected, toast]
  );

  /**
   * Envoyer du texte (fallback)
   */
  const sendText = useCallback(
    (text: string) => {
      if (!serviceRef.current) {
        console.error('Service non initialisé');
        return;
      }

      if (!isConnected) {
        console.warn('WebSocket non connecté');
        return;
      }

      try {
        serviceRef.current.sendText(text);
      } catch (err) {
        console.error('Erreur envoi texte:', err);
        setError(err as Error);
      }
    },
    [isConnected]
  );

  /**
   * Se déconnecter
   */
  const disconnect = useCallback(() => {
    if (serviceRef.current) {
      serviceRef.current.disconnect();
      setIsConnected(false);
      setAgentId(null);
    }
  }, []);

  /**
   * Reconnecter
   */
  const reconnect = useCallback(async () => {
    if (!agentId) {
      console.error('Pas d\'agent ID pour reconnecter');
      return;
    }

    await connect(agentId);
  }, [agentId, connect]);

  /**
   * Nettoyer lors du démontage
   */
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    // État
    isConnected,
    isCreatingAgent,
    agentId,
    error,
    currentTranscript,

    // Actions
    createAgent,
    connect,
    createAndConnect,
    sendAudio,
    sendText,
    disconnect,
    reconnect,
  };
}
