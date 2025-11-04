import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Crown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { UpgradeDialog } from "./UpgradeDialog";

interface LimitReachedDialogProps {
  open: boolean;
  onClose: () => void;
  resourceType: 'course' | 'exercise' | 'fiche' | 'ai_minutes';
  currentPlan: 'basic' | 'premium' | 'pro';
  current: number;
  limit: number;
}

const RESOURCE_LABELS = {
  course: 'cours',
  exercise: 'exercice',
  fiche: 'fiche de révision',
  ai_minutes: 'minutes avec l\'avatar IA',
};

const RESOURCE_ICONS = {
  course: '📚',
  exercise: '📝',
  fiche: '📄',
  ai_minutes: '🤖',
};

export const LimitReachedDialog = ({
  open,
  onClose,
  resourceType,
  currentPlan,
  current,
  limit,
}: LimitReachedDialogProps) => {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  const resourceLabel = RESOURCE_LABELS[resourceType];
  const resourceIcon = RESOURCE_ICONS[resourceType];

  const getUpgradeMessage = () => {
    if (resourceType === 'ai_minutes' && currentPlan !== 'basic') {
      return {
        title: 'Minutes avatar IA épuisées',
        description: `Vous avez utilisé toutes vos ${limit} minutes disponibles ce mois-ci. Vous pouvez acheter des packs de minutes supplémentaires qui ne s'expireront jamais.`,
        action: 'Acheter des minutes IA',
      };
    }

    const planLimits = {
      basic: { courses: 2, exercises: 2, fiches: 2 },
      premium: { courses: 10, exercises: 10, fiches: 10 },
      pro: { courses: 30, exercises: 30, fiches: 30 },
    };

    const nextPlan = currentPlan === 'basic' ? 'premium' : 'pro';
    const nextLimit =
      nextPlan === 'premium'
        ? planLimits.premium[resourceType as keyof typeof planLimits.premium]
        : planLimits.pro[resourceType as keyof typeof planLimits.pro];

    return {
      title: `Limite de ${resourceLabel} atteinte`,
      description: `Vous avez atteint votre limite de ${limit} ${resourceLabel}${limit > 1 ? 's' : ''} pour ce mois-ci. Passez au plan ${nextPlan === 'premium' ? 'Premium' : 'Pro'} pour créer jusqu'à ${nextLimit} ${resourceLabel}${nextLimit > 1 ? 's' : ''} par mois!`,
      action: `Passer à ${nextPlan === 'premium' ? 'Premium' : 'Pro'}`,
    };
  };

  const message = getUpgradeMessage();

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{resourceIcon}</span>
              {message.title}
            </DialogTitle>
            <DialogDescription>{message.description}</DialogDescription>
          </DialogHeader>

          <Alert variant="default" className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>Utilisation actuelle:</strong> {current} / {limit}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm">
              <TrendingUp className="w-4 h-4 mt-0.5 text-blue-600" />
              <p className="text-muted-foreground">
                {currentPlan === 'basic'
                  ? 'Les utilisateurs Premium ont accès à 10x plus de ressources par mois'
                  : currentPlan === 'premium'
                  ? 'Les utilisateurs Pro ont accès à 3x plus de ressources par mois'
                  : 'Vous êtes déjà sur le plan le plus élevé!'}
              </p>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
              Fermer
            </Button>
            {(currentPlan !== 'pro' || resourceType === 'ai_minutes') && (
              <Button
                onClick={() => {
                  setShowUpgradeDialog(true);
                  onClose();
                }}
                className="w-full sm:w-auto"
              >
                <Crown className="w-4 h-4 mr-2" />
                {message.action}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UpgradeDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        currentPlan={currentPlan}
      />
    </>
  );
};
