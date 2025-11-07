import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Building2, Calendar, Users, AlertTriangle, Check, TrendingUp, Plus, CreditCard } from 'lucide-react';
import { useOrganizationSubscription } from '@/hooks/useOrganizationSubscription';
import { useOrganizationCapacity } from '@/hooks/useOrganizationCapacity';
import { B2B_STUDENT_LIMITS, BillingPeriod, formatPrice, calculateSeatCost } from '@/constants/organizationPlans';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { SeatPurchaseModal } from './SeatPurchaseModal';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { createSeatCheckoutSession } from '@/services/organizationSubscriptionService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OrganizationSubscriptionCardProps {
  organizationId: string;
  onManage?: () => void;
}

/**
 * Displays organization subscription information - Seat-based model only
 *
 * Shows:
 * - Current seat count and usage
 * - Renewal date
 * - Per-student limits (same for all B2B)
 * - Seat purchase and billing management
 */
export function OrganizationSubscriptionCard({
  organizationId,
  onManage,
}: OrganizationSubscriptionCardProps) {
  const { user, session } = useAuth();
  const {
    subscription,
    organization,
    seatLimit,
    activeMembersCount,
    isActive,
    isLoading,
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

  const [showSeatPurchase, setShowSeatPurchase] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  // Check if current user is admin of the organization
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user || !organizationId) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('user_id', user.id)
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .maybeSingle();  // Returns null if 0 rows, no error

      if (!error && data) {
        setIsAdmin(data.role === 'admin');
      } else {
        // User is not a member - might be the creator viewing their own org
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [user, organizationId]);

  const handleManageBilling = async () => {
    if (!session || !subscription?.stripe_customer_id) {
      toast.error('Impossible d\'accéder au portail de facturation');
      return;
    }

    if (!isAdmin) {
      toast.error('Seuls les administrateurs peuvent gérer la facturation');
      return;
    }

    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          context: 'organization',
          organization_id: organizationId,
          return_url: window.location.href,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error opening billing portal:', error);
      toast.error(error.message || 'Impossible d\'ouvrir le portail de facturation');
    } finally {
      setPortalLoading(false);
    }
  };

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

  // Always show detailed view - even with no subscription or 0 seats
  if (!organization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnement Organisation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Organisation introuvable</p>
        </CardContent>
      </Card>
    );
  }

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

  const handlePurchaseSeats = async (seatCount: number, billingPeriod: BillingPeriod, applyImmediately: boolean) => {
    try {
      const result = await createSeatCheckoutSession({
        organizationId,
        seatCount,
        billingPeriod,
        applyImmediately,
        successUrl: `${window.location.origin}${window.location.pathname}?seat-checkout=success`,
        cancelUrl: `${window.location.origin}${window.location.pathname}?seat-checkout=canceled`,
      });

      // Check response type
      if ('checkoutUrl' in result) {
        // First-time purchase: redirect to Stripe checkout
        window.location.href = result.checkoutUrl;
      } else if ('success' in result && result.success) {
        // Existing subscription updated: show success and refresh
        toast.success(
          result.message || 'Sièges mis à jour avec succès',
          {
            description: result.prorated
              ? `${result.quantity} siège${result.quantity > 1 ? 's' : ''} au total. Montant proratisé appliqué.`
              : undefined
          }
        );
        // Close modal and refresh page to show updated seat count
        setShowSeatPurchase(false);
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (error: any) {
      console.error('Error creating seat checkout session:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  // Calculate estimated monthly cost based on current seats
  const estimatedMonthlyCost = seatLimit ? calculateSeatCost(seatLimit, 'monthly') : 0;

  return (
    <>
      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" />
              <CardTitle>Abonnement Organisation B2B</CardTitle>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300">
              {seatLimit} siège{seatLimit > 1 ? 's' : ''}
            </Badge>
          </div>
          <CardDescription>
            Tarification progressive basée sur le nombre de sièges
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Badge - Only show if there are actual seats */}
          {subscription && subscription.status !== 'active' && seatLimit > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-semibold">
                    {subscription.status === 'canceled'
                      ? 'Abonnement aux sièges annulé'
                      : 'Abonnement inactif'}
                  </div>
                  {subscription.current_period_end && subscription.status === 'canceled' && (
                    <>
                      <div className="text-sm">
                        Vos {seatLimit} siège{seatLimit > 1 ? 's' : ''} restent actifs jusqu'au{' '}
                        <span className="font-medium">
                          {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
                        </span>
                      </div>
                      <div className="text-sm text-red-700 mt-2">
                        ⚠️ Après cette date, tous les membres perdront l'accès aux fonctionnalités B2B
                      </div>
                    </>
                  )}
                  {subscription.current_period_end && subscription.status !== 'canceled' && (
                    <div className="text-sm">
                      Contactez le support pour réactiver votre abonnement
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Current Cost */}
          {subscription && isActive && estimatedMonthlyCost > 0 && (
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Coût actuel</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Basé sur {seatLimit} siège{seatLimit > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatPrice(estimatedMonthlyCost)}
                    </div>
                    <div className="text-xs text-muted-foreground">par mois</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewal Date */}
          {subscription && subscription.current_period_end && isActive && (
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
                  Capacité maximale atteinte. Achetez plus de sièges pour ajouter des membres.
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
                  {B2B_STUDENT_LIMITS.exercisesPerMonth}
                </p>
                <p className="text-xs text-blue-600">par mois</p>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-purple-600" />
                  <span className="text-xs font-medium text-purple-700">Fiches</span>
                </div>
                <p className="text-lg font-bold text-purple-900">
                  {B2B_STUDENT_LIMITS.fichesPerMonth}
                </p>
                <p className="text-xs text-purple-600">par mois</p>
              </div>

              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Check className="w-3 h-3 text-orange-600" />
                  <span className="text-xs font-medium text-orange-700">Minutes IA</span>
                </div>
                <p className="text-lg font-bold text-orange-900">
                  {B2B_STUDENT_LIMITS.aiMinutesPerMonth}
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
              Acheter / Modifier les sièges
            </Button>

            {/* Manage Billing Button - Only for admins with active subscription */}
            {subscription?.stripe_customer_id && (
              <Button
                className="w-full"
                variant="outline"
                onClick={handleManageBilling}
                disabled={!isAdmin || portalLoading}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {portalLoading
                  ? 'Chargement...'
                  : !isAdmin
                    ? 'Gérer la facturation (Admin uniquement)'
                    : 'Gérer la facturation'
                }
              </Button>
            )}

            {onManage && (
              <Button
                className="w-full"
                variant="outline"
                onClick={onManage}
              >
                Gérer les membres
              </Button>
            )}

            {subscription && isActive && (
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
      {showSeatPurchase && (
        <SeatPurchaseModal
          open={showSeatPurchase}
          onClose={() => setShowSeatPurchase(false)}
          organizationId={organizationId}
          currentSeats={seatLimit}
          activeMembersCount={activeMembersCount}
          currentPeriodEnd={subscription?.current_period_end || null}
          currentBillingPeriod={(subscription?.billing_period as 'monthly' | 'yearly') || null}
          onPurchaseSeats={handlePurchaseSeats}
        />
      )}
    </>
  );
}
