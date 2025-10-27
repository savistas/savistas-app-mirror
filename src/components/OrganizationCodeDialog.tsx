import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useOrganizationCode } from '@/hooks/useOrganizationCode';

interface OrganizationCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (organizationId: string, organizationName: string, code: string) => void;
  onSkip: () => void;
}

export function OrganizationCodeDialog({
  open,
  onOpenChange,
  onSuccess,
  onSkip,
}: OrganizationCodeDialogProps) {
  const [code, setCode] = useState('');
  const [validatedOrg, setValidatedOrg] = useState<{
    organizationId: string;
    organizationName: string;
  } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { validateCode, isValidating, error, clearError } = useOrganizationCode();

  // Vérification automatique lors de la saisie du code
  const handleAutoCheck = async () => {
    const result = await validateCode(code);
    if (result) {
      setValidatedOrg(result);
    }
  };

  // Validation finale quand l'utilisateur clique sur "Valider"
  const handleValidate = async () => {
    if (validatedOrg) {
      setShowSuccess(true);

      // Animation de succès puis callback
      setTimeout(() => {
        onSuccess(validatedOrg.organizationId, validatedOrg.organizationName, code);
        handleClose();
      }, 1500);
    }
  };

  // Vérification automatique lors de la saisie du code
  useEffect(() => {
    // Annuler le timer précédent
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Ne rien faire si le code est vide ou trop court
    if (!code || code.length < 2) {
      setValidatedOrg(null);
      clearError();
      return;
    }

    // Attendre 500ms après la dernière frappe avant de vérifier
    debounceTimerRef.current = setTimeout(() => {
      handleAutoCheck();
    }, 500);

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [code]);

  const handleClose = () => {
    setCode('');
    setValidatedOrg(null);
    setShowSuccess(false);
    clearError();
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleClose();
    onSkip();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && code.trim() && !isValidating && !showSuccess) {
      handleValidate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90%] sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Faites-vous partie d'une organisation ?
          </DialogTitle>
          <DialogDescription>
            (école, entreprise, etc.)
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-green-900">
                Code validé !
              </p>
              <p className="text-sm text-green-700 mt-1">
                Vous allez rejoindre : <strong>{validatedOrg?.organizationName}</strong>
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="organization-code">
                  Code d'organisation
                </Label>
                <Input
                  id="organization-code"
                  placeholder="Entrez le code fourni par votre organisation"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setValidatedOrg(null); // Réinitialiser la validation
                    clearError();
                  }}
                  onKeyPress={handleKeyPress}
                  disabled={isValidating}
                  className={
                    validatedOrg
                      ? 'border-green-500 focus-visible:ring-green-500'
                      : error
                      ? 'border-red-500 focus-visible:ring-red-500'
                      : ''
                  }
                  autoFocus
                />
              </div>

              {/* Message de confirmation sous l'input quand le code est valide */}
              {validatedOrg && !showSuccess && (
                <p className="text-sm text-green-700 mt-2">
                  Vous allez rejoindre : <strong>{validatedOrg.organizationName}</strong>
                </p>
              )}

              {/* Affichage des erreurs */}
              {error && !isValidating && (
                <Alert variant="destructive" className="py-2 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Entrez le code fourni par votre organisation
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isValidating}
                className="w-full sm:w-auto"
              >
                Passer
              </Button>
              <Button
                type="button"
                onClick={handleValidate}
                disabled={!validatedOrg || isValidating}
                className="w-full sm:w-auto"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  'Valider'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
