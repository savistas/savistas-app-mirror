import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { PlanDetailsDialog } from "./PlanDetailsDialog";
import { UnsubscribeConfirmDialog } from "./UnsubscribeConfirmDialog";

interface PlanSelectionCardsProps {
  currentPlan: 'basic' | 'premium' | 'pro';
}

const PLANS = [
  {
    id: 'basic' as const,
    name: 'Basique',
    price: 'Gratuit',
    color: 'gray',
    icon: Check,
    popular: false,
    features: [
      '2 cours par mois',
      '2 exercices par mois',
      '2 fiches de révision par mois',
      '3 minutes Avatar IA par mois',
      '10 jours max par cours',
    ],
  },
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
      '0 minutes Avatar IA incluses',
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
      '0 minutes Avatar IA incluses',
      'Achats de minutes IA disponibles',
      '10 jours max par cours',
      'Support prioritaire',
    ],
  },
];

export const PlanSelectionCards = ({ currentPlan }: PlanSelectionCardsProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'pro' | null>(null);
  const [showUnsubscribeDialog, setShowUnsubscribeDialog] = useState(false);

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

  // Show all plans (including current plan)
  const availablePlans = PLANS;

  const getButtonText = (planId: string) => {
    // Current plan
    if (planId === currentPlan) {
      return 'Plan actuel';
    }

    // Downgrade to basic
    if (currentPlan !== 'basic' && planId === 'basic') {
      return 'Se désabonner';
    }

    // Upgrade from basic
    if (currentPlan === 'basic' && planId !== 'basic') {
      return 'Souscrire';
    }

    // Upgrade from premium to pro
    if (currentPlan === 'premium' && planId === 'pro') {
      return 'Passer à Pro';
    }

    // Downgrade from pro to premium
    if (currentPlan === 'pro' && planId === 'premium') {
      return 'Passer à Premium';
    }

    return 'Choisir';
  };

  const handlePlanClick = (planId: typeof PLANS[number]['id']) => {
    // If clicking on current plan, do nothing
    if (planId === currentPlan) {
      return;
    }

    // If downgrading to basic, show confirmation dialog
    if (currentPlan !== 'basic' && planId === 'basic') {
      setShowUnsubscribeDialog(true);
    } else if (planId !== 'basic') {
      // For all paid plans (upgrades and downgrades)
      setSelectedPlan(planId as 'premium' | 'pro');
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Plans disponibles</h3>
          <p className="text-sm text-muted-foreground">
            Choisissez le plan qui correspond à vos besoins
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    onClick={() => handlePlanClick(plan.id)}
                    disabled={plan.id === currentPlan}
                    variant={plan.id === 'basic' && currentPlan !== 'basic' ? "destructive" : "default"}
                    className={`w-full ${plan.id !== 'basic' && plan.id !== currentPlan ? getButtonColor(plan.color) : ''}`}
                  >
                    {getButtonText(plan.id)}
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
          currentPlan={currentPlan}
        />
      )}

      <UnsubscribeConfirmDialog
        open={showUnsubscribeDialog}
        onClose={() => setShowUnsubscribeDialog(false)}
        currentPlan={currentPlan}
      />
    </>
  );
};
