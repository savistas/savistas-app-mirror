import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UnsubscribeConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  currentPlan: 'basic' | 'premium' | 'pro';
}

export function UnsubscribeConfirmDialog({
  open,
  onClose,
  currentPlan,
}: UnsubscribeConfirmDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUnsubscribe = async () => {
    setIsProcessing(true);

    try {
      // Get user's subscription
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Non authentifié');
      }

      // Get subscription details
      const { data: subscription, error: subError } = await supabase
        .from('user_subscriptions')
        .select('stripe_subscription_id')
        .eq('user_id', user.id)
        .single();

      if (subError || !subscription?.stripe_subscription_id) {
        throw new Error('Aucun abonnement actif trouvé');
      }

      // Call edge function to cancel Stripe subscription
      const { error: cancelError } = await supabase.functions.invoke('cancel-subscription', {
        body: {
          subscriptionId: subscription.stripe_subscription_id,
        },
      });

      if (cancelError) {
        throw cancelError;
      }

      toast.success('Abonnement annulé', {
        description: 'Votre abonnement a été annulé. Il restera actif jusqu\'à la fin de la période de facturation actuelle.',
      });

      // Close dialog and refresh page
      onClose();
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      console.error('Error canceling subscription:', error);
      toast.error('Erreur', {
        description: error.message || 'Une erreur est survenue lors de l\'annulation',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanName = (plan: string) => {
    if (plan === 'premium') return 'Premium';
    if (plan === 'pro') return 'Pro';
    return 'Basique';
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-900">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Confirmer la résiliation
          </DialogTitle>
          <DialogDescription>
            Vous êtes sur le point d'annuler votre abonnement {getPlanName(currentPlan)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <p className="font-medium mb-2">Que se passe-t-il ensuite ?</p>
              <ul className="space-y-1 text-sm list-disc list-inside">
                <li>Votre abonnement restera actif jusqu'à la fin de la période de facturation</li>
                <li>Vous serez ensuite automatiquement rétrogradé au plan Basique</li>
                <li>Vous perdrez l'accès aux fonctionnalités premium</li>
                <li>Vos données seront conservées</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              Vous pourrez vous réabonner à tout moment et retrouver l'accès complet à toutes les fonctionnalités.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleUnsubscribe}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Résiliation en cours...
              </>
            ) : (
              'Confirmer la résiliation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
