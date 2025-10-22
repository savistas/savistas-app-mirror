import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
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
import { Copy, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OrganizationSettingsProps {
  name: string;
  description: string | null;
  organizationCode: string;
  onUpdateOrganization: (updates: {
    name?: string;
    description?: string;
  }) => Promise<{ error: any }>;
  onRegenerateCode: () => Promise<{ data: string | null; error: any }>;
}

export const OrganizationSettings = ({
  name: initialName,
  description: initialDescription,
  organizationCode,
  onUpdateOrganization,
  onRegenerateCode,
}: OrganizationSettingsProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(organizationCode);
    toast({
      title: 'Code copié',
      description: 'Le code d\'organisation a été copié dans le presse-papier',
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom de l\'organisation est requis',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { error } = await onUpdateOrganization({
      name,
      description: description || null,
    });
    setSaving(false);

    if (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour l\'organisation',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Modifications enregistrées',
        description: 'Les informations de l\'organisation ont été mises à jour',
      });
    }
  };

  const handleRegenerateCode = async () => {
    setRegenerating(true);
    const { data, error } = await onRegenerateCode();
    setRegenerating(false);

    if (error || !data) {
      toast({
        title: 'Erreur',
        description: 'Impossible de régénérer le code',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Code régénéré',
        description: 'Un nouveau code d\'organisation a été créé',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paramètres de l'organisation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="org-name">Nom de l'organisation</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nom de l'organisation"
            />
          </div>

          <div>
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de l'organisation (optionnel)"
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>

        <div className="pt-6 border-t">
          <h3 className="font-semibold mb-4">Code d'organisation</h3>
          <div className="flex gap-2">
            <Input
              value={organizationCode}
              readOnly
              className="font-mono text-lg"
            />
            <Button variant="outline" onClick={handleCopyCode}>
              <Copy className="w-4 h-4 mr-2" />
              Copier
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" disabled={regenerating}>
                  <RefreshCw
                    className={`w-4 h-4 mr-2 ${
                      regenerating ? 'animate-spin' : ''
                    }`}
                  />
                  Régénérer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Régénérer le code d'organisation ?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    L'ancien code ne fonctionnera plus. Vous devrez partager le
                    nouveau code avec vos membres. Cette action est
                    irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleRegenerateCode}>
                    Régénérer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Partagez ce code avec vos étudiants pour qu'ils puissent rejoindre
            votre organisation
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
