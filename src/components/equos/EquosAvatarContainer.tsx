/**
 * Composant pour afficher l'avatar Equos dans un iframe
 *
 * L'avatar Equos est fourni via une URL iframe qui contient :
 * - L'avatar visuel 3D
 * - La synchronisation labiale
 * - La connexion WebRTC pour l'audio/vidéo
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export interface EquosAvatarContainerProps {
  sessionId?: string;
  iframeUrl?: string;
  isLoading?: boolean;
  onError?: (error: Error) => void;
  onReady?: () => void;
}

/**
 * Container pour l'avatar Equos
 *
 * États possibles :
 * 1. Loading - Création de la session en cours
 * 2. Waiting - Session créée, en attente de l'iframe
 * 3. Active - Avatar chargé et prêt
 * 4. Error - Erreur lors du chargement
 */
export function EquosAvatarContainer({
  sessionId,
  iframeUrl,
  isLoading = false,
  onError,
  onReady
}: EquosAvatarContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [avatarStatus, setAvatarStatus] = useState<'loading' | 'ready' | 'speaking' | 'listening'>('loading');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  /**
   * Gérer les messages postMessage de l'iframe Equos
   */
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Sécurité : vérifier l'origine
      if (!event.origin.includes('equos.ai')) {
        return;
      }

      console.log('📬 [EQUOS AVATAR] Message reçu:', event.data);

      // Gérer les différents types de messages
      if (event.data.type === 'ready') {
        console.log('✅ [EQUOS AVATAR] Avatar prêt');
        setAvatarStatus('ready');
        onReady?.();
      }

      if (event.data.type === 'speaking') {
        console.log('🗣️ [EQUOS AVATAR] Avatar parle');
        setAvatarStatus('speaking');
      }

      if (event.data.type === 'listening') {
        console.log('👂 [EQUOS AVATAR] Avatar écoute');
        setAvatarStatus('listening');
      }

      if (event.data.type === 'error') {
        console.error('❌ [EQUOS AVATAR] Erreur:', event.data.message);
        const error = new Error(event.data.message || 'Erreur avatar Equos');
        setHasError(true);
        setErrorMessage(event.data.message || 'Erreur inconnue');
        onError?.(error);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onError, onReady]);

  /**
   * État : Chargement de la session
   */
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Création du professeur virtuel...
          </CardTitle>
          <CardDescription>
            Initialisation de l'avatar et de la session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg">
            <div className="text-center space-y-3">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Préparation de votre professeur virtuel personnalisé...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * État : Erreur
   */
  if (hasError) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">
            ❌ Erreur de chargement
          </CardTitle>
          <CardDescription>
            L'avatar n'a pas pu être chargé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg">
            <div className="text-center space-y-3 max-w-md">
              <p className="text-sm text-destructive font-medium">
                {errorMessage}
              </p>
              <p className="text-xs text-muted-foreground">
                Vérifiez votre configuration Equos et réessayez.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * État : En attente de l'iframe URL
   */
  if (!iframeUrl) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>🎭 Professeur Virtuel</CardTitle>
          <CardDescription>
            En attente de la session...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[400px] bg-muted rounded-lg">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Démarrez une conversation pour voir votre professeur
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * État : Avatar actif
   */
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>🎭 Professeur Virtuel</CardTitle>
            <CardDescription>
              Avatar personnalisé avec voix IA
            </CardDescription>
          </div>

          {/* Badge de statut */}
          <Badge
            variant={
              avatarStatus === 'speaking' ? 'default' :
              avatarStatus === 'listening' ? 'secondary' :
              'outline'
            }
            className="gap-2"
          >
            {avatarStatus === 'loading' && (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Chargement...
              </>
            )}
            {avatarStatus === 'ready' && '✅ Prêt'}
            {avatarStatus === 'speaking' && (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Parle
              </>
            )}
            {avatarStatus === 'listening' && '👂 Écoute'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Iframe de l'avatar Equos */}
        <div className="relative w-full min-h-[500px] bg-black rounded-lg overflow-hidden">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full min-h-[500px]"
            allow="microphone; camera; autoplay"
            sandbox="allow-same-origin allow-scripts allow-forms"
            title="Equos Avatar"
          />

          {/* Overlay pour indiquer le chargement initial */}
          {avatarStatus === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-center space-y-3">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-white" />
                <p className="text-sm text-white">
                  Chargement de l'avatar...
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Informations de session */}
        {sessionId && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              Session ID: <code className="text-xs">{sessionId}</code>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
