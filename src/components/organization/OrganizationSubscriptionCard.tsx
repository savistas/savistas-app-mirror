import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Building2, Calendar, Users, AlertTriangle, Check, TrendingUp, Plus } from 'lucide-react';
import { useOrganizationSubscription } from '@/hooks/useOrganizationSubscription';
import { useOrganizationCapacity } from '@/hooks/useOrganizationCapacity';
import { ORGANIZATION_PLANS, OrganizationPlanType, BillingPeriod } from '@/constants/organizationPlans';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { OrganizationPlanSelection } from './OrganizationPlanSelection';
import { SeatPurchaseModal } from './SeatPurchaseModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createSeatCheckoutSession } from '@/services/organizationSubscriptionService';

interface OrganizationSubscriptionCardProps {
  organizationId: string;
  onUpgrade?: () => void;
  onManage?: () => void;
}

/**
 * Displays organization subscription information and management options
 *
 * Shows:
 * - Current plan and status
 * - Seat usage and capacity
 * - Renewal date
 * - Per-student limits
 * - Upgrade/manage/cancel options
 */
export function OrganizationSubscriptionCard({
  organizationId,
  onUpgrade,
  onManage,
}: OrganizationSubscriptionCardProps) {
  const {
    subscription,
    organization,
    plan,
    seatLimit,
    activeMembersCount,
    isActive,
    isLoading,
    createCheckout,
    isCreatingCheckout,
    cancelSubscription,
  } = useOrganizationSubscription(organizationId);

  const {
    canAddMember,
    currentMembers,
    remainingSeats,
    capacityPercentage,
    capacityStatus,
    isFull,
  } = useOrganizationCapacity(organizationId);

  const [showPlanSelection, setShowPlanSelection] = useState(false);
  const [showSeatPurchase, setShowSeatPurchase] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnement Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !organization || !plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Abonnement Organisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucun abonnement actif. Choisissez un plan ci-dessous pour commencer.</p>
        </CardContent>
      </Card>
    );
  }

  const getPlanBadgeColor = (planType: string) => {
    switch (planType) {
      case 'b2b_pro':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'b2b_max':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'b2b_ultra':
        return 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-900 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getCapacityColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm(
      'Êtes-vous sûr de vouloir annuler l\'abonnement de votre organisation ? ' +
      'Tous les membres perdront leurs avantages à la fin de la période de facturation actuelle.'
    )) {
      return;
    }

    setIsCanceling(true);
    try {
      await cancelSubscription.mutateAsync();
      toast.success('Abonnement annulé avec succès. Actif jusqu\'à la fin de la période.');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'annulation');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleSelectPlan = async (priceId: string, planType: OrganizationPlanType, billingPeriod: BillingPeriod) => {
    try {
      // Create checkout session for the selected plan
      createCheckout({
        organizationId,
        priceId,
        mode: 'subscription',
        successUrl: `${window.location.origin}${window.location.pathname}?checkout=success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?checkout=canceled`,
      });

      setShowPlanSelection(false);

      // Note: User will be redirected to Stripe checkout, so no need to call onUpgrade here
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Erreur lors de la création de la session de paiement');
    }
  };

  const handlePurchaseSeats = async (seatCount: number, billingPeriod: BillingPeriod) => {
    if (!plan) {
      toast.error('Plan non trouvé');
      return;
    }

    try {
      const result = await createSeatCheckoutSession({
        organizationId,
        seatCount,
        billingPeriod,
        successUrl: `${window.location.origin}${window.location.pathname}?seat-checkout=success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?seat-checkout=canceled`,
      });

      // Redirect to Stripe checkout
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      console.error('Error creating seat checkout session:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  return (
    <>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <CardTitle>Abonnement Organisation</CardTitle>
            </div>
            <Badge className={getPlanBadgeColor(plan.id)}>
              {plan.displayName}
            </Badge>
          </div>
          <CardDescription>
            Gérez l'abonnement de votre organisation et consultez les limites
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Badge */}
          {subscription.status !== 'active' && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Abonnement {subscription.status === 'canceled' ? 'annulé' : 'inactif'}
                {subscription.current_period_end && (
                  <span>
                    {' '}- Actif jusqu'au{' '}
                    {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Renewal Date */}
          {subscription.current_period_end && isActive && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Prochain renouvellement le{' '}
                {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}

          {/* Seat Usage */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h4 className="font-semibold">Utilisation des sièges</h4>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Membres actifs</span>
                <span className="font-medium">
                  {currentMembers} / {seatLimit}
                </span>
              </div>
              <Progress
                value={capacityPercentage}
                className="h-2"
                indicatorClassName={getCapacityColor(capacityStatus)}
              />
              <p className="text-xs text-muted-foreground">
                {remainingSeats} {remainingSeats === 1 ? 'siège disponible' : 'sièges disponibles'}
              </p>
            </div>

            {/* Capacity Warning */}
            {isFull && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Capacité maximale atteinte. Passez à un plan supérieur pour ajouter plus de membres.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Per-Student Limits */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <h4 className="font-semibold">Limites par étudiant</h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">Exercices</span>
                </div>
                <p className="text-lg font-bold text-blue-900">
                  {plan.perStudentLimits.exercisesPerMonth}
                </p>
                <p className="text-xs text-blue-600">par mois</p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Fiches</span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {plan.perStudentLimits.fichesPerMonth}
                </p>
                <p className="text-xs text-purple-600">par mois</p>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">Minutes IA</span>
                </div>
                <p className="text-lg font-bold text-orange-900">
                  {plan.perStudentLimits.aiMinutesPerMonth}
                </p>
                <p className="text-xs text-orange-600">par mois</p>
              </div>

              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-green-600" />
                  <span className="text-xs font-medium text-green-700">Cours</span>
                </div>
                <p className="text-lg font-bold text-green-900">∞</p>
                <p className="text-xs text-green-600">illimité</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Chaque étudiant bénéficie de ces limites individuelles
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-4">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              variant="default"
              onClick={() => setShowSeatPurchase(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Acheter des sièges
            </Button>

            <Button
              className="w-full"
              variant="outline"
              onClick={() => setShowPlanSelection(true)}
              disabled={isCreatingCheckout}
            >
              {isCreatingCheckout ? 'Création de la session...' : 'Changer de plan'}
            </Button>

            {onManage && (
              <Button
                className="w-full"
                variant="outline"
                onClick={onManage}
              >
                Gérer les membres
              </Button>
            )}

            {isActive && (
              <Button
                className="w-full"
                variant="ghost"
                onClick={handleCancelSubscription}
                disabled={isCanceling}
              >
                {isCanceling ? 'Annulation...' : 'Annuler l\'abonnement'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Seat Purchase Modal */}
      {showSeatPurchase && plan && (
        <SeatPurchaseModal
          open={showSeatPurchase}
          onClose={() => setShowSeatPurchase(false)}
          organizationId={organizationId}
          currentPlan={plan.id}
          currentSeats={seatLimit}
          onPurchaseSeats={handlePurchaseSeats}
        />
      )}

      {/* Plan Selection Dialog */}
      {showPlanSelection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Changer de plan</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPlanSelection(false)}
                >
                  ✕
                </Button>
              </div>
              <OrganizationPlanSelection
                currentPlan={plan.id}
                organizationId={organizationId}
                onSelectPlan={handleSelectPlan}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
