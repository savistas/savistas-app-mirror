/**
 * Composant pour afficher l'avatar Equos via LiveKit
 *
 * Equos utilise LiveKit pour la connexion WebRTC (audio/vidéo)
 * L'avatar est rendu côté serveur et streamé via LiveKit
 */

import { useEffect, useState } from 'react';
import { LiveKitRoom } from '@livekit/components-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Clock } from 'lucide-react';
import { RoomRenderer } from './RoomRenderer';
import { formatTime } from '@/hooks/useConversationTimeLimit';
import '@livekit/components-styles';

export interface EquosLiveKitContainerProps {
  serverUrl: string; // URL du serveur LiveKit
  token: string; // Consumer access token
  avatarIdentity: string; // Identité de l'avatar
  avatarName: string; // Nom de l'avatar
  maxDurationSeconds?: number; // Durée maximale de la session en secondes (pour users "basic")
  onConnected?: () => void;
  onDisconnected?: () => void;
  onError?: (error: Error) => void;
  onTimeLimit?: () => void; // Callback quand la limite de temps est atteinte
}

/**
 * Container pour l'avatar Equos avec LiveKit
 * Suit l'approche recommandée par la documentation officielle Equos
 */
export function EquosLiveKitContainer({
  serverUrl,
  token,
  avatarIdentity,
  avatarName,
  maxDurationSeconds,
  onConnected,
  onDisconnected,
  onError,
  onTimeLimit
}: EquosLiveKitContainerProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    console.log('🔗 [LIVEKIT] Initialisation...');
    console.log('🌐 [LIVEKIT] Server URL:', serverUrl);
    console.log('🎟️ [LIVEKIT] Token:', token ? 'Présent' : 'Manquant');
    if (maxDurationSeconds) {
      console.log('⏱️ [LIVEKIT] Durée maximale:', maxDurationSeconds, 'secondes');
    }
  }, [serverUrl, token, maxDurationSeconds]);

  /**
   * Gestion de la connexion
   */
  const handleConnected = () => {
    console.log('✅ [LIVEKIT] Connecté au serveur');
    setIsConnecting(false);
    setIsConnected(true);
    setConnectionError(null);
    onConnected?.();
  };

  /**
   * Gestion de la déconnexion
   */
  const handleDisconnected = () => {
    console.log('❌ [LIVEKIT] Déconnecté');
    setIsConnected(false);
    onDisconnected?.();
  };

  /**
   * Gestion des erreurs
   */
  const handleError = (error: Error) => {
    console.error('❌ [LIVEKIT] Erreur:', error);
    setIsConnecting(false);
    setConnectionError(error.message);
    onError?.(error);
  };

  /**
   * Timer pour limiter la durée de la conversation (users "basic")
   * Se déclenche uniquement si maxDurationSeconds est défini
   */
  useEffect(() => {
    if (!isConnected || !maxDurationSeconds) {
      return;
    }

    console.log('⏱️ [LIVEKIT] Timer de limitation démarré');

    // Compteur de secondes écoulées
    const intervalId = setInterval(() => {
      setElapsedSeconds((prev) => {
        const newElapsed = prev + 1;

        // Log tous les 10 secondes
        if (newElapsed % 10 === 0) {
          console.log(`⏱️ [LIVEKIT] Temps écoulé: ${newElapsed}s / ${maxDurationSeconds}s`);
        }

        // Si la limite est atteinte, déclencher la coupure
        if (newElapsed >= maxDurationSeconds) {
          console.warn('⏱️ [LIVEKIT] LIMITE DE TEMPS ATTEINTE - Déconnexion automatique');
          clearInterval(intervalId);

          // Notifier le parent
          onTimeLimit?.();

          // Forcer la déconnexion
          setTimeout(() => {
            handleDisconnected();
          }, 100);
        }

        return newElapsed;
      });
    }, 1000);

    // Cleanup : arrêter le timer si déconnecté
    return () => {
      console.log('⏱️ [LIVEKIT] Timer arrêté');
      clearInterval(intervalId);
    };
  }, [isConnected, maxDurationSeconds, onTimeLimit]);

  /**
   * État : Erreur de connexion
   */
  if (connectionError) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            ❌ Erreur de connexion
          </CardTitle>
          <CardDescription>
            Impossible de se connecter au professeur virtuel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[500px] bg-muted rounded-lg">
            <div className="text-center space-y-3 max-w-md p-6">
              <p className="text-sm text-destructive font-medium">
                {connectionError}
              </p>
              <p className="text-xs text-muted-foreground">
                Vérifiez votre connexion internet et votre configuration Equos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * LiveKit Room avec avatar
   */
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🎭 Professeur Virtuel Equos</CardTitle>
            <CardDescription>
              Avatar personnalisé avec IA vocale
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Timer de temps restant (pour users "basic" uniquement) */}
            {isConnected && maxDurationSeconds && (
              <Badge
                variant="outline"
                className={`gap-2 ${
                  (maxDurationSeconds - elapsedSeconds) <= 10
                    ? 'border-red-500 bg-red-50 text-red-700 animate-pulse'
                    : (maxDurationSeconds - elapsedSeconds) <= 30
                    ? 'border-orange-500 bg-orange-50 text-orange-700'
                    : 'border-blue-500 bg-blue-50 text-blue-700'
                }`}
              >
                <Clock className="h-3 w-3" />
                {formatTime(Math.max(0, maxDurationSeconds - elapsedSeconds))}
              </Badge>
            )}

            {/* Badge de statut */}
            <Badge
              variant={
                isConnected ? 'default' :
                isConnecting ? 'secondary' :
                'outline'
              }
              className="gap-2"
            >
              {isConnecting && (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Connexion...
                </>
              )}
              {isConnected && (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Connecté
                </>
              )}
              {!isConnecting && !isConnected && '❌ Déconnecté'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex justify-center items-center p-4 md:p-6">
        {/* Container LiveKit - Format carré adaptatif comme Equos */}
        <div className="relative w-full max-w-[512px] aspect-square bg-black rounded-xl overflow-hidden shadow-2xl">
          <LiveKitRoom
            serverUrl={serverUrl}
            token={token}
            connect={true}
            video={false} // Pas besoin de la vidéo du participant local
            audio={true} // Microphone pour parler avec l'avatar
            onConnected={handleConnected}
            onDisconnected={handleDisconnected}
            onError={handleError}
            className="h-full w-full"
          >
            {/* Utilise le RoomRenderer officiel Equos */}
            <RoomRenderer
              onStop={async () => {
                handleDisconnected();
              }}
              avatarIdentity={avatarIdentity}
              avatarName={avatarName}
            />
          </LiveKitRoom>

          {/* Overlay de connexion */}
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-10">
              <div className="text-center space-y-4">
                <Loader2 className="h-16 w-16 animate-spin mx-auto text-white" />
                <div>
                  <p className="text-white font-medium">
                    Connexion au professeur virtuel...
                  </p>
                  <p className="text-white/70 text-sm mt-2">
                    Chargement de l'avatar et initialisation de l'IA
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
