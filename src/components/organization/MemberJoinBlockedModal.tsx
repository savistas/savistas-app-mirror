import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Building2, Users, Mail } from 'lucide-react';

interface MemberJoinBlockedModalProps {
  organizationName: string;
  currentMembers: number;
  seatLimit: number;
  open: boolean;
  onClose: () => void;
}

/**
 * Modal shown to users who try to join a full organization
 *
 * Informs the user that:
 * - Organization has reached capacity
 * - They cannot join until org upgrades
 * - They should contact the organization admin
 *
 * Triggered when user uses join code for full organization
 */
export function MemberJoinBlockedModal({
  organizationName,
  currentMembers,
  seatLimit,
  open,
  onClose,
}: MemberJoinBlockedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            <DialogTitle className="text-xl">Impossible de rejoindre</DialogTitle>
          </div>
          <DialogDescription>
            Cette organisation a atteint sa capacité maximale
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Organization Info */}
          <Alert>
            <Building2 className="h-4 w-4" />
            <AlertTitle>Organisation</AlertTitle>
            <AlertDescription>
              <div className="space-y-2 mt-2">
                <p className="font-medium">{organizationName}</p>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4" />
                  <span>
                    Capacité : <span className="font-mono font-bold">{currentMembers} / {seatLimit}</span> membres
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Explanation */}
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              <strong className="text-foreground">{organizationName}</strong> a atteint le nombre
              maximum de membres autorisés par son plan d'abonnement actuel.
            </p>

            <Alert variant="default" className="bg-blue-50 border-blue-200">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <p className="font-medium mb-1">Que faire ?</p>
                <p className="text-sm">
                  Contactez l'administrateur de <strong>{organizationName}</strong> et demandez-lui de :
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-2">
                  <li>Acheter plus de sièges pour augmenter la capacité</li>
                  <li>Ou libérer un siège en retirant un membre inactif</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Action */}
          <Button
            onClick={onClose}
            className="w-full"
            variant="default"
          >
            J'ai compris
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
