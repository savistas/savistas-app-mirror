import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { PlanDetailsDialog } from "@/components/subscription/PlanDetailsDialog";

const subscriptions = [
  {
    id: "basic",
    name: "Basique",
    price: "Gratuit",
    duration: "",
    features: [],
    aiModel: "basique",
    storage: "limité",
    tokens: "faible",
    speed: "standard",
    popular: false
  },
  {
    id: "premium",
    name: "Premium",
    price: "9,99€",
    duration: "/mois",
    features: [],
    aiModel: "avancé",
    storage: "modéré",
    tokens: "moyen",
    speed: "prioritaire",
    popular: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,99€",
    duration: "/mois",
    features: [],
    aiModel: "pro",
    storage: "illimité",
    tokens: "illimité",
    speed: "ultra prioritaire",
    popular: false
  }
];

interface SubscriptionStepProps {
  selectedSubscription: string;
  onSubscriptionSelect: (subscriptionId: string) => void;
}

export const SubscriptionStep = ({ selectedSubscription, onSubscriptionSelect }: SubscriptionStepProps) => {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<'premium' | 'pro'>('premium');

  const handlePlanClick = (subscription: typeof subscriptions[0]) => {
    if (subscription.price === "Gratuit") {
      // Free plan: just select it
      onSubscriptionSelect(subscription.id);
    } else {
      // Paid plan: open upgrade dialog
      setSelectedPlanForUpgrade(subscription.id as 'premium' | 'pro');
      setShowUpgradeDialog(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Choisissez votre abonnement
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez l'offre qui correspond à vos besoins
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        {subscriptions.map((subscription) => (
          <Card 
            key={subscription.id}
            className={cn(
              "rounded-2xl hover-scale transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 relative flex flex-col cursor-pointer group",
              selectedSubscription === subscription.id
                ? 'border-primary bg-primary/5 shadow-lg'
                : 'border-border hover:border-primary/50 hover:bg-primary/5',
              subscription.popular && "ring-2 ring-primary ring-opacity-20"
            )}
            onClick={() => handlePlanClick(subscription)}
          >
            {subscription.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <CardTitle className={cn("text-xl", subscription.price !== "Gratuit" && "group-hover:blur-sm transition-all duration-300")}>{subscription.name}</CardTitle>
              <div className={cn(
                "text-3xl font-bold",
                subscription.price === "Gratuit" ? "text-primary" : "text-muted-foreground",
                subscription.price !== "Gratuit" && "group-hover:blur-sm transition-all duration-300"
              )}>
                {subscription.price}
                <span className="text-sm text-muted-foreground font-normal">
                  {subscription.duration}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4 flex-grow flex flex-col justify-between"> {/* Added flex-grow and justify-between */}
              <ul className="space-y-3">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className={cn("text-sm text-foreground", subscription.price !== "Gratuit" && "group-hover:blur-sm transition-all duration-300")}>Modèle IA: {subscription.aiModel}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className={cn("text-sm text-foreground", subscription.price !== "Gratuit" && "group-hover:blur-sm transition-all duration-300")}>Stockage: {subscription.storage}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className={cn("text-sm text-foreground", subscription.price !== "Gratuit" && "group-hover:blur-sm transition-all duration-300")}>Tokens: {subscription.tokens}</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-success" />
                  <span className={cn("text-sm text-foreground", subscription.price !== "Gratuit" && "group-hover:blur-sm transition-all duration-300")}>Rapidité: {subscription.speed}</span>
                </li>
              </ul>
              
              <Button
                variant={selectedSubscription === subscription.id ? "default" : "outline"}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanClick(subscription);
                }}
              >
                {subscription.price === "Gratuit"
                  ? (selectedSubscription === subscription.id ? "Sélectionné" : "Choisir")
                  : "Souscrire"
                }
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plan Details Dialog for Premium/Pro plans */}
      <PlanDetailsDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        plan={selectedPlanForUpgrade}
      />
    </div>
  );
};
