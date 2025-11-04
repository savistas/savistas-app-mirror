import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles } from "lucide-react";
import { useState } from "react";
import { PlanDetailsDialog } from "./PlanDetailsDialog";

interface PlanSelectionCardsProps {
  currentPlan: 'basic' | 'premium' | 'pro';
}

const PLANS = [
  {
    id: 'premium' as const,
    name: 'Premium',
    price: '9,90€',
    color: 'blue',
    icon: Crown,
    popular: true,
    features: [
      '10 cours par mois',
      '10 exercices par mois',
      '10 fiches de révision par mois',
      'Achats de minutes IA disponibles',
      '10 jours max par cours',
    ],
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '19,90€',
    color: 'purple',
    icon: Sparkles,
    popular: false,
    features: [
      '30 cours par mois',
      '30 exercices par mois',
      '30 fiches de révision par mois',
      'Achats de minutes IA disponibles',
      '10 jours max par cours',
      'Support prioritaire',
    ],
  },
];

export const PlanSelectionCards = ({ currentPlan }: PlanSelectionCardsProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'pro' | null>(null);

  const getCardBorderColor = (planId: string, color: string) => {
    if (planId === currentPlan) return 'border-green-500 bg-green-50/50';
    if (color === 'blue') return 'border-blue-200 hover:border-blue-400';
    if (color === 'purple') return 'border-purple-200 hover:border-purple-400';
    return 'border-gray-200';
  };

  const getButtonColor = (color: string) => {
    if (color === 'blue') return 'bg-blue-600 hover:bg-blue-700';
    if (color === 'purple') return 'bg-purple-600 hover:bg-purple-700';
    return '';
  };

  // Filter plans based on current plan
  const availablePlans = PLANS.filter(plan => {
    if (currentPlan === 'basic') return true;
    if (currentPlan === 'premium') return plan.id === 'pro';
    return false; // If pro, show no plans
  });

  if (currentPlan === 'pro') {
    return (
      <div className="text-center py-8">
        <Crown className="w-12 h-12 mx-auto text-purple-600 mb-4" />
        <h3 className="text-xl font-semibold mb-2">Vous êtes sur le plan Pro!</h3>
        <p className="text-muted-foreground">
          Vous bénéficiez déjà du meilleur plan disponible.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Plans disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availablePlans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;

            return (
              <Card
                key={plan.id}
                className={`relative transition-all ${getCardBorderColor(plan.id, plan.color)} border-2`}
              >
                {plan.popular && !isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 hover:bg-blue-700">
                      Populaire
                    </Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 hover:bg-green-700">
                      Plan actuel
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-6 h-6 text-${plan.color}-600`} />
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-3xl font-bold text-foreground">
                    {plan.price}
                    <span className="text-sm font-normal text-muted-foreground">/mois</span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => setSelectedPlan(plan.id)}
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan}
                    className={`w-full ${!isCurrentPlan ? getButtonColor(plan.color) : ''}`}
                  >
                    {isCurrentPlan ? 'Plan actuel' : 'Voir plus'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedPlan && (
        <PlanDetailsDialog
          open={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
        />
      )}
    </>
  );
};
