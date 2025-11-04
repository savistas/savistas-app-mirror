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
import { Check, Loader2, CreditCard, ArrowRight, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PlanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  plan: 'premium' | 'pro';
  currentPlan: 'basic' | 'premium' | 'pro';
}

const PLAN_DETAILS = {
  premium: {
    name: 'Premium',
    price: '9,90€',
    priceId: 'price_1SNu6P37eeTawvFRvh1JGgOC', // Your Stripe price ID
    features: [
      '10 cours par mois',
      '10 exercices par mois',
      '10 fiches de révision par mois',
      '0 minutes Avatar IA incluses',
      'Achats de minutes IA disponibles',
      '10 jours max par cours',
    ],
    benefits: [
      'Accès immédiat après paiement',
      'Annulation à tout moment',
      'Facturation mensuelle',
    ],
  },
  pro: {
    name: 'Pro',
    price: '19,90€',
    priceId: 'price_1SNu6N37eeTawvFR0CRbzo7F', // Your Stripe price ID
    features: [
      '30 cours par mois',
      '30 exercices par mois',
      '30 fiches de révision par mois',
      '0 minutes Avatar IA incluses',
      'Achats de minutes IA disponibles',
      '10 jours max par cours',
      'Support prioritaire',
    ],
    benefits: [
      'Accès immédiat après paiement',
      'Annulation à tout moment',
      'Facturation mensuelle',
      'Support prioritaire',
    ],
  },
};

export function PlanDetailsDialog({ open, onClose, plan, currentPlan }: PlanDetailsDialogProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const planDetails = PLAN_DETAILS[plan];

  // Determine if this is an upgrade or downgrade
  const planOrder = { basic: 0, premium: 1, pro: 2 };
  const isUpgrade = planOrder[plan] > planOrder[currentPlan];
  const isDowngrade = planOrder[plan] < planOrder[currentPlan];

  const handleProceedToPayment = async () => {
    if (!user?.id) {
      toast.error('Vous devez être connecté pour continuer');
      return;
    }

    try {
      setIsProcessing(true);

      // Call the create-checkout-session edge function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: planDetails.priceId,
          mode: 'subscription',
          successUrl: `${window.location.origin}/profile?checkout=success&type=subscription`,
          cancelUrl: `${window.location.origin}/profile?checkout=canceled`,
        },
      });

      if (error) throw error;

      // Check if this was an upgrade/downgrade (no checkout needed)
      if (data?.upgraded && data?.success) {
        // Subscription updated successfully without checkout
        if (isDowngrade) {
          toast.success('Plan modifié!', {
            description: 'Votre plan a été changé avec succès. Un crédit pour la période non utilisée a été appliqué à votre prochaine facture.',
          });
        } else {
          toast.success('Abonnement mis à jour!', {
            description: 'Votre abonnement a été amélioré avec succès. La différence de prix a été calculée au prorata.',
          });
        }

        // Close dialog and let parent refresh
        onClose();

        // Trigger a page reload to refresh subscription data
        setTimeout(() => window.location.reload(), 1000);

      } else if (data?.checkoutUrl) {
        // New subscription - redirect to Stripe Checkout in same tab
        window.location.href = data.checkoutUrl;

      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Erreur lors de la création de la session de paiement');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="w-[90%] sm:max-w-[500px] rounded-2xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </button>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {isDowngrade ? `Passer au plan ${planDetails.name}` : `Plan ${planDetails.name}`}
            </DialogTitle>
            <DialogDescription>
              {isDowngrade
                ? `Modifier votre abonnement pour le plan ${planDetails.name}`
                : `Débloquez toutes les fonctionnalités avec le plan ${planDetails.name}`
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Price */}
            <div className={`text-center py-4 rounded-lg border ${
              plan === 'pro'
                ? 'bg-purple-50 border-purple-200'
                : 'bg-primary/5 border-primary/20'
            }`}>
              <div className={`text-4xl font-bold ${
                plan === 'pro' ? 'text-purple-600' : 'text-primary'
              }`}>
                {planDetails.price}
                <span className="text-lg font-normal text-muted-foreground">/mois</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">Facturation mensuelle</p>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                Inclus dans votre abonnement
              </h3>
              <ul className="space-y-2">
                {planDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            <div className={`rounded-lg p-4 border ${
              plan === 'pro'
                ? 'bg-purple-50 border-purple-200'
                : 'bg-blue-50 border-blue-200'
            }`}>
              <h3 className={`font-semibold mb-2 text-sm ${
                plan === 'pro' ? 'text-purple-900' : 'text-blue-900'
              }`}>Avantages</h3>
              <ul className="space-y-1">
                {planDetails.benefits.map((benefit, index) => (
                  <li key={index} className={`flex items-center gap-2 text-sm ${
                    plan === 'pro' ? 'text-purple-800' : 'text-blue-800'
                  }`}>
                    <Check className={`w-4 h-4 ${
                      plan === 'pro' ? 'text-purple-600' : 'text-blue-600'
                    }`} />
                    {benefit}
                  </li>
                ))}
              </ul>
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
              onClick={handleProceedToPayment}
              disabled={isProcessing}
              className={`w-full sm:w-auto ${
                plan === 'pro'
                  ? 'bg-purple-600 hover:bg-purple-700'
                  : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isDowngrade ? 'Modification en cours...' : 'Redirection vers Stripe...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  {isDowngrade ? 'Confirmer le changement' : currentPlan === 'basic' ? 'Procéder au paiement' : 'Confirmer l\'amélioration'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
