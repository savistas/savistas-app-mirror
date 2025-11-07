import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CreditCard, TrendingDown, Info, AlertTriangle, Clock, Zap, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  BillingPeriod,
  calculateSeatCost,
  calculateProgressivePricing,
  formatPrice,
  MIN_SEATS,
  MAX_SEATS,
  PRICING_TIERS,
  getMonthlyEquivalent,
} from '@/constants/organizationPlans';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SeatPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  currentSeats: number;
  activeMembersCount: number;
  currentPeriodEnd?: string | null;
  currentBillingPeriod?: BillingPeriod | null;
  onPurchaseSeats: (seatCount: number, billingPeriod: BillingPeriod, applyImmediately: boolean) => Promise<void>;
}

/**
 * Enhanced modal for purchasing organization seats with progressive tier pricing
 *
 * Features:
 * - Interactive slider for seat count selection (1-100)
 * - Monthly/Yearly billing toggle
 * - Real-time progressive pricing calculation with tier breakdown
 * - Visual pricing tiers display
 * - Yearly savings calculation
 */
export function SeatPurchaseModal({
  open,
  onClose,
  organizationId,
  currentSeats,
  activeMembersCount,
  currentPeriodEnd,
  currentBillingPeriod,
  onPurchaseSeats,
}: SeatPurchaseModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(currentBillingPeriod || 'monthly');
  const [seatCount, setSeatCount] = useState<number>(Math.max(MIN_SEATS, currentSeats || 1));
  const [applyImmediately, setApplyImmediately] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate pricing
  const totalCost = calculateSeatCost(seatCount, billingPeriod);
  const breakdown = calculateProgressivePricing(seatCount, billingPeriod);

  // Calculate yearly savings
  const monthlyCost = calculateSeatCost(seatCount, 'monthly');
  const yearlyCost = calculateSeatCost(seatCount, 'yearly');
  const yearlySavings = (monthlyCost * 12) - yearlyCost;

  // Check if reducing seats and if below active members
  const isReducing = seatCount < currentSeats;
  const isIncreasing = seatCount > currentSeats;
  const isReducingBelowActive = seatCount < activeMembersCount;
  const seatsToRemove = Math.max(0, activeMembersCount - seatCount);

  // Check if billing period is changing
  const isBillingPeriodChanging = currentBillingPeriod && currentBillingPeriod !== billingPeriod;

  // Calculate costs in their respective billing periods
  const currentBillingPeriodValue = currentBillingPeriod || 'monthly';
  const currentCost = currentSeats > 0 ? calculateSeatCost(currentSeats, currentBillingPeriodValue) : 0;
  const newCost = calculateSeatCost(seatCount, billingPeriod); // Use SELECTED period!

  // Normalize to monthly for fair comparison
  const currentMonthlyCost = currentBillingPeriodValue === 'yearly' ? currentCost / 12 : currentCost;
  const newMonthlyCost = billingPeriod === 'yearly' ? newCost / 12 : newCost;
  const monthlyDifference = newMonthlyCost - currentMonthlyCost;

  // Calculate yearly costs for display
  const currentYearlyCost = currentBillingPeriodValue === 'yearly' ? currentCost : currentCost * 12;
  const newYearlyCost = billingPeriod === 'yearly' ? newCost : newCost * 12;
  const yearlyDifference = newYearlyCost - currentYearlyCost;

  // Estimate prorated amount (simplified calculation)
  // In reality, this would come from Stripe API
  const estimateProration = () => {
    if (!currentPeriodEnd || !applyImmediately) return null;

    // If billing period is changing, proration is too complex to estimate accurately
    // Stripe will credit unused time from old period and charge for new period
    if (isBillingPeriodChanging) {
      return null; // Don't show estimate for period changes
    }

    const now = new Date();
    const periodEnd = new Date(currentPeriodEnd);
    const remainingDays = Math.max(0, Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate total period days based on CURRENT billing period
    const totalPeriodDays = currentBillingPeriodValue === 'yearly' ? 365 : 30;
    const proratedFraction = remainingDays / totalPeriodDays;

    // Use cost difference in current period for proration
    const costDifferenceInCurrentPeriod = calculateSeatCost(seatCount, currentBillingPeriodValue) - currentCost;
    return costDifferenceInCurrentPeriod * proratedFraction;
  };

  const proratedAmount = estimateProration();

  // Handle seat purchase
  const handlePurchase = async () => {
    if (seatCount < MIN_SEATS || seatCount > MAX_SEATS) {
      toast.error(`Le nombre de sièges doit être entre ${MIN_SEATS} et ${MAX_SEATS}`);
      return;
    }

    // CRITICAL: Block ALL reductions below active members (both immediate and scheduled)
    // Reason: Even with "scheduled billing", Stripe applies seat changes immediately.
    // The "scheduled" option only defers the invoice, not the seat limit change.
    if (isReducingBelowActive) {
      toast.error(
        `Impossible de réduire à ${seatCount} siège${seatCount > 1 ? 's' : ''}. Vous avez ${activeMembersCount} membre${activeMembersCount > 1 ? 's' : ''} actif${activeMembersCount > 1 ? 's' : ''}. ` +
        `Veuillez d'abord retirer ${seatsToRemove} membre${seatsToRemove > 1 ? 's' : ''} de votre organisation avant de réduire le nombre de sièges.`
      );
      return;
    }

    setIsProcessing(true);
    try {
      await onPurchaseSeats(seatCount, billingPeriod, applyImmediately);
      // Don't close here - the checkout redirect will happen or page will reload
    } catch (error: any) {
      console.error('Error purchasing seats:', error);
      toast.error(error.message || 'Erreur lors de l\'achat des sièges');
      setIsProcessing(false);
    }
  };

  // Get tier color for visual indication
  const getTierColor = (tierIndex: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-300',
      'bg-purple-100 text-purple-800 border-purple-300',
      'bg-green-100 text-green-800 border-green-300',
    ];
    return colors[tierIndex] || colors[0];
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Users className="w-6 h-6 text-blue-600" />
            Acheter des sièges
          </DialogTitle>
          <DialogDescription>
            Tarification progressive : plus vous achetez, moins vous payez par siège
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3">
          {/* Active Members Count */}
          {currentSeats > 0 && (
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Membres actifs actuels</div>
                      <div className="text-xs text-gray-600">Occupent des sièges dans votre organisation</div>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">{activeMembersCount}</div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warning: Reducing Below Active Members */}
          {isReducingBelowActive && (
            <Alert variant="destructive" className="border-red-300 bg-red-50">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <AlertDescription className="text-red-900">
                <div className="font-semibold mb-2">⚠️ Impossible de réduire en-dessous du nombre de membres actifs</div>
                <div className="space-y-2 text-sm">
                  <p>Vous souhaitez réduire à <strong>{seatCount} siège{seatCount > 1 ? 's' : ''}</strong> mais vous avez <strong>{activeMembersCount} membre{activeMembersCount > 1 ? 's' : ''} actif{activeMembersCount > 1 ? 's' : ''}</strong>.</p>
                  <div className="bg-red-100 border border-red-300 rounded p-2 mt-2">
                    <p className="font-medium">📌 Action requise :</p>
                    <p className="mt-1">Vous devez d'abord retirer <strong>{seatsToRemove} membre{seatsToRemove > 1 ? 's' : ''}</strong> de votre organisation avant de pouvoir réduire le nombre de sièges.</p>
                  </div>
                  <p className="text-xs text-red-700 mt-2">
                    <strong>Note technique :</strong> Les changements de sièges sont appliqués immédiatement dans votre organisation, même si la facturation est différée. C'est pourquoi vous devez avoir suffisamment de sièges disponibles pour tous vos membres actifs.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pricing Tiers Info */}
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-900">
              <div className="font-semibold mb-1">Tarification par tranches :</div>
              <div className="space-y-0.5">
                {PRICING_TIERS.map((tier, idx) => (
                  <div key={idx}>
                    {tier.minSeats}-{tier.maxSeats} sièges : <strong>{formatPrice(tier.pricePerSeat)}/siège/mois</strong>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>

          {/* Billing Period Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Période de facturation</Label>
            <RadioGroup
              value={billingPeriod}
              onValueChange={(value) => setBillingPeriod(value as BillingPeriod)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="monthly"
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${billingPeriod === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <RadioGroupItem value="monthly" id="monthly" className="sr-only" />
                <div className="font-semibold text-lg">Mensuel</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Facturé chaque mois
                </div>
              </Label>

              <Label
                htmlFor="yearly"
                className={`
                  flex flex-col items-center justify-center p-4 rounded-lg border-2 cursor-pointer transition-all relative
                  ${billingPeriod === 'yearly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <RadioGroupItem value="yearly" id="yearly" className="sr-only" />
                <div className="font-semibold text-lg">Annuel</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Facturé une fois par an
                </div>
                {yearlySavings > 0 && (
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    Économisez {formatPrice(yearlySavings)}
                  </div>
                )}
              </Label>
            </RadioGroup>
          </div>

          {/* Seat Count Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Nombre de sièges</Label>
              <div className="text-3xl font-bold text-blue-600">{seatCount}</div>
            </div>

            <Slider
              value={[seatCount]}
              onValueChange={(values) => setSeatCount(values[0])}
              min={MIN_SEATS}
              max={MAX_SEATS}
              step={1}
              className="w-full"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Min: {MIN_SEATS} siège</span>
              <span>Max: {MAX_SEATS} sièges</span>
            </div>
          </div>

          {/* Billing Timing Choice - Only show when modifying existing subscription */}
          {currentSeats > 0 && seatCount !== currentSeats && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Quand appliquer le changement ?</Label>
              <RadioGroup
                value={applyImmediately ? 'immediate' : 'scheduled'}
                onValueChange={(value) => setApplyImmediately(value === 'immediate')}
                className="grid grid-cols-1 md:grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="immediate"
                  className={`
                    flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${applyImmediately ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <RadioGroupItem value="immediate" id="immediate" className="sr-only" />
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <div className="font-semibold text-lg">Immédiatement</div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Sièges disponibles <strong>immédiatement</strong></p>
                    <p>• {isIncreasing ? 'Paiement' : 'Crédit'} proratisé pour la période restante</p>
                    <p>• Facture générée aujourd'hui</p>
                  </div>
                </Label>

                <Label
                  htmlFor="scheduled"
                  className={`
                    flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${!applyImmediately ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                >
                  <RadioGroupItem value="scheduled" id="scheduled" className="sr-only" />
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <div className="font-semibold text-lg">Facturation différée</div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <p>• Sièges disponibles <strong>immédiatement</strong></p>
                    <p>• Pas de facture additionnelle maintenant</p>
                    <p>• Nouveau montant facturé le {currentPeriodEnd ? format(new Date(currentPeriodEnd), 'dd MMM yyyy', { locale: fr }) : 'prochain renouvellement'}</p>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          )}

          {/* Cost Comparison - Before/After */}
          {currentSeats > 0 && seatCount !== currentSeats && (
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-900">Comparaison des coûts</h4>
                </div>

                {/* Billing Period Change Notice */}
                {isBillingPeriodChanging && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-3">
                    <p className="text-xs text-yellow-800 font-medium">
                      ⚠️ Changement de période de facturation : {currentBillingPeriodValue === 'monthly' ? 'Mensuel' : 'Annuel'} → {billingPeriod === 'monthly' ? 'Mensuel' : 'Annuel'}
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      La comparaison ci-dessous est normalisée mensuellement pour faciliter la compréhension.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {/* Current Cost */}
                  <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-600 mb-1">
                      Coût actuel
                      {currentBillingPeriodValue === 'yearly' && <span className="ml-1 text-blue-600">(Annuel)</span>}
                    </div>
                    <div className="text-xl font-bold text-gray-900">{formatPrice(currentMonthlyCost)}</div>
                    <div className="text-xs text-gray-500">{currentSeats} siège{currentSeats > 1 ? 's' : ''}/mois</div>
                    {currentBillingPeriodValue === 'yearly' && (
                      <div className="text-xs text-gray-400 mt-1">{formatPrice(currentCost)}/an facturé</div>
                    )}
                  </div>

                  {/* New Cost */}
                  <div className="text-center p-3 bg-white rounded-lg border-2 border-purple-300">
                    <div className="text-xs text-gray-600 mb-1">
                      Nouveau coût
                      {billingPeriod === 'yearly' && <span className="ml-1 text-blue-600">(Annuel)</span>}
                    </div>
                    <div className="text-xl font-bold text-purple-600">{formatPrice(newMonthlyCost)}</div>
                    <div className="text-xs text-gray-500">{seatCount} siège{seatCount > 1 ? 's' : ''}/mois</div>
                    {billingPeriod === 'yearly' && (
                      <div className="text-xs text-gray-400 mt-1">{formatPrice(newCost)}/an facturé</div>
                    )}
                  </div>
                </div>

                {/* Difference */}
                <div className="text-center pt-2 border-t border-purple-200">
                  <div className={`text-lg font-bold ${monthlyDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {monthlyDifference > 0 ? '+' : ''}{formatPrice(Math.abs(monthlyDifference))}/mois
                  </div>
                  <div className="text-xs text-gray-600">
                    {monthlyDifference > 0 ? 'Coût supplémentaire' : 'Économie'} mensuelle
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    ({yearlyDifference > 0 ? '+' : ''}{formatPrice(Math.abs(yearlyDifference))}/an)
                  </div>
                </div>

                {/* Prorated Amount Preview */}
                {applyImmediately && proratedAmount !== null && Math.abs(proratedAmount) > 0.1 && (
                  <Alert className="border-orange-200 bg-orange-50">
                    <Info className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-sm text-orange-900">
                      <div className="font-semibold mb-1">💳 Montant proratisé estimé</div>
                      <div className="text-xs space-y-0.5">
                        <p>Vous serez {proratedAmount > 0 ? 'facturé' : 'crédité'} d'environ <strong>{formatPrice(Math.abs(proratedAmount))}</strong> aujourd'hui.</p>
                        <p className="text-orange-700">Ce montant correspond à la période restante jusqu'au {currentPeriodEnd ? format(new Date(currentPeriodEnd), 'dd MMM yyyy', { locale: fr }) : 'prochain renouvellement'}.</p>
                        <p className="text-orange-600 text-xs italic mt-1">
                          ⓘ Ceci est une estimation approximative. Le montant exact sera calculé par Stripe et peut légèrement différer.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Billing Period Change Warning */}
                {applyImmediately && isBillingPeriodChanging && (
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-sm text-blue-900">
                      <div className="font-semibold mb-1">ℹ️ Changement de période de facturation</div>
                      <div className="text-xs space-y-0.5">
                        <p>Vous changez de {currentBillingPeriodValue === 'monthly' ? 'mensuel' : 'annuel'} à {billingPeriod === 'monthly' ? 'mensuel' : 'annuel'}.</p>
                        <p className="text-blue-700">Stripe va automatiquement :</p>
                        <ul className="list-disc ml-4 text-blue-700">
                          <li>Créditer le temps non utilisé de votre période actuelle</li>
                          <li>Facturer la nouvelle période au prorata</li>
                        </ul>
                        <p className="text-blue-600 text-xs italic mt-1">
                          Le calcul exact de proration pour les changements de période est complexe et sera géré par Stripe.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Progressive Pricing Breakdown */}
          {breakdown.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Détail de la tarification</Label>
              <Card className="border-2 border-gray-200">
                <CardContent className="pt-4 space-y-2">
                  {breakdown.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-md bg-gray-50"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(tier.tierIndex)}`}>
                          {tier.tierLabel}
                        </div>
                        <span className="text-sm text-gray-600">
                          {tier.seats} siège{tier.seats > 1 ? 's' : ''} × {formatPrice(tier.pricePerSeat)}
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(tier.subtotal)}
                      </span>
                    </div>
                  ))}

                  <div className="h-px bg-gray-300 my-2" />

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-lg font-bold">Total</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatPrice(totalCost)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {billingPeriod === 'monthly' ? 'par mois' : 'par an'}
                      </div>
                    </div>
                  </div>

                  {billingPeriod === 'yearly' && (
                    <div className="text-xs text-center text-muted-foreground pt-1">
                      Soit {formatPrice(getMonthlyEquivalent(totalCost))}/mois
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Current Seats Info */}
          {currentSeats > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-700">Sièges actuels</span>
                <span className="font-bold text-gray-900">{currentSeats}</span>
              </div>
              {seatCount !== currentSeats && (
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-gray-700">Nouveaux sièges</span>
                  <span className="font-bold text-blue-600">{seatCount}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={isProcessing || seatCount === currentSeats || isReducingBelowActive}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing
                ? 'Traitement...'
                : currentSeats === 0
                  ? `Acheter ${seatCount} siège${seatCount > 1 ? 's' : ''}`
                  : `Modifier à ${seatCount} siège${seatCount > 1 ? 's' : ''}`
              }
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Vous serez redirigé vers Stripe pour finaliser le paiement sécurisé
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
