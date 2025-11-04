import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Info, TrendingDown, Users, X } from 'lucide-react';
import { OrganizationPlanType, ORGANIZATION_PLANS } from '@/constants/organizationPlans';

interface AutoDowngradeNotificationProps {
  oldPlan: OrganizationPlanType;
  newPlan: OrganizationPlanType;
  currentMembers: number;
  newSeatLimit: number;
  onDismiss?: () => void;
  onUpgrade?: () => void;
  className?: string;
}

/**
 * Alert notification shown after automatic plan downgrade
 *
 * Displays:
 * - Reason for downgrade (member count dropped)
 * - Old plan → New plan
 * - New capacity and limits
 * - Option to upgrade again if needed
 *
 * Triggered after organization member removal causes auto-downgrade
 */
export function AutoDowngradeNotification({
  oldPlan,
  newPlan,
  currentMembers,
  newSeatLimit,
  onDismiss,
  onUpgrade,
  className = '',
}: AutoDowngradeNotificationProps) {
  const oldPlanConfig = ORGANIZATION_PLANS[oldPlan];
  const newPlanConfig = ORGANIZATION_PLANS[newPlan];

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
    <Alert className={`border-orange-200 bg-orange-50 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-orange-600" />
            <AlertTitle className="text-orange-900 font-semibold">
              Plan automatiquement ajusté
            </AlertTitle>
          </div>

          <AlertDescription className="text-orange-800 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 flex-shrink-0" />
              <p>
                Votre organisation compte maintenant <strong>{currentMembers} membres</strong>.
                Votre plan a été automatiquement ajusté pour correspondre à votre utilisation réelle.
              </p>
            </div>

            {/* Plan Change */}
            <div className="flex items-center gap-3 p-3 bg-white/70 rounded-lg">
              <Badge className={getPlanBadgeColor(oldPlan)}>
                {oldPlanConfig.displayName}
              </Badge>
              <TrendingDown className="w-4 h-4 text-muted-foreground" />
              <Badge className={getPlanBadgeColor(newPlan)}>
                {newPlanConfig.displayName}
              </Badge>
            </div>

            {/* New Capacity */}
            <div className="flex items-center gap-2 p-3 bg-white/70 rounded-lg text-sm">
              <Users className="w-4 h-4 text-orange-600" />
              <div className="flex-1">
                <p className="font-medium">Nouvelle capacité</p>
                <p className="text-xs text-muted-foreground">
                  {currentMembers} / {newSeatLimit} membres utilisés
                </p>
              </div>
              <span className="font-mono font-bold text-lg">
                {newSeatLimit}
              </span>
            </div>

            {/* Prorated Credit */}
            <div className="text-xs bg-green-50 border border-green-200 rounded p-2">
              💰 <strong>Crédit appliqué :</strong> Le temps non utilisé de votre ancien plan a été
              crédité sur votre prochaine facture.
            </div>

            {/* Actions */}
            {onUpgrade && (
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="default"
                  onClick={onUpgrade}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Repasser au plan supérieur
                </Button>
              </div>
            )}
          </AlertDescription>
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="ml-2 h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </Alert>
  );
}
