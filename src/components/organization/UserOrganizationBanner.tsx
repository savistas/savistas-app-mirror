import { AlertCircle, Building2, Check } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { B2B_STUDENT_LIMITS } from '@/constants/organizationPlans';

interface UserOrganizationBannerProps {
  organizationName: string;
  className?: string;
}

/**
 * Banner to inform users they're in an organization and
 * cannot purchase individual subscriptions
 *
 * Shows organization benefits (same for all B2B members)
 */
export function UserOrganizationBanner({
  organizationName,
  className = '',
}: UserOrganizationBannerProps) {
  return (
    <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
      <Building2 className="h-5 w-5 text-blue-600" />
      <AlertTitle className="text-blue-900 font-semibold flex items-center gap-2">
        Membre d'une organisation
      </AlertTitle>
      <AlertDescription className="text-blue-800 space-y-3">
        <p>
          Vous êtes membre de <strong>{organizationName}</strong> et bénéficiez
          déjà d'un abonnement d'organisation.
        </p>

        <div className="mt-3 space-y-2">
          <p className="font-semibold text-sm">Vos avantages inclus :</p>
          <ul className="space-y-1 text-sm">
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>{B2B_STUDENT_LIMITS.exercisesPerMonth} exercices</strong> par mois
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>{B2B_STUDENT_LIMITS.fichesPerMonth} fiches de révision</strong> par
                mois
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>{B2B_STUDENT_LIMITS.aiMinutesPerMonth} minutes Avatar IA</strong> par
                mois
              </span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Création de cours illimitée</strong>
              </span>
            </li>
          </ul>
        </div>

        <div className="flex items-start gap-2 mt-4 pt-3 border-t border-blue-200">
          <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm">
            Vous ne pouvez pas souscrire à un plan individuel car vous bénéficiez déjà de
            l'abonnement de votre organisation. Pour toute question sur votre abonnement,
            contactez l'administrateur de votre organisation.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
