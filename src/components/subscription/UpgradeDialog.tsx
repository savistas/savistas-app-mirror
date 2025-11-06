import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Crown, Bot, Loader2, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpgradeDialogProps {
  open: boolean;
  onClose: () => void;
  currentPlan: 'basic' | 'premium' | 'pro';
  showOnlyAIMinutes?: boolean;
}

const PRICE_IDS = {
  premium: 'price_1SNu6P37eeTawvFRvh1JGgOC',
  pro: 'price_1SNu6N37eeTawvFR0CRbzo7F',
  ai_10min: 'price_1SNu6D37eeTawvFRAVwbpsol',
  ai_30min: 'price_1SNu6B37eeTawvFRjJ20hc7w',
  ai_60min: 'price_1SNu5g37eeTawvFRdsQ1vIYp',
};

export const UpgradeDialog = ({ open, onClose, currentPlan, showOnlyAIMinutes = false }: UpgradeDialogProps) => {
  const { toast } = useToast();
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);

  // Reset loading state when dialog closes
  const handleClose = () => {
    setLoadingPriceId(null);
    onClose();
  };

  const handleUpgrade = async (priceId: string, mode: 'subscription' | 'payment') => {
    setLoadingPriceId(priceId);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Non authentifié');
      }

      // Call Edge Function to create checkout session
      const purchaseType = mode === 'payment' ? 'ai_minutes' : 'subscription';
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId,
          mode,
          successUrl: `${window.location.origin}/profile?checkout=success&type=${purchaseType}`,
          cancelUrl: `${window.location.origin}/profile?checkout=canceled`,
        },
      });

      if (error) {
        console.error('Error creating checkout session:', error);
        throw error;
      }

      // Redirect to Stripe Checkout in same tab
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;

      }
    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de la création de la session de paiement',
        variant: 'destructive',
      });
      setLoadingPriceId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="w-[90%] sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </button>
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              {showOnlyAIMinutes ? (
                <>
                  <Bot className="w-6 h-6 text-orange-500" />
                  Acheter des minutes Avatar IA
                </>
              ) : (
                <>
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Améliorer mon abonnement
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {showOnlyAIMinutes
                ? "Achetez des minutes supplémentaires pour utiliser l'avatar IA. Les minutes n'expirent jamais."
                : "Choisissez le plan qui correspond à vos besoins ou achetez des minutes supplémentaires pour l'avatar IA"
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Subscription Plans */}
            {!showOnlyAIMinutes && (
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
                        disabled={loadingPriceId !== null}
                        className="w-full"
                      >
                        {loadingPriceId === PRICE_IDS.premium ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirection vers Stripe...
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
                        disabled={loadingPriceId !== null}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        {loadingPriceId === PRICE_IDS.pro ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirection vers Stripe...
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
            )}

            {/* AI Minutes Packs - Available for all plans */}
            <div>
                {!showOnlyAIMinutes && (
                  <>
                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-orange-500" />
                      Minutes Avatar IA supplémentaires
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Les minutes achetées s'accumulent et n'expirent jamais
                    </p>
                  </>
                )}

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
                        disabled={loadingPriceId !== null}
                        variant="outline"
                        className="w-full"
                      >
                        {loadingPriceId === PRICE_IDS.ai_10min ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirection...
                          </>
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
                        disabled={loadingPriceId !== null}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        {loadingPriceId === PRICE_IDS.ai_30min ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirection...
                          </>
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
                        disabled={loadingPriceId !== null}
                        variant="outline"
                        className="w-full"
                      >
                        {loadingPriceId === PRICE_IDS.ai_60min ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Redirection...
                          </>
                        ) : (
                          'Acheter'
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>
            </div>

            {/* Current plan message */}
            {!showOnlyAIMinutes && currentPlan === 'pro' && (
              <div className="text-center text-muted-foreground">
                <p className="text-sm">Vous êtes déjà sur le plan Pro, le plus complet!</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
