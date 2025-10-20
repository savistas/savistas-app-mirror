import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface DeleteAccountDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
}

const DeleteAccountDialog = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}: DeleteAccountDialogProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const isConfirmValid = confirmText === "SUPPRIMER";

  const handleConfirm = async () => {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl">Supprimer définitivement votre compte</DialogTitle>
          </div>
          <DialogDescription className="pt-4 space-y-3 text-sm">
            <p className="font-semibold text-red-600">
              ⚠️ Cette action est irréversible et entraînera la suppression permanente de :
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-700 pl-2">
              <li>Votre profil et toutes vos informations personnelles</li>
              <li>Tous vos cours et exercices créés</li>
              <li>Vos résultats aux questionnaires et aux quiz</li>
              <li>Vos conversations et messages</li>
              <li>Vos styles d'apprentissage et prédétections de troubles</li>
              <li>Votre compte d'authentification</li>
            </ul>
            <p className="font-semibold text-gray-900 pt-2">
              Compte à supprimer : <span className="text-red-600">{userEmail}</span>
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm" className="text-sm font-medium">
              Pour confirmer, tapez <span className="font-bold text-red-600">SUPPRIMER</span> ci-dessous :
            </Label>
            <Input
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="font-mono"
              disabled={isDeleting}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isConfirmValid || isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? "Suppression en cours..." : "Supprimer définitivement mon compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteAccountDialog;
