import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Users, CreditCard, Check } from 'lucide-react';
import { OrganizationPlanType, BillingPeriod, getSeatPrice, calculateSeatCost, formatOrgPlanPrice, ORGANIZATION_PLANS, getMonthlySeatCost } from '@/constants/organizationPlans';
import { toast } from 'sonner';

interface SeatPurchaseModalProps {
  open: boolean;
  onClose: () => void;
  organizationId: string;
  currentPlan: OrganizationPlanType;
  currentSeats: number;
  onPurchaseSeats: (seatCount: number, billingPeriod: BillingPeriod) => Promise<void>;
}

/**
 * Modal for purchasing organization seats with slider selection
 *
 * Features:
 * - Interactive slider for seat count selection
 * - Monthly/Yearly billing toggle
 * - Real-time cost calculation
 * - Plan-specific seat limits enforcement
 */
export function SeatPurchaseModal({
  open,
  onClose,
  organizationId,
  currentPlan,
  currentSeats,
  onPurchaseSeats,
}: SeatPurchaseModalProps) {
  const plan = ORGANIZATION_PLANS[currentPlan];
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const [seatCount, setSeatCount] = useState<number>(Math.max(1, plan.seatRange.min));
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate pricing
  const pricePerSeat = getSeatPrice(currentPlan, billingPeriod);
  const totalCost = calculateSeatCost(currentPlan, billingPeriod, seatCount);
  const monthlyCostPerSeat = getMonthlySeatCost(currentPlan, billingPeriod);

  // Handle seat purchase
  const handlePurchase = async () => {
    if (seatCount < plan.seatRange.min || seatCount > plan.seatRange.max) {
      toast.error(`Le nombre de sièges doit être entre ${plan.seatRange.min} et ${plan.seatRange.max} pour le plan ${plan.name}`);
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

  // Savings calculation for yearly
  const yearlySavings = billingPeriod === 'yearly'
    ? (getSeatPrice(currentPlan, 'monthly') * 12 - getSeatPrice(currentPlan, 'yearly')) * seatCount
    : 0;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Acheter des sièges - Plan {plan.name}
          </DialogTitle>
          <DialogDescription>
            Déverrouillez la capacité de votre organisation en achetant des sièges supplémentaires
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">Sièges actuels</span>
                <span className="font-bold text-blue-900">{currentSeats}</span>
              </div>
            </CardContent>
          </Card>

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
                  flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${billingPeriod === 'monthly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <div>
                    <div className="font-semibold">Mensuel</div>
                    <div className="text-xs text-muted-foreground">
                      {formatOrgPlanPrice(getSeatPrice(currentPlan, 'monthly'))}/siège/mois
                    </div>
                  </div>
                </div>
              </Label>

              <Label
                htmlFor="yearly"
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${billingPeriod === 'yearly' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <div>
                    <div className="font-semibold">Annuel</div>
                    <div className="text-xs text-muted-foreground">
                      {formatOrgPlanPrice(getSeatPrice(currentPlan, 'yearly'))}/siège/an
                    </div>
                  </div>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Seat Count Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Nombre de sièges</Label>
              <div className="text-2xl font-bold text-blue-600">{seatCount}</div>
            </div>

            <Slider
              value={[seatCount]}
              onValueChange={(values) => setSeatCount(values[0])}
              min={plan.seatRange.min}
              max={plan.seatRange.max}
              step={1}
              className="w-full"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Min: {plan.seatRange.min}</span>
              <span>Max: {plan.seatRange.max}</span>
            </div>
          </div>

          {/* Cost Breakdown */}
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Prix par siège</span>
                <span className="font-semibold">
                  {formatOrgPlanPrice(pricePerSeat)}{billingPeriod === 'monthly' ? '/mois' : '/an'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Nombre de sièges</span>
                <span className="font-semibold">× {seatCount}</span>
              </div>

              {billingPeriod === 'yearly' && yearlySavings > 0 && (
                <div className="flex items-center justify-between text-green-600 bg-green-50 -mx-4 px-4 py-2">
                  <span className="text-sm font-medium">Économies annuelles</span>
                  <span className="font-bold">{formatOrgPlanPrice(yearlySavings)}</span>
                </div>
              )}

              <div className="h-px bg-gray-300 -mx-4" />

              <div className="flex items-center justify-between pt-2">
                <span className="text-base font-bold">Total</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatOrgPlanPrice(totalCost)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {billingPeriod === 'monthly' ? 'par mois' : 'par an'}
                  </div>
                </div>
              </div>

              {billingPeriod === 'yearly' && (
                <div className="text-xs text-center text-muted-foreground pt-1">
                  Soit {formatOrgPlanPrice(totalCost / 12)}/mois
                </div>
              )}
            </CardContent>
          </Card>

          {/* Benefits */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="font-semibold text-sm mb-3">Ce que vous obtenez :</div>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{seatCount} sièges</strong> pour vos membres</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{plan.perStudentLimits.exercisesPerMonth} exercices</strong> par étudiant/mois</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{plan.perStudentLimits.fichesPerMonth} fiches</strong> par étudiant/mois</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>{plan.perStudentLimits.aiMinutesPerMonth} min IA</strong> par étudiant/mois</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Cours illimités</strong></span>
              </div>
            </div>
          </div>

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
              disabled={isProcessing}
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
