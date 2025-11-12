import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Mail, LogOut, CheckCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ActiveOrganizationInfoProps {
  organizationName: string;
  adminEmail: string;
  onLeaveOrganization: () => void;
  isLeaving?: boolean;
}

export function ActiveOrganizationInfo({
  organizationName,
  adminEmail,
  onLeaveOrganization,
  isLeaving = false
}: ActiveOrganizationInfoProps) {
  return (
    <Card className="mb-8 border-l-4 border-l-blue-500 shadow-sm">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900">
                  {organizationName}
                </h3>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  <CheckCircle className="w-3 h-3" />
                  <span>Membre actif</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Mail className="w-4 h-4" />
                <span>Contact : <span className="font-medium">{adminEmail}</span></span>
              </div>

              <p className="text-xs text-slate-500">
                Votre abonnement et vos accès sont gérés par votre organisation
              </p>
            </div>
          </div>

          <div className="flex-shrink-0">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-300 text-slate-700 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
                  disabled={isLeaving}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLeaving ? 'Départ en cours...' : 'Quitter'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Quitter l'organisation</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3 pt-2">
                    <p>
                      Êtes-vous sûr de vouloir quitter <strong className="text-slate-900">{organizationName}</strong> ?
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                      <p className="text-sm font-medium text-amber-900">⚠️ Conséquences :</p>
                      <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                        <li>Perte d'accès aux ressources et avantages de l'organisation</li>
                        <li>Restauration de votre abonnement personnel précédent</li>
                        <li>Possibilité de rejoindre à nouveau avec un code</li>
                      </ul>
                      <div className="bg-blue-50 border border-blue-200 rounded px-2 py-1.5 mt-2">
                        <p className="text-xs text-blue-800">
                          <strong>Note :</strong> Si vous aviez un abonnement payant avant de rejoindre l'organisation, il sera restauré. Sinon, vous repasserez à l'abonnement gratuit.
                        </p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onLeaveOrganization}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Quitter l'organisation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
