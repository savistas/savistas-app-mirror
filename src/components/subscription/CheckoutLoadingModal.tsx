import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, X, ExternalLink, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CheckoutLoadingModalProps {
  open: boolean;
  onClose: () => void;
  sessionId?: string;
  stripeWindow?: Window | null;
}

export function CheckoutLoadingModal({
  open,
  onClose,
  sessionId,
  stripeWindow
}: CheckoutLoadingModalProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer to track elapsed time
  useEffect(() => {
    if (!open) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [open]);

  // Check if Stripe window is still open
  useEffect(() => {
    if (!open || !stripeWindow) return;

    const checkInterval = setInterval(() => {
      if (stripeWindow.closed) {
        // User closed the Stripe window
        handleCancel();
      }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [open, stripeWindow]);

  const handleCancel = async () => {
    setIsCancelling(true);

    try {
      // Close the Stripe window if it's still open
      if (stripeWindow && !stripeWindow.closed) {
        stripeWindow.close();
      }

      // Call the cancel-checkout-session edge function if we have a sessionId
      if (sessionId) {
        const { error } = await supabase.functions.invoke('cancel-checkout-session', {
          body: { sessionId },
        });

        if (error) {
          console.error('Error cancelling checkout session:', error);
          // Don't throw - we still want to close the modal
        }
      }

      toast.info('Paiement annulé', {
        description: 'Votre session de paiement a été annulée.',
      });

      onClose();
    } catch (error: any) {
      console.error('Error during cancellation:', error);
      toast.error('Erreur lors de l\'annulation');
    } finally {
      setIsCancelling(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-[450px]"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            Paiement en cours
          </DialogTitle>
          <DialogDescription>
            Veuillez finaliser votre paiement sur Stripe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Main spinner */}
          <div className="flex justify-center">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <ExternalLink className="w-6 h-6 text-primary/50" />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900">
              Instructions :
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Une fenêtre Stripe s'est ouverte dans un nouvel onglet</li>
              <li>Complétez votre paiement dans cette fenêtre</li>
              <li>Vous serez redirigé automatiquement après le paiement</li>
            </ul>
          </div>

          {/* Warning about window */}
          {stripeWindow && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                Ne fermez pas cette fenêtre tant que votre paiement n'est pas terminé
              </p>
            </div>
          )}

          {/* Elapsed time */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Temps écoulé : {formatTime(elapsedTime)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full sm:w-auto"
          >
            {isCancelling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Annulation...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Annuler le paiement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
