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
      <div className="flex justify-center mb-6">
        <Tabs value={billingPeriod} onValueChange={(v) => setBillingPeriod(v as BillingPeriod)}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="monthly" className="relative">
              Mensuel
            </TabsTrigger>
            <TabsTrigger value="yearly" className="relative">
              Annuel
              {billingPeriod === 'yearly' && (
                <Badge className="ml-2 bg-green-500 text-white text-xs">
                  -20%
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const price = getPlanPrice(plan.id, billingPeriod);
          const priceId = getStripePriceId(plan.id, billingPeriod);
          const isCurrentPlan = currentPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular ? 'border-purple-500 border-2' : 'border-gray-200'
              } ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Populaire
                  </Badge>
                </div>
              )}

              {/* Current Plan Badge */}
              {isCurrentPlan && (
                <div className="absolute -top-2 right-3">
                  <Badge className="bg-blue-500 text-white text-xs">Actuel</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-3 pt-5">
                <Badge className={`${getPlanBadgeColor(plan.id)} w-fit mx-auto mb-2 text-xs`}>
                  {plan.name}
                </Badge>
                <CardTitle className="text-xl">{plan.displayName}</CardTitle>

                {/* Price */}
                <div className="mt-3">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatOrgPlanPrice(price)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {billingPeriod === 'monthly' ? 'par mois' : 'par an'}
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-xs text-green-600 font-medium mt-1">
                      Soit {formatOrgPlanPrice(price / 12)}/mois
                    </div>
                  )}
                </div>

                {/* Seat Range */}
                <div className="flex items-center justify-center gap-1 mt-3 text-xs font-medium text-gray-600">
                  <Users className="w-3 h-3" />
                  <span>
                    {plan.seatRange.min}-{plan.seatRange.max} utilisateurs
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-2 pt-0 pb-3 flex-1">
                {/* Key Features - Show only first 3 */}
                <div className="space-y-1.5">
                  {plan.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <Check className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600 leading-tight">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 3 && (
                    <div className="text-xs text-muted-foreground text-center pt-1">
                      + {plan.features.length - 3} autres fonctionnalités
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-3">
                <Button
                  className="w-full"
                  size="sm"
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
      <div className="mt-4 text-center text-xs text-muted-foreground">
        {billingPeriod === 'yearly' ? (
          <p>
            Abonnement annuel facturé en une fois • Renouvellement automatique • Annulation à tout moment
          </p>
        ) : (
          <p>
            Abonnement mensuel • Renouvellement automatique • Annulation à tout moment
          </p>
        )}
      </div>
    </div>
  );
}
