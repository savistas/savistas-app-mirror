import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Check, Users, BookOpen, FileText, Bot, Sparkles } from 'lucide-react';
import { getOrganizationPlansArray, formatOrgPlanPrice } from '@/constants/organizationPlans';

interface OrganizationPlanDetailsDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Detailed comparison dialog for all B2B organization plans
 *
 * Shows comprehensive feature comparison:
 * - Pricing (monthly and yearly)
 * - Seat capacity
 * - Per-student limits
 * - All included features
 *
 * Used for helping admins choose the right plan
 */
export function OrganizationPlanDetailsDialog({
  open,
  onClose,
}: OrganizationPlanDetailsDialogProps) {
  const plans = getOrganizationPlansArray();

  const getPlanBadgeColor = (planId: string) => {
    switch (planId) {
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Comparaison des plans B2B</DialogTitle>
          <DialogDescription>
            Choisissez le plan qui correspond le mieux aux besoins de votre organisation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Plans Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border-2 rounded-lg p-6 space-y-4 ${
                  plan.popular ? 'border-purple-500 bg-purple-50/30' : 'border-gray-200'
                }`}
              >
                {/* Header */}
                <div className="text-center space-y-2">
                  {plan.popular && (
                    <Badge className="bg-purple-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Populaire
                    </Badge>
                  )}
                  <Badge className={`${getPlanBadgeColor(plan.id)} text-base px-3 py-1`}>
                    {plan.displayName}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center space-y-1 py-4 border-y">
                  <div className="text-3xl font-bold">
                    {formatOrgPlanPrice(plan.pricing.monthly.price)}
                  </div>
                  <p className="text-sm text-muted-foreground">par mois</p>
                  <p className="text-xs text-muted-foreground">
                    ou {formatOrgPlanPrice(plan.pricing.yearly.price)}/an
                  </p>
                </div>

                {/* Capacity */}
                <div className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-700 bg-blue-50 p-3 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span>
                    {plan.seatRange.min} à {plan.seatRange.max} membres
                  </span>
                </div>

                {/* Per-Student Limits */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Par étudiant / mois
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-green-600" />
                      <span>Cours illimités</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>{plan.perStudentLimits.exercisesPerMonth} exercices</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span>{plan.perStudentLimits.fichesPerMonth} fiches</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-orange-600" />
                      <span>{plan.perStudentLimits.aiMinutesPerMonth} min IA</span>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">
                    Fonctionnalités
                  </p>
                  <div className="space-y-1">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold">📋 À savoir :</p>
            <ul className="space-y-1 text-muted-foreground ml-4">
              <li>• Les limites sont <strong className="text-foreground">par étudiant</strong>, chaque membre a son propre quota mensuel</li>
              <li>• Les quotas se réinitialisent à chaque date anniversaire de souscription</li>
              <li>• Les changements de plan sont proratisés automatiquement</li>
              <li>• Les réductions automatiques s'appliquent si le nombre de membres diminue</li>
              <li>• Vous pouvez annuler à tout moment, l'accès reste actif jusqu'à la fin de la période</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
