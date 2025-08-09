import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const subscriptions = [
  {
    id: "basic",
    name: "Basique",
    price: "Gratuit",
    duration: "",
    features: [
      "Accès aux cours de base",
      "5 quizz par mois",
      "Support communautaire"
    ],
    popular: false
  },
  {
    id: "premium",
    name: "Premium",
    price: "9,99€",
    duration: "/mois",
    features: [
      "Accès à tous les cours",
      "Quizz illimités",
      "Suivi personnalisé",
      "Support prioritaire",
      "Certificats"
    ],
    popular: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,99€",
    duration: "/mois",
    features: [
      "Tout du Premium",
      "Cours avancés exclusifs",
      "Sessions de tutorat",
      "Analyse détaillée",
      "Accès anticipé aux nouveautés"
    ],
    popular: false
  }
];

interface SubscriptionStepProps {
  selectedSubscription: string;
  onSubscriptionSelect: (subscriptionId: string) => void;
}

export const SubscriptionStep = ({ selectedSubscription, onSubscriptionSelect }: SubscriptionStepProps) => {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {subscriptions.map((subscription) => (
          <Card 
            key={subscription.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-lg border-2 relative",
              selectedSubscription === subscription.id 
                ? 'border-primary bg-primary/5 shadow-lg' 
                : 'border-border hover:border-primary/50',
              subscription.popular && "ring-2 ring-primary ring-opacity-20"
            )}
            onClick={() => onSubscriptionSelect(subscription.id)}
          >
            {subscription.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                  Populaire
                </span>
              </div>
            )}
            
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{subscription.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">
                {subscription.price}
                <span className="text-sm text-muted-foreground font-normal">
                  {subscription.duration}
                </span>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {subscription.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={selectedSubscription === subscription.id ? "default" : "outline"}
                className="w-full"
                onClick={() => onSubscriptionSelect(subscription.id)}
              >
                {selectedSubscription === subscription.id ? "Sélectionné" : "Choisir"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};