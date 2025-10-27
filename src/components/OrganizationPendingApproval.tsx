import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Clock } from 'lucide-react';

interface OrganizationPendingApprovalProps {
  organizationName: string;
}

export function OrganizationPendingApproval({ organizationName }: OrganizationPendingApprovalProps) {
  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <Alert className="border-orange-200 bg-orange-50">
        <Clock className="h-5 w-5 text-orange-600" />
        <AlertDescription className="text-orange-900">
          <div className="space-y-3">
            <p className="font-semibold text-lg">
              Demande en attente de validation
            </p>
            <p>
              Votre demande d'adhésion à <strong>{organizationName}</strong> a été envoyée avec succès.
            </p>
            <p>
              Vous ne pouvez pas encore accéder aux autres pages de la plateforme.
              L'organisation doit d'abord approuver votre demande.
            </p>
            <p className="text-sm">
              Vous recevrez une notification par email une fois que votre demande aura été approuvée.
            </p>
          </div>
        </AlertDescription>
      </Alert>

      <div className="mt-6 p-6 bg-white border rounded-lg">
        <h3 className="font-semibold text-lg mb-3">En attendant...</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Vous pouvez modifier votre profil à tout moment</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>L'accès au tableau de bord sera débloqué après validation</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Votre abonnement sera géré par votre organisation</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
