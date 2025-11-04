import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, ArrowRight, Building2 } from 'lucide-react';
import { useOrganizationSubscription } from '@/hooks/useOrganizationSubscription';
import { useOrganizationCapacity } from '@/hooks/useOrganizationCapacity';
import { getOrganizationPlansArray, formatOrgPlanPrice, OrganizationPlanType } from '@/constants/organizationPlans';
import { useState } from 'react';

interface OrganizationCapacityModalProps {
  organizationId: string;
  open: boolean;
  onClose: () => void;
  onUpgrade?: (planType: OrganizationPlanType) => void;
}

/**
 * Modal shown when organization has reached capacity
 *
 * Displays:
 * - Current capacity status
 * - Available upgrade options
 * - Call to action to upgrade plan
 *
 * Triggered when admin tries to add member beyond seat limit
 */
export function OrganizationCapacityModal({
  organizationId,
  open,
  onClose,
  onUpgrade,
}: OrganizationCapacityModalProps) {
  const {
    plan,
    seatLimit,
    activeMembersCount,
  } = useOrganizationSubscription(organizationId);

  const {
    currentMembers,
    capacityPercentage,
    isFull,
  } = useOrganizationCapacity(organizationId);

  const [selectedPlan, setSelectedPlan] = useState<OrganizationPlanType | null>(null);

  const plans = getOrganizationPlansArray();
  const currentPlanIndex = plans.findIndex(p => p.id === plan?.id);

  // Get upgrade options (plans with higher capacity than current)
  const upgradeOptions = plans.filter((p, index) => index > currentPlanIndex);

  const handleUpgrade = () => {
    if (selectedPlan && onUpgrade) {
      onUpgrade(selectedPlan);
    }
    onClose();
  };

  const getPlanBadgeColor = (planType: OrganizationPlanType) => {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <DialogTitle className="text-xl">Capacité maximale atteinte</DialogTitle>
          </div>
          <DialogDescription>
            Votre organisation a atteint la limite de son plan actuel. Passez à un plan supérieur
            pour ajouter plus de membres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Plan actuel</span>
                  {plan && (
                    <Badge className={getPlanBadgeColor(plan.id)}>
                      {plan.displayName}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Utilisation des sièges</span>
                  <span className="font-mono font-bold">
                    {currentMembers} / {seatLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${capacityPercentage}%` }}
                  />
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Upgrade Options */}
          {upgradeOptions.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">
                Plans disponibles
              </h3>
              <div className="space-y-2">
                {upgradeOptions.map((upgradePlan) => (
                  <button
                    key={upgradePlan.id}
                    onClick={() => setSelectedPlan(upgradePlan.id)}
                    className={`w-full p-4 border-2 rounded-lg text-left transition-all hover:border-purple-300 hover:bg-purple-50/50 ${
                      selectedPlan === upgradePlan.id
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getPlanBadgeColor(upgradePlan.id)}>
                          {upgradePlan.displayName}
                        </Badge>
                        {upgradePlan.popular && (
                          <Badge variant="secondary" className="text-xs">
                            Populaire
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatOrgPlanPrice(upgradePlan.pricing.monthly.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">par mois</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {upgradePlan.seatRange.min} à {upgradePlan.seatRange.max} utilisateurs
                        </span>
                      </div>
                      {plan && (
                        <div className="flex items-center gap-1 text-green-600 font-medium">
                          <ArrowRight className="w-4 h-4" />
                          <span>
                            +{upgradePlan.seatRange.max - seatLimit} sièges
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                Vous êtes déjà au plan maximum. Contactez-nous pour des besoins personnalisés.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleUpgrade}
              disabled={!selectedPlan}
              className="flex-1"
            >
              Passer au plan sélectionné
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
