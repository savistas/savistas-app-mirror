import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

interface RoleChangeDialogProps {
  open: boolean;
  onClose: () => void;
  currentRole: string;
}

export const RoleChangeDialog = ({ open, onClose, currentRole }: RoleChangeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newRole, setNewRole] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = async () => {
    if (!user || !newRole) return;

    setLoading(true);

    try {
      // Vérifier si l'utilisateur a des données d'organisation en cours
      if (currentRole === 'school' || currentRole === 'company') {
        const { data: orgData } = await supabase
          .from('organizations')
          .select('id')
          .eq('created_by', user.id)
          .maybeSingle();

        if (orgData) {
          toast({
            title: "Impossible de changer de rôle",
            description: "Vous avez déjà créé une organisation. Veuillez contacter le support pour changer de rôle.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Vérifier si l'utilisateur est membre d'une organisation
      if (currentRole === 'student') {
        const { data: membership } = await supabase
          .from('organization_members')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership && membership.status === 'active') {
          toast({
            title: "Impossible de changer de rôle",
            description: "Vous êtes actuellement membre d'une organisation. Veuillez quitter l'organisation avant de changer de rôle.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Mettre à jour le rôle dans la table profiles
      const { error } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          // Réinitialiser les champs spécifiques au rôle
          profile_completed: false,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Rôle modifié avec succès",
        description: `Votre rôle a été changé en ${getRoleLabel(newRole)}. La page va se recharger.`,
      });

      // Recharger la page après 1.5 secondes
      setTimeout(() => {
        window.location.href = '/profile';
      }, 1500);
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de changer de rôle",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'student':
        return 'Élève';
      case 'school':
        return 'Établissement scolaire';
      case 'company':
        return 'Entreprise';
      default:
        return role;
    }
  };

  const availableRoles = ['student', 'school', 'company'].filter(role => role !== currentRole);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Changer de type de compte
          </DialogTitle>
          <DialogDescription>
            Modifiez le type de votre compte. Cette action réinitialisera certaines données de votre profil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Attention:</strong> Vous êtes actuellement enregistré en tant que <strong>{getRoleLabel(currentRole)}</strong>.
              Le changement de rôle peut réinitialiser certaines données de votre profil.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="new-role">Nouveau type de compte</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger id="new-role">
                <SelectValue placeholder="Sélectionnez un nouveau rôle" />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getRoleLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {newRole && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-900">
                Vous allez changer votre compte de <strong>{getRoleLabel(currentRole)}</strong> à <strong>{getRoleLabel(newRole)}</strong>.
                Vous devrez compléter à nouveau votre profil après ce changement.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleRoleChange}
            disabled={!newRole || loading}
          >
            {loading ? "Changement en cours..." : "Confirmer le changement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
