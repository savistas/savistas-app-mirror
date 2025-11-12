import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Users, Building2, ShoppingCart } from 'lucide-react';
import { useOrganizationSubscription } from '@/hooks/useOrganizationSubscription';
import { useOrganizationCapacity } from '@/hooks/useOrganizationCapacity';
import { formatPrice, calculateSeatCost, MAX_SEATS, MIN_SEATS } from '@/constants/organizationPlans';

interface OrganizationCapacityModalProps {
  organizationId: string;
  open: boolean;
  onClose: () => void;
  onBuySeats?: () => void;
}

/**
 * Modal shown when organization has reached capacity
 *
 * Displays:
 * - Current capacity status
 * - Suggested seat purchase
 * - Call to action to buy more seats
 *
 * Triggered when admin tries to add member beyond seat limit
 */
export function OrganizationCapacityModal({
  organizationId,
  open,
  onClose,
  onBuySeats,
}: OrganizationCapacityModalProps) {
  const {
    seatLimit,
    activeMembersCount,
  } = useOrganizationSubscription(organizationId);

  const {
    currentMembers,
    capacityPercentage,
  } = useOrganizationCapacity(organizationId);

  // Suggest buying 20% more seats than current limit (rounded up)
  // If no seats yet (seatLimit = 0), suggest 10 seats as starting point
  const suggestedSeats = Math.max(
    MIN_SEATS,
    Math.min(
      Math.ceil((seatLimit || 10) * 1.2),
      MAX_SEATS
    )
  );

  const estimatedCost = calculateSeatCost(suggestedSeats, 'monthly');
  const canBuyMore = seatLimit < MAX_SEATS;

  const handleBuySeats = () => {
    if (onBuySeats) {
      onBuySeats();
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <DialogTitle className="text-xl">Capacité maximale atteinte</DialogTitle>
          </div>
          <DialogDescription>
            Votre organisation a atteint sa limite de sièges. Achetez plus de sièges pour ajouter des membres.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Utilisation des sièges</span>
                  <span className="font-mono font-bold">
                    {currentMembers} / {seatLimit}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tous vos sièges sont utilisés. Achetez-en plus pour continuer à ajouter des membres.
                </p>
              </div>
            </AlertDescription>
          </Alert>

          {/* Suggested Purchase */}
          {canBuyMore ? (
            <div className="p-4 border-2 border-blue-200 rounded-lg bg-blue-50/50">
              <div className="flex items-start gap-3">
                <ShoppingCart className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">
                    Suggestion : {suggestedSeats} sièges
                  </h4>
                  <p className="text-sm text-blue-700 mb-2">
                    +{suggestedSeats - seatLimit} sièges supplémentaires pour anticiper la croissance
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-900">
                      {formatPrice(estimatedCost)}
                    </span>
                    <span className="text-sm text-blue-600">/mois</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Tarification progressive : plus vous achetez, moins vous payez par siège
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertDescription>
                Vous avez atteint la capacité maximale de {MAX_SEATS} sièges.
                Contactez-nous pour des besoins personnalisés.
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleBuySeats}
              disabled={!canBuyMore}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Users className="w-4 h-4 mr-2" />
              Acheter des sièges
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
