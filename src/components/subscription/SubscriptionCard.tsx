import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Crown, Calendar, TrendingUp, BookOpen, FileText, Bot, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useState, useEffect } from "react";
import { PlanSelectionCards } from "./PlanSelectionCards";
import { UpgradeDialog } from "./UpgradeDialog";
import { CheckoutPendingState } from "./CheckoutPendingState";
import { hasActiveCheckoutSession } from "@/lib/checkoutSession";

export const SubscriptionCard = () => {
  const { subscription, limits, isLoading, refetch } = useSubscription();
  const { usage, remaining } = useUsageLimits();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);

  // Check for pending checkout session on mount and when localStorage changes
  useEffect(() => {
    const checkPendingSession = () => {
      setHasPendingCheckout(hasActiveCheckoutSession());
    };

    checkPendingSession();

    // Listen for storage events (in case checkout is started in another tab)
    window.addEventListener('storage', checkPendingSession);
    return () => window.removeEventListener('storage', checkPendingSession);
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Abonnement</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!subscription || !limits) {
    return null;
  }

  const getPlanBadgeColor = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'premium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'pro':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getPlanName = (plan: string) => {
    switch (plan) {
      case 'basic':
        return 'Basique';
      case 'premium':
        return 'Premium';
      case 'pro':
        return 'Pro';
      case 'organization':
        return 'Organisation';
      default:
        return plan;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  const calculatePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const handleCancelCheckout = () => {
    // Update state when checkout is canceled
    setHasPendingCheckout(false);
    refetch(); // Refresh subscription data
  };

  return (
    <>
      {/* Show pending checkout state if active */}
      {hasPendingCheckout && (
        <CheckoutPendingState onCancel={handleCancelCheckout} />
      )}

      <Card className="border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              <CardTitle>Mon Abonnement</CardTitle>
            </div>
            <Badge className={getPlanBadgeColor(subscription.plan)}>
              {getPlanName(subscription.plan)}
            </Badge>
          </div>
          <CardDescription>
            Gérez votre abonnement et consultez vos limites d'utilisation
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Renewal Date */}
          {subscription.current_period_end && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>
                Prochain renouvellement le{' '}
                {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
          )}

          {/* Usage Stats */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <h4 className="font-semibold">Utilisation mensuelle</h4>
            </div>

            {/* Courses */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  <span>Cours générés</span>
                </div>
                <span className="font-medium">
                  {limits.isUnlimited ? 'Illimité' : `${usage?.courses_created || 0} / ${limits.courses}`}
                </span>
              </div>
              {!limits.isUnlimited && (
                <>
                  <Progress
                    value={calculatePercentage(usage?.courses_created || 0, limits.courses)}
                    className="h-2"
                    indicatorClassName={getProgressColor(calculatePercentage(usage?.courses_created || 0, limits.courses))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {remaining?.courses || 0} cours restants ce mois-ci
                  </p>
                </>
              )}
              {limits.isUnlimited && (
                <p className="text-xs text-green-600 font-medium">
                  Création illimitée de cours
                </p>
              )}
            </div>

            {/* Exercises */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span>Exercices créés</span>
                </div>
                <span className="font-medium">
                  {limits.isUnlimited ? 'Illimité' : `${usage?.exercises_created || 0} / ${limits.exercises}`}
                </span>
              </div>
              {!limits.isUnlimited && (
                <>
                  <Progress
                    value={calculatePercentage(usage?.exercises_created || 0, limits.exercises)}
                    className="h-2"
                    indicatorClassName={getProgressColor(calculatePercentage(usage?.exercises_created || 0, limits.exercises))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {remaining?.exercises || 0} exercices restants ce mois-ci
                  </p>
                </>
              )}
              {limits.isUnlimited && (
                <p className="text-xs text-green-600 font-medium">
                  Création illimitée d'exercices
                </p>
              )}
            </div>

            {/* Fiches */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span>Fiches de révision</span>
                </div>
                <span className="font-medium">
                  {limits.isUnlimited ? 'Illimité' : `${usage?.fiches_created || 0} / ${limits.fiches}`}
                </span>
              </div>
              {!limits.isUnlimited && (
                <>
                  <Progress
                    value={calculatePercentage(usage?.fiches_created || 0, limits.fiches)}
                    className="h-2"
                    indicatorClassName={getProgressColor(calculatePercentage(usage?.fiches_created || 0, limits.fiches))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {remaining?.fiches || 0} fiches restantes ce mois-ci
                  </p>
                </>
              )}
              {limits.isUnlimited && (
                <p className="text-xs text-green-600 font-medium">
                  Création illimitée de fiches
                </p>
              )}
            </div>

            {/* AI Minutes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-orange-500" />
                  <span>Minutes Avatar IA</span>
                </div>
                <span className="font-medium">
                  {limits.isUnlimited ? 'Illimité' : `${usage?.ai_minutes_used || 0} / ${limits.aiMinutes} min`}
                </span>
              </div>
              {!limits.isUnlimited && (
                <>
                  <Progress
                    value={calculatePercentage(usage?.ai_minutes_used || 0, limits.aiMinutes)}
                    className="h-2"
                    indicatorClassName={getProgressColor(calculatePercentage(usage?.ai_minutes_used || 0, limits.aiMinutes))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {remaining?.aiMinutes || 0} minutes restantes
                    {subscription.ai_minutes_purchased > 0 && (
                      <span className="text-green-600 ml-1">
                        ({subscription.ai_minutes_purchased} min achetées)
                      </span>
                    )}
                  </p>
                </>
              )}
              {limits.isUnlimited && (
                <p className="text-xs text-green-600 font-medium">
                  Utilisation illimitée de l'Avatar IA
                </p>
              )}
            </div>

            {/* Max Days per Course */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Jours maximum par cours</span>
              </div>
              <span className="font-medium">{limits.maxDaysPerCourse} jours</span>
            </div>
          </div>

          {/* Buy AI Minutes Button - Hidden for organization members */}
          {!limits.isUnlimited && (
            <Button
              onClick={() => setShowUpgradeDialog(true)}
              variant="outline"
              className="w-full"
            >
              <Bot className="w-4 h-4 mr-2" />
              Acheter des minutes IA
            </Button>
          )}

          {/* Note for organization members */}
          {limits.isUnlimited && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 font-medium">
                Votre abonnement est géré par votre organisation. Vous bénéficiez d'un accès illimité à toutes les fonctionnalités.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan Selection Cards - Hidden for organization members */}
      {!limits.isUnlimited && <PlanSelectionCards currentPlan={subscription.plan} />}

      {/* AI Minutes Purchase Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        currentPlan={subscription.plan}
      />
    </>
  );
};
