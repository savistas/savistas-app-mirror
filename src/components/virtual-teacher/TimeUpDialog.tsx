/**
 * Dialog affiché quand l'utilisateur gratuit atteint sa limite de temps
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Zap, Crown, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TimeUpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function TimeUpDialog({ open, onClose }: TimeUpDialogProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/profile'); // Rediriger vers la page de profil avec les options d'abonnement
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Temps écoulé !
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Vous avez utilisé vos <strong>3 minutes gratuites</strong> de conversation avec le professeur virtuel IA.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Message principal */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 text-center">
              Pour continuer à profiter de conversations <strong>illimitées</strong> avec votre professeur virtuel personnalisé, passez au plan supérieur !
            </p>
          </div>

          {/* Avantages Premium/Pro */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Crown className="h-4 w-4 text-yellow-600" />
              Avec un plan Premium ou Pro :
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span><strong>Conversations illimitées</strong> avec l'avatar IA</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Accès à tous les cours et exercices personnalisés</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Suivi détaillé de votre progression</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Support prioritaire</span>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Plus tard
          </Button>
          <Button
            onClick={handleUpgrade}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
          >
            <Zap className="h-4 w-4 mr-2" />
            Passer au plan supérieur
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
