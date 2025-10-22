import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AvatarContainerProps {
  sessionId?: string | null;
  iframeUrl?: string | null;
  isLoading?: boolean;
  onError?: (error: Error) => void;
}

/**
 * Composant pour afficher l'avatar Écos dans une iframe
 */
export function AvatarContainer({
  sessionId,
  iframeUrl,
  isLoading = false,
  onError
}: AvatarContainerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    // Écouter les messages de l'iframe Écos (pour debug et gestion erreurs)
    const handleMessage = (event: MessageEvent) => {
      // Sécurité : vérifier l'origine
      if (!event.origin.includes('equos.ai')) {
        return;
      }

      console.log('📨 [ECOS IFRAME] Message reçu:', event.data);

      // Gérer les événements Écos
      if (event.data.type === 'error') {
        const error = new Error(event.data.message || 'Erreur avatar Écos');
        setHasError(true);
        setErrorMessage(event.data.message);
        onError?.(error);
      }

      if (event.data.type === 'ready') {
        console.log('✅ [ECOS IFRAME] Avatar prêt');
      }

      if (event.data.type === 'speaking') {
        console.log('🗣️ [ECOS IFRAME] Avatar en train de parler');
      }

      if (event.data.type === 'listening') {
        console.log('👂 [ECOS IFRAME] Avatar en écoute');
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onError]);

  // État : Chargement
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Votre Professeur Virtuel</CardTitle>
          <CardDescription>Chargement de l'avatar...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-slate-100 dark:bg-slate-900 rounded-lg flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Préparation de votre professeur virtuel...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // État : Erreur
  if (hasError) {
    return (
      <Card className="w-full border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="text-red-700 dark:text-red-400">Erreur Avatar</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {errorMessage || 'Impossible de charger l\'avatar. Veuillez rafraîchir la page.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // État : En attente de connexion
  if (!iframeUrl || !sessionId) {
    return (
      <Card className="w-full border-dashed">
        <CardHeader>
          <CardTitle>Votre Professeur Virtuel</CardTitle>
          <CardDescription>Démarrez une conversation pour activer l'avatar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-slate-50 dark:bg-slate-900/50 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center">
                <User className="h-10 w-10 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Professeur en attente
              </p>
              <p className="text-xs text-muted-foreground">
                Cliquez sur "Démarrer la conversation" pour commencer
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // État : Actif avec iframe
  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Votre Professeur Virtuel</CardTitle>
            <CardDescription>
              Session: {sessionId.substring(0, 8)}...
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Actif
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="aspect-video bg-black relative">
          <iframe
            ref={iframeRef}
            src={iframeUrl}
            className="w-full h-full border-0"
            allow="microphone; camera; autoplay; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            title="Avatar Écos - Professeur Virtuel"
            loading="eager"
          />
        </div>
      </CardContent>
    </Card>
  );
}
