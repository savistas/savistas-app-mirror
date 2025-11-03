/**
 * ErrorRevisionModal Component
 * Modal dialog for uploading and analyzing manual errors
 */

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ErrorRevisionForm } from './ErrorRevisionForm';
import { useErrorRevision } from '@/hooks/useErrorRevision';
import { ErrorRevisionFormData } from '@/types/errorRevision';
import { Loader2 } from 'lucide-react';

interface ErrorRevisionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ErrorRevisionModal = ({ open, onOpenChange }: ErrorRevisionModalProps) => {
  const { submitErrorRevisionAsync, isLoading } = useErrorRevision();

  const handleSubmit = async (data: ErrorRevisionFormData) => {
    try {
      await submitErrorRevisionAsync(data);
      // Fermer le modal après succès
      onOpenChange(false);
    } catch (error) {
      console.error('Upload error:', error);
      // L'erreur est déjà gérée par le hook (toast)
    }
  };

  return (
    <Dialog open={open} onOpenChange={isLoading ? undefined : onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Bloquer la fermeture pendant l'upload
          if (isLoading) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Bloquer Escape pendant l'upload
          if (isLoading) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Réviser une erreur</DialogTitle>
        </DialogHeader>

        {/* Overlay de chargement */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center space-y-4 p-6">
              <Loader2 className="animate-spin h-12 w-12 text-primary mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">Upload en cours...</p>
                <p className="text-sm text-gray-600">
                  Ne fermez pas cette fenêtre
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire */}
        <ErrorRevisionForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          disabled={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
};
