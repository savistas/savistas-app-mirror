import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Bot, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckoutLoadingModal } from "./CheckoutLoadingModal";
import { saveCheckoutSession } from "@/lib/checkoutSession";


interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  currentPlan: 'basic' | 'premium' | 'pro';
}

const PRICE_IDS = {
  premium: 'price_1SNu6P37eeTawvFRvh1JGgOC',
  pro: 'price_1SNu6N37eeTawvFR0CRbzo7F',
  ai_10min: 'price_1SNu6D37eeTawvFRAVwbpsol',
  ai_30min: 'price_1SNu6B37eeTawvFRjJ20hc7w',
  ai_60min: 'price_1SNu5g37eeTawvFRdsQ1vIYp',
};

export const UpgradeDialog = ({ open, onClose, currentPlan }: UpgradeDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [checkoutSessionId, setCheckoutSessionId] = useState<string | undefined>();
  const [stripeWindowRef, setStripeWindowRef] = useState<Window | null>(null);

  const handleUpgrade = async (priceId: string, mode: 'subscription' | 'payment') => {
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Non authentifié');
      }

      // Call Edge Function to create checkout session
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          mode,
          successUrl: `${window.location.origin}/profile?checkout=success`,
          cancelUrl: `${window.location.origin}/profile?checkout=canceled`,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }

      // Open Stripe Checkout
      if (data.checkoutUrl && data.sessionId) {
        // Save checkout session to localStorage
        saveCheckoutSession({
          sessionId: data.sessionId,
          priceId,
          plan: mode === 'subscription' ? (priceId === PRICE_IDS.premium ? 'premium' : 'pro') : 'ai_minutes',
        });

        // Store session ID for the loading modal
        setCheckoutSessionId(data.sessionId);

        // Open Stripe Checkout in new tab
        const stripeWindow = window.open(data.checkoutUrl, '_blank');

        if (!stripeWindow) {
          toast({
            title: 'Pop-ups bloqués',
            description: 'Veuillez autoriser les pop-ups pour continuer vers le paiement',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Store the window reference
        setStripeWindowRef(stripeWindow);

        // Close the upgrade dialog
        onClose();

        // Show the loading modal immediately
        setShowLoadingModal(true);
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la session de paiement',
        variant: 'destructive',
      });

    } finally {
      setLoading(false);
    }
  };

  const handleCloseLoadingModal = () => {
    setShowLoadingModal(false);
    setCheckoutSessionId(undefined);
    setStripeWindowRef(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Améliorer mon abonnement
            </DialogTitle>
            <DialogDescription>
              Choisissez le plan qui correspond à vos besoins ou achetez des minutes supplémentaires pour l'avatar IA
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Subscription Plans */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Plans d'abonnement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Premium Plan */}
                {currentPlan === 'basic' && (
                  <Card className="p-6 border-2 border-blue-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold">
                      Populaire
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xl font-bold">Premium</h4>
                        <p className="text-3xl font-bold text-blue-600">9,90€<span className="text-sm text-muted-foreground">/mois</span></p>
                      </div>

                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>10 cours par mois</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>10 exercices par mois</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>10 fiches de révision par mois</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Achats de minutes IA disponibles</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>10 jours max par cours</span>
                        </li>
                      </ul>

                      <Button
                        onClick={() => handleUpgrade(PRICE_IDS.premium, 'subscription')}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          'Passer à Premium'
                        )}
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Pro Plan */}
                {(currentPlan === 'basic' || currentPlan === 'premium') && (
                  <Card className="p-6 border-2 border-purple-500">
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xl font-bold">Pro</h4>
                        <p className="text-3xl font-bold text-purple-600">19,90€<span className="text-sm text-muted-foreground">/mois</span></p>
                      </div>

                      <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>30 cours par mois</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>30 exercices par mois</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>30 fiches de révision par mois</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>Achats de minutes IA disponibles</span>
                        </li>
                        <li className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600" />
                          <span>10 jours max par cours</span>
                        </li>
                      </ul>

                      <Button
                        onClick={() => handleUpgrade(PRICE_IDS.pro, 'subscription')}
                        disabled={loading}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Chargement...
                          </>
                        ) : (
                          'Passer à Pro'
                        )}
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            </div>

            {/* AI Minutes Packs */}
            {(currentPlan === 'premium' || currentPlan === 'pro') && (
              <div>
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-orange-500" />
                  Minutes Avatar IA supplémentaires
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Les minutes achetées s'accumulent et n'expirent jamais
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 10 minutes */}
                  <Card className="p-4 border">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Pack</p>
                        <p className="text-2xl font-bold">10 minutes</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">5€</p>
                      <Button
                        onClick={() => handleUpgrade(PRICE_IDS.ai_10min, 'payment')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Acheter'
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* 30 minutes */}
                  <Card className="p-4 border-2 border-orange-500">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Pack</p>
                        <p className="text-2xl font-bold">30 minutes</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">15€</p>
                      <Button
                        onClick={() => handleUpgrade(PRICE_IDS.ai_30min, 'payment')}
                        disabled={loading}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Acheter'
                        )}
                      </Button>
                    </div>
                  </Card>

                  {/* 60 minutes */}
                  <Card className="p-4 border">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Pack</p>
                        <p className="text-2xl font-bold">60 minutes</p>
                      </div>
                      <p className="text-3xl font-bold text-orange-600">20€</p>
                      <Button
                        onClick={() => handleUpgrade(PRICE_IDS.ai_60min, 'payment')}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        {loading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Acheter'
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Current plan message */}
            {currentPlan === 'pro' && (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Vous êtes déjà sur le plan Pro, le plus complet!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Loading Modal - Moved outside Dialog to prevent unmounting */}
      <CheckoutLoadingModal
        open={showLoadingModal}
        onClose={handleCloseLoadingModal}
        sessionId={checkoutSessionId}
        stripeWindow={stripeWindowRef}
      />
    </>
  );
};
