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
import { Copy, RefreshCw, Euro, Users, Calculator, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OrganizationSettingsProps {
  name: string;
  description: string | null;
  organizationCode: string;
  activeMembersCount?: number;
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
  activeMembersCount = 0,
  onUpdateOrganization,
  onRegenerateCode,
}: OrganizationSettingsProps) => {
  const { toast } = useToast();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription || '');
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const PRICE_PER_MEMBER = 5; // €5 par membre actif par mois
  const monthlyTotal = activeMembersCount * PRICE_PER_MEMBER;

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

        {/* Section Système de Paiement Cumulatif */}
        <div className="pt-6 border-t">
          <div className="flex items-center gap-2 mb-4">
            <Euro className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">Système de Facturation</h3>
          </div>

          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <strong>Tarification cumulative :</strong> Votre abonnement est calculé en fonction du nombre de membres actifs dans votre organisation.
            </AlertDescription>
          </Alert>

          {/* Carte récapitulative actuelle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 font-medium">Membres actifs</p>
                      <p className="text-2xl font-bold text-blue-900">{activeMembersCount}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500 rounded-lg">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-700 font-medium">Coût mensuel estimé</p>
                      <p className="text-2xl font-bold text-green-900">{monthlyTotal}€</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Explication détaillée */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Comment ça marche ?
            </h4>
            <ul className="space-y-2 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong>Prix unitaire :</strong> {PRICE_PER_MEMBER}€ par membre actif par mois</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong>Facturation cumulative :</strong> Le coût total est calculé en multipliant le nombre de membres actifs par {PRICE_PER_MEMBER}€</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong>Membres actifs :</strong> Seuls les membres avec le statut "Actif" sont comptabilisés dans la facturation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span><strong>Flexibilité :</strong> Ajoutez ou retirez des membres à tout moment - la facturation s'ajuste automatiquement</span>
              </li>
            </ul>

            {/* Tableau d'exemples */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <h5 className="font-semibold text-slate-900 mb-3 text-sm">Exemples de tarification :</h5>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="text-left p-2 font-medium text-slate-700">Membres actifs</th>
                      <th className="text-left p-2 font-medium text-slate-700">Calcul</th>
                      <th className="text-right p-2 font-medium text-slate-700">Coût mensuel</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-100">
                    {[1, 5, 10, 20, 50].map((members) => (
                      <tr key={members} className={activeMembersCount === members ? 'bg-blue-50' : ''}>
                        <td className="p-2 text-slate-700">{members} {members === 1 ? 'membre' : 'membres'}</td>
                        <td className="p-2 text-slate-600">{members} × {PRICE_PER_MEMBER}€</td>
                        <td className="p-2 text-right font-semibold text-slate-900">{members * PRICE_PER_MEMBER}€</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
