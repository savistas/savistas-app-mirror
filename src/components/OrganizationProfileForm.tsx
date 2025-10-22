import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OrganizationProfileFormProps {
  onComplete: () => void;
  organizationType: 'school' | 'company';
}

export const OrganizationProfileForm = ({
  onComplete,
  organizationType
}: OrganizationProfileFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // États pour les informations personnelles de l'administrateur
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');

  // États pour les informations de l'organisation
  const [organizationName, setOrganizationName] = useState('');
  const [organizationDescription, setOrganizationDescription] = useState('');
  const [organizationWebsite, setOrganizationWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation des champs obligatoires
    if (!fullName || !dateOfBirth || !phoneNumber || !country) {
      toast({
        title: 'Informations personnelles requises',
        description: 'Veuillez remplir toutes vos informations personnelles.',
        variant: 'destructive',
      });
      return;
    }

    if (!organizationName || !organizationDescription || !organizationWebsite) {
      toast({
        title: 'Informations organisation requises',
        description: 'Veuillez remplir toutes les informations de votre organisation.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // 1. Créer l'organisation (statut pending par défaut)
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: organizationName,
          description: organizationDescription,
          website: organizationWebsite,
          type: organizationType,
          created_by: user.id,
          validation_status: 'pending', // En attente de validation admin
        })
        .select()
        .single();

      if (orgError) {
        console.error('Organization creation error:', JSON.stringify(orgError, null, 2));
        throw orgError;
      }

      console.log('Organization created successfully:', orgData);

      // 2. Mettre à jour le profil de l'administrateur
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          date_of_birth: dateOfBirth,
          phone: phoneNumber,
          country: country,
          city: city || null,
          email: user.email,
          role: organizationType, // Mise à jour du rôle (school ou company)
          subscription: 'basic', // Abonnement par défaut
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // 3. Ajouter l'administrateur comme membre actif de l'organisation
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: orgData.id,
          user_id: user.id,
          status: 'active',
          role: 'admin',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        });

      if (memberError) throw memberError;

      toast({
        title: 'Organisation créée !',
        description: 'Votre organisation a été créée et est en attente de validation par un administrateur Savistas.',
        duration: 5000,
      });

      onComplete();
    } catch (error) {
      console.error('Erreur lors de la création de l\'organisation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer votre organisation. Veuillez réessayer.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const orgTypeLabel = organizationType === 'school' ? 'établissement scolaire' : 'entreprise';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Alert d'information */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Création de votre {orgTypeLabel}</AlertTitle>
        <AlertDescription>
          Une fois votre profil complété, votre organisation sera créée et soumise
          à validation par un administrateur Savistas. Vous serez notifié une fois validée.
        </AlertDescription>
      </Alert>

      {/* Section Informations personnelles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-800">
            Vos informations personnelles
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fullName">
            Nom complet <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Prénom Nom"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">
            Date de naissance <span className="text-red-500">*</span>
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phoneNumber">
            Numéro de téléphone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phoneNumber"
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+33 1 23 45 67 89"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">
            Pays <span className="text-red-500">*</span>
          </Label>
          <Input
            id="country"
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="France"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">
            Ville
          </Label>
          <Input
            id="city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Paris"
          />
        </div>
      </div>

      {/* Section Informations de l'organisation */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-slate-800">
            Informations de votre {orgTypeLabel}
          </h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationName">
            Nom de l'organisation <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organizationName"
            type="text"
            value={organizationName}
            onChange={(e) => setOrganizationName(e.target.value)}
            placeholder={
              organizationType === 'school'
                ? "Ex: Lycée Jean Moulin"
                : "Ex: ACME Corporation"
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationDescription">
            Description de l'organisation <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="organizationDescription"
            value={organizationDescription}
            onChange={(e) => setOrganizationDescription(e.target.value)}
            placeholder="Décrivez brièvement votre organisation, ses activités et objectifs..."
            rows={4}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="organizationWebsite">
            Site web de l'organisation <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organizationWebsite"
            type="url"
            value={organizationWebsite}
            onChange={(e) => setOrganizationWebsite(e.target.value)}
            placeholder="https://www.exemple.fr"
            required
          />
        </div>
      </div>

      {/* Bouton de soumission */}
      <Button
        type="submit"
        className="w-full"
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Création en cours...
          </>
        ) : (
          'Créer mon organisation'
        )}
      </Button>
    </form>
  );
};
