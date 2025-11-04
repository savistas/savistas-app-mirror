import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, Sparkles, Users } from 'lucide-react';
import {
  BillingPeriod,
  OrganizationPlanType,
  getOrganizationPlansArray,
  getPlanPrice,
  getStripePriceId,
  formatOrgPlanPrice,
  calculateYearlySavings,
} from '@/constants/organizationPlans';

interface OrganizationPlanSelectionProps {
  currentPlan?: OrganizationPlanType | null;
  organizationId: string;
  onSelectPlan: (priceId: string, planType: OrganizationPlanType, billingPeriod: BillingPeriod) => void;
  className?: string;
}

/**
 * Organization Plan Selection Component
 *
 * Displays all B2B plans with monthly/yearly billing options
 * Users can toggle between billing periods and select a plan
 */
export function OrganizationPlanSelection({
  currentPlan,
  organizationId,
  onSelectPlan,
  className = '',
}: OrganizationPlanSelectionProps) {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>('monthly');
  const plans = getOrganizationPlansArray();

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

  const getButtonText = (planType: OrganizationPlanType) => {
    if (currentPlan === planType) {
      return 'Plan actuel';
    }
    if (!currentPlan) {
      return 'Souscrire';
    }
    // Determine if upgrade or downgrade
    const planOrder: OrganizationPlanType[] = ['b2b_pro', 'b2b_max', 'b2b_ultra'];
    const currentIndex = planOrder.indexOf(currentPlan);
    const targetIndex = planOrder.indexOf(planType);

    if (targetIndex > currentIndex) {
      return 'Passer à ce plan';
    } else if (targetIndex < currentIndex) {
      return 'Rétrograder';
    }
    return 'Sélectionner';
  };

  // Calculate total yearly savings across all plans
  const totalYearlySavings = plans.reduce((sum, plan) => {
    return sum + calculateYearlySavings(plan.id);
  }, 0);

  return (
    <div className={className}>
      {/* Billing Period Toggle */}
      <div className="flex justify-center mb-8">
        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="monthly" className="relative">
              Mensuel
            </TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Annuel
              {totalYearlySavings > 0 && (
                <Badge className="ml-2 bg-green-500 text-white text-xs">
                  Économisez jusqu'à {formatOrgPlanPrice(totalYearlySavings)}/an
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => {
          const price = getPlanPrice(plan.id, billingPeriod);
          const priceId = getStripePriceId(plan.id, billingPeriod);
          const isCurrentPlan = currentPlan === plan.id;
          const yearlySavings = calculateYearlySavings(plan.id);

          return (
            <Card
              key={plan.id}
              className={`relative ${
                plan.popular ? 'border-purple-500 border-2 shadow-lg' : 'border-gray-200'
              } ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Populaire
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-blue-500 text-white">Plan actuel</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <Badge className={`${getPlanBadgeColor(plan.id)} w-fit mx-auto mb-2`}>
                  {plan.name}
                </Badge>
                <CardTitle className="text-2xl">{plan.displayName}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>

                {/* Price */}
                <div className="mt-4">
                  <div className="text-4xl font-bold text-gray-900">
                    {formatOrgPlanPrice(price)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {billingPeriod === 'monthly' ? 'par mois' : 'par an'}
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Soit {formatOrgPlanPrice(price / 12)}/mois
                    </div>
                  )}
                  {billingPeriod === 'yearly' && yearlySavings > 0 && (
                    <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">
                      Économisez {formatOrgPlanPrice(yearlySavings)}/an
                    </Badge>
                  )}
                </div>

                {/* Seat Range */}
                <div className="flex items-center justify-center gap-2 mt-4 text-sm font-semibold text-gray-700">
                  <Users className="w-4 h-4" />
                  <span>
                    {plan.seatRange.min} à {plan.seatRange.max} utilisateurs
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                {/* Features List */}
                <div className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : plan.popular ? 'default' : 'secondary'}
                  disabled={isCurrentPlan}
                  onClick={() => onSelectPlan(priceId, plan.id, billingPeriod)}
                >
                  {getButtonText(plan.id)}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Billing Period Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        {billingPeriod === 'yearly' ? (
          <p>
            Les abonnements annuels sont facturés en une seule fois et se renouvellent
            automatiquement chaque année.
          </p>
        ) : (
          <p>
            Les abonnements mensuels se renouvellent automatiquement chaque mois. Vous pouvez
            annuler à tout moment.
          </p>
        )}
      </div>
    </div>
  );
}
