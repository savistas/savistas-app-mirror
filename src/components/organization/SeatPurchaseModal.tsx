import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CreditCard, TrendingDown, Info } from 'lucide-react';
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
  onPurchaseSeats: (seatCount: number, billingPeriod: BillingPeriod) => Promise<void>;
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
  onPurchaseSeats,
}: SeatPurchaseModalProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [seatCount, setSeatCount] = useState<number>(Math.max(MIN_SEATS, currentSeats || 1));
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate pricing
  const totalCost = calculateSeatCost(seatCount, billingPeriod);
  const breakdown = calculateProgressivePricing(seatCount, billingPeriod);

  // Calculate yearly savings
  const monthlyCost = calculateSeatCost(seatCount, 'monthly');
  const yearlyCost = calculateSeatCost(seatCount, 'yearly');
  const yearlySavings = (monthlyCost * 12) - yearlyCost;

  // Handle seat purchase
  const handlePurchase = async () => {
    if (seatCount < MIN_SEATS || seatCount > MAX_SEATS) {
      toast.error(`Le nombre de sièges doit être entre ${MIN_SEATS} et ${MAX_SEATS}`);
      return;
    }

    setIsProcessing(true);
    try {
      await onPurchaseSeats(seatCount, billingPeriod);
      // Don't close here - the checkout redirect will happen
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
              disabled={isProcessing || seatCount === currentSeats}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isProcessing ? 'Redirection...' : `Acheter ${seatCount} siège${seatCount > 1 ? 's' : ''}`}
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
