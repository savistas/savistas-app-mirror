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
import { Check, Loader2, CreditCard, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { saveCheckoutSession } from '@/lib/checkoutSession';
import { CheckoutLoadingModal } from './CheckoutLoadingModal';

interface PlanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  plan: 'premium' | 'pro';
}

const PLAN_DETAILS = {
  premium: {
    name: 'Premium',
    price: '9,99€',
    priceId: 'price_1SNu6P37eeTawvFRvh1JGgOC', // Your Stripe price ID
    features: [
      '10 cours par mois',
      '10 exercices par mois',
      '10 fiches de révision par mois',
      'Modèle IA avancé',
      'Stockage modéré',
      'Tokens moyens',
      'Rapidité prioritaire',
    ],
    benefits: [
      'Accès immédiat après paiement',
      'Annulation à tout moment',
      'Facturation mensuelle',
    ],
  },
  pro: {
    name: 'Pro',
    price: '19,99€',
    priceId: 'price_1SNu6N37eeTawvFR0CRbzo7F', // Your Stripe price ID
    features: [
      '30 cours par mois',
      '30 exercices par mois',
      '30 fiches de révision par mois',
      'Modèle IA professionnel',
      'Stockage illimité',
      'Tokens illimités',
      'Rapidité ultra prioritaire',
    ],
    benefits: [
      'Accès immédiat après paiement',
      'Annulation à tout moment',
      'Facturation mensuelle',
      'Support prioritaire',
    ],
  },
};

export function PlanDetailsDialog({ open, onClose, plan }: PlanDetailsDialogProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | undefined>();
  const [stripeWindowRef, setStripeWindowRef] = useState<Window | null>(null);
  const planDetails = PLAN_DETAILS[plan];

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
          successUrl: `${window.location.origin}/profile?checkout=success`,
          cancelUrl: `${window.location.origin}/profile?checkout=canceled`,
        },
      });

      if (error) throw error;

      // Check if this was an upgrade (no checkout needed)
      if (data?.upgraded && data?.success) {
        // Subscription upgraded successfully without checkout
        toast.success('Abonnement mis à jour!', {
          description: 'Votre abonnement a été changé avec succès. La différence de prix a été calculée au prorata.',
        });

        // Close dialog and let parent refresh
        onClose();

        // Trigger a page reload to refresh subscription data
        setTimeout(() => window.location.reload(), 1000);
      } else if (data?.checkoutUrl && data?.sessionId) {
        // New subscription - need checkout
        // Save checkout session to localStorage before opening Stripe
        saveCheckoutSession({
          sessionId: data.sessionId,
          priceId: planDetails.priceId,
          plan: plan,
        });

        // Store session ID for the loading modal
        setCheckoutSessionId(data.sessionId);

        // Open Stripe Checkout in new tab
        const stripeWindow = window.open(data.checkoutUrl, '_blank');

        if (!stripeWindow) {
          toast.error('Veuillez autoriser les pop-ups pour continuer vers le paiement');
          setIsProcessing(false);
          return;
        }

        // Store the window reference
        setStripeWindowRef(stripeWindow);

        // Close the plan details dialog
        onClose();

        // Show the loading modal immediately
        setShowLoadingModal(true);
        setIsProcessing(false);
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Erreur lors de la création de la session de paiement');
      setIsProcessing(false);
    }
  };

  const handleCloseLoadingModal = () => {
    setShowLoadingModal(false);
    setCheckoutSessionId(undefined);
    setStripeWindowRef(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Plan {planDetails.name}</DialogTitle>
          <DialogDescription>
            Débloquez toutes les fonctionnalités avec le plan {planDetails.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Price */}
          <div className="text-center py-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="text-4xl font-bold text-primary">
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
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-2 text-sm text-blue-900">Avantages</h3>
            <ul className="space-y-1">
              {planDetails.benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-blue-800">
                  <Check className="w-4 h-4 text-blue-600" />
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
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Redirection vers Stripe...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Procéder au paiement
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Checkout Loading Modal */}
      <CheckoutLoadingModal
        open={showLoadingModal}
        onClose={handleCloseLoadingModal}
        sessionId={checkoutSessionId}
        stripeWindow={stripeWindowRef}
      />
    </Dialog>
  );
}
