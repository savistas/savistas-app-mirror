import { useEffect, useRef } from 'react';
import { Loader2, UserCircle2, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export interface AvatarDisplayProps {
  videoStream?: MediaStream | null;
  videoUrl?: string | null;
  isLoading?: boolean;
  isListening?: boolean;
  isSpeaking?: boolean;
  error?: Error | null;
  className?: string;
}

/**
 * Composant pour afficher l'avatar animé du professeur virtuel
 * Supporte à la fois le streaming temps réel et les vidéos pré-générées
 */
export function AvatarDisplay({
  videoStream,
  videoUrl,
  isLoading = false,
  isListening = false,
  isSpeaking = false,
  error,
  className = '',
}: AvatarDisplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  /**
   * Gérer le stream vidéo en temps réel
   */
  useEffect(() => {
    if (videoRef.current && videoStream) {
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  /**
   * Gérer l'URL vidéo (D-ID)
   */
  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.src = videoUrl;
    }
  }, [videoUrl]);

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
        {/* Erreur */}
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Erreur lors du chargement de l\'avatar'}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading */}
        {isLoading && !error && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              Préparation de votre professeur virtuel...
            </p>
          </div>
        )}

        {/* Placeholder (pas de vidéo) */}
        {!videoStream && !videoUrl && !isLoading && !error && (
          <div className="flex flex-col items-center gap-4">
            <UserCircle2 className="h-24 w-24 text-primary/50" />
            <p className="text-sm text-muted-foreground text-center px-4">
              Sélectionnez un mode de conversation pour commencer
            </p>
          </div>
        )}

        {/* Vidéo */}
        {(videoStream || videoUrl) && !error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
          />
        )}

        {/* Indicateur d'état */}
        {(isListening || isSpeaking) && !isLoading && !error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
            <div
              className={`px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm ${
                isSpeaking
                  ? 'bg-green-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}
            >
              {isSpeaking ? (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Le professeur parle...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  À l'écoute...
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
