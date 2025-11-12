import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Calendar, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UserSubscription } from "@/hooks/useSubscription";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SubscriptionListProps {
  subscription: UserSubscription;
  onSubscriptionCancelled?: () => void;
}

export const SubscriptionList = ({ subscription, onSubscriptionCancelled }: SubscriptionListProps) => {
  const { toast } = useToast();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Don't show the list if user is on basic plan (no active paid subscription)
  if (subscription.plan === 'basic' || !subscription.stripe_subscription_id) {
    return null;
  }

  const handleCancelSubscription = async () => {
    if (!subscription.stripe_subscription_id) return;

    try {
      setCancellingId(subscription.stripe_subscription_id);

      // Call the cancel-subscription Edge Function
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { subscriptionId: subscription.stripe_subscription_id },
      });

      if (error) {
        throw new Error(error.message || 'Failed to cancel subscription');
      }

      toast({
        title: "Abonnement annulé",
        description: "Votre abonnement a été annulé avec succès. Il restera actif jusqu'à la fin de la période payée.",
      });

      // Notify parent component to refetch data
      if (onSubscriptionCancelled) {
        onSubscriptionCancelled();
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'annuler l'abonnement",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
      setShowCancelDialog(false);
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">En cours d'annulation</Badge>;
    }

    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Actif</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300">Annulé</Badge>;
      case 'past_due':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">Impayé</Badge>;
      case 'incomplete':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Incomplet</Badge>;
      case 'trialing':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Période d'essai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'Plan Personnel Premium';
      case 'pro':
        return 'Plan Personnel Pro';
      default:
        return 'Abonnement';
    }
  };

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'premium':
        return '9,90€';
      case 'pro':
        return '19,90€';
      default:
        return '';
    }
  };

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Mon abonnement actif
          </CardTitle>
          <CardDescription>
            Gérez votre abonnement en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card className="border-2">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{getPlanName(subscription.plan)}</h3>
                    {getStatusBadge(subscription.status, subscription.cancel_at_period_end)}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {getPlanPrice(subscription.plan)} / mois
                  </p>

                  {subscription.current_period_end && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {subscription.cancel_at_period_end ? 'Se termine le' : 'Prochain renouvellement le'}{' '}
                        {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  )}

                  {subscription.cancel_at_period_end && (
                    <div className="text-sm text-orange-600 font-medium">
                      Cet abonnement a été annulé et ne sera pas renouvelé
                    </div>
                  )}
                </div>

                {subscription.status === 'active' && !subscription.cancel_at_period_end && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCancelDialog(true)}
                    disabled={cancellingId !== null}
                    className="whitespace-nowrap"
                  >
                    {cancellingId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Annulation...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Annuler l'abonnement
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir annuler cet abonnement ?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Votre abonnement <strong>{getPlanName(subscription.plan)}</strong> sera annulé.
              </p>
              {subscription.current_period_end && (
                <p className="text-amber-600 font-medium">
                  Vous conserverez l'accès jusqu'au{' '}
                  {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
                </p>
              )}
              <p>
                Après cette date, vous serez rétrogradé au forfait Basic.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              className="bg-red-600 hover:bg-red-700"
            >
              Confirmer l'annulation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
