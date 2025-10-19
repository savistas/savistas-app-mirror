import { useState, useRef, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface UseVoiceRecordingOptions {
  onRecordingComplete?: (audioData: ArrayBuffer) => void;
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  maxDuration?: number; // en secondes
  autoStop?: boolean; // Arrêt automatique après silence
}

/**
 * Hook pour gérer l'enregistrement vocal
 * Utilise MediaRecorder API pour capturer l'audio du microphone
 */
export function useVoiceRecording(options: UseVoiceRecordingOptions = {}) {
  const { toast } = useToast();

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxDuration = options.maxDuration || 60; // 60 secondes par défaut

  /**
   * Vérifier les permissions du microphone
   */
  const checkPermissions = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Arrêter immédiatement
      setHasPermission(true);
      return true;
    } catch (err) {
      console.error('Permission microphone refusée:', err);
      setHasPermission(false);
      setError(err as Error);
      toast({
        title: 'Microphone non disponible',
        description: 'Veuillez autoriser l\'accès au microphone',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  /**
   * Démarrer l'enregistrement
   */
  const startRecording = useCallback(async () => {
    // Vérifier les permissions d'abord
    const hasPerms = await checkPermissions();
    if (!hasPerms) return;

    try {
      // Obtenir le stream audio
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Créer le MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Event handlers
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Créer le blob audio
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Convertir en ArrayBuffer
        const arrayBuffer = await audioBlob.arrayBuffer();

        // Callback
        options.onRecordingComplete?.(arrayBuffer);

        // Nettoyer
        audioChunksRef.current = [];
        setIsRecording(false);
        setDuration(0);

        // Arrêter le stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Arrêter le timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      // Démarrer l'enregistrement
      mediaRecorder.start(100); // Collecter les données toutes les 100ms
      setIsRecording(true);
      setIsPaused(false);
      setError(null);
      options.onRecordingStart?.();

      // Démarrer le compteur de durée
      const startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        // Arrêt automatique si durée max atteinte
        if (elapsed >= maxDuration) {
          stopRecording();
          toast({
            title: 'Durée maximale atteinte',
            description: `Enregistrement limité à ${maxDuration} secondes`,
          });
        }
      }, 100);

      toast({
        title: 'Enregistrement démarré',
        description: 'Parlez dans votre microphone',
      });
    } catch (err) {
      console.error('Erreur démarrage enregistrement:', err);
      setError(err as Error);
      toast({
        title: 'Erreur',
        description: 'Impossible de démarrer l\'enregistrement',
        variant: 'destructive',
      });
    }
  }, [checkPermissions, maxDuration, options, toast]);

  /**
   * Arrêter l'enregistrement
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      options.onRecordingStop?.();
    }
  }, [isRecording, options]);

  /**
   * Mettre en pause l'enregistrement
   */
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  /**
   * Reprendre l'enregistrement
   */
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);

      // Reprendre le compteur
      const startTime = Date.now() - duration * 1000;
      durationIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDuration(elapsed);

        if (elapsed >= maxDuration) {
          stopRecording();
        }
      }, 100);
    }
  }, [isRecording, isPaused, duration, maxDuration, stopRecording]);

  /**
   * Annuler l'enregistrement
   */
  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      // Vider les chunks pour ne pas déclencher le callback
      audioChunksRef.current = [];

      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);

      // Arrêter le stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      // Arrêter le timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      toast({
        title: 'Enregistrement annulé',
      });
    }
  }, [isRecording, toast]);

  /**
   * Toggle enregistrement (start/stop)
   */
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  /**
   * Nettoyer lors du démontage
   */
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [isRecording]);

  /**
   * Vérifier les permissions au montage
   */
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  return {
    // État
    isRecording,
    isPaused,
    duration,
    hasPermission,
    error,

    // Actions
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
    toggleRecording,
    checkPermissions,
  };
}
