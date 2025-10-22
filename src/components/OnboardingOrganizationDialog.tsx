import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OnboardingOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreateOrganization: (
    name: string,
    description: string,
    type: 'school' | 'company'
  ) => Promise<{ data: any; error: any }>;
  userRole: 'school' | 'company';
}

export const OnboardingOrganizationDialog = ({
  open,
  onClose,
  onCreateOrganization,
  userRole,
}: OnboardingOrganizationDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'organisation est requis',
        variant: 'destructive',
      });
      return;
    }

    if (name.length < 3) {
      toast({
        title: 'Erreur',
        description: 'Le nom doit contenir au moins 3 caractères',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);
    const { data, error } = await onCreateOrganization(
      name,
      description,
      userRole
    );
    setCreating(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'organisation',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Organisation créée',
        description: 'Votre organisation a été créée avec succès',
      });
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {userRole === 'school' ? (
              <GraduationCap className="w-10 h-10 text-primary" />
            ) : (
              <Building2 className="w-10 h-10 text-primary" />
            )}
            <div>
              <DialogTitle>Créez votre organisation</DialogTitle>
              <DialogDescription>
                {userRole === 'school'
                  ? 'Configurez votre établissement scolaire'
                  : 'Configurez votre entreprise'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="org-name-onboarding">
              Nom de l'organisation *
            </Label>
            <Input
              id="org-name-onboarding"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                userRole === 'school'
                  ? 'Ex: Lycée Jean Moulin'
                  : 'Ex: Entreprise XYZ'
              }
              autoFocus
            />
          </div>

          <div>
            <Label htmlFor="org-description-onboarding">
              Description (optionnel)
            </Label>
            <Textarea
              id="org-description-onboarding"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre organisation..."
              rows={3}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note :</strong> Un code d'organisation unique sera
              automatiquement généré. Vous pourrez le partager avec vos
              étudiants pour qu'ils puissent rejoindre votre organisation.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={creating}
            >
              Plus tard
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Création...' : 'Créer l\'organisation'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
