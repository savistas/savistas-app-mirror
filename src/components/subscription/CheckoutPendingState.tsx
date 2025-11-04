import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CreditCard, XCircle, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { clearCheckoutSession, getCheckoutSession } from "@/lib/checkoutSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface CheckoutPendingStateProps {
  onCancel?: () => void;
}

export const CheckoutPendingState = ({ onCancel }: CheckoutPendingStateProps) => {
  const { user } = useAuth();
  const [canceling, setCanceling] = useState(false);
  const session = getCheckoutSession();

  // Poll subscription status every 3 seconds to detect updates
  useEffect(() => {
    if (!user || !session) return;

    const pollSubscription = async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan, status')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        // Check if the plan matches what we were purchasing
        const expectedPlan = session.plan; // 'premium' or 'pro'

        if (data.plan === expectedPlan && data.status === 'active') {
          // Payment succeeded! Clear session and notify
          clearCheckoutSession();

          toast.success('Paiement réussi!', {
            description: 'Votre abonnement a été mis à jour avec succès.',
          });

          // Trigger parent refresh
          onCancel?.();
        }
      }
    };

    // Initial check
    pollSubscription();

    // Poll every 3 seconds
    const interval = setInterval(pollSubscription, 3000);

    return () => clearInterval(interval);
  }, [user, session, onCancel]);

  if (!session) return null;

  const handleCancel = async () => {
    setCanceling(true);

    try {
      // Call Edge Function to cancel/expire the checkout session
      const { error } = await supabase.functions.invoke('cancel-checkout-session', {
        body: {
          sessionId: session.sessionId,
        },
      });

      if (error) {
        console.error('Error canceling checkout session:', error);
        // Still clear local storage even if API call fails
      }

      // Clear session from localStorage
      clearCheckoutSession();

      toast.info('Paiement annulé', {
        description: 'La session de paiement a été annulée.',
      });

      // Notify parent component
      onCancel?.();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Erreur lors de l\'annulation', {
        description: error.message || 'Une erreur est survenue',
      });
    } finally {
      setCanceling(false);
    }
  };

  const getPlanName = (plan: string) => {
    if (plan === 'premium') return 'Premium';
    if (plan === 'pro') return 'Pro';
    return 'Minutes IA';
  };

  return (
    <Card className="border-2 border-orange-200 bg-orange-50/30">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-600" />
          <CardTitle className="text-orange-900">Paiement en cours</CardTitle>
        </div>
        <CardDescription className="text-orange-800">
          Vous avez une session de paiement active
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Alert className="border-orange-300 bg-orange-50">
          <AlertCircle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <div className="space-y-2">
              <p>
                Une session de paiement pour le plan <strong>{getPlanName(session.plan)}</strong> est en cours.
              </p>
              <p className="text-sm">
                Si vous avez été redirigé vers Stripe, veuillez compléter le paiement ou fermer la fenêtre Stripe pour annuler.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-center gap-3 p-6 bg-white rounded-lg border border-orange-200">
          <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          <span className="text-orange-900 font-medium">En attente de confirmation de paiement...</span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleCancel}
            disabled={canceling}
            variant="outline"
            className="w-full border-orange-300 text-orange-900 hover:bg-orange-100"
          >
            {canceling ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Annulation...
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 mr-2" />
                Annuler le paiement
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Cette session expirera automatiquement après 24 heures
        </p>
      </CardContent>
    </Card>
  );
};
