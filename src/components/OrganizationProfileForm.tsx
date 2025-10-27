import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useOrganizationRequests } from '@/hooks/useOrganizationRequests';

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
  const navigate = useNavigate();
  const { createRequest } = useOrganizationRequests();
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
    // Pour les écoles, la date de naissance n'est pas requise
    const birthdateRequired = organizationType === 'company';

    if (!fullName || (birthdateRequired && !dateOfBirth) || !phoneNumber || !country) {
      toast({
        title: 'Informations personnelles requises',
        description: 'Veuillez remplir toutes vos informations personnelles.',
        variant: 'destructive',
      });
      return;
    }

    if (!organizationName || !organizationDescription) {
      toast({
        title: 'Informations organisation requises',
        description: 'Veuillez remplir le nom et la description de votre organisation.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Créer une demande d'organisation au lieu de créer directement l'organisation
      const { data, error } = await createRequest({
        organization_name: organizationName,
        organization_description: organizationDescription,
        organization_website: organizationWebsite || '', // Site web optionnel
        organization_type: organizationType,
        admin_full_name: fullName,
        admin_date_of_birth: dateOfBirth || '1970-01-01', // Date par défaut si non fournie (écoles)
        admin_phone: phoneNumber,
        admin_country: country,
        admin_city: city || undefined,
        admin_email: user.email || '',
      });

      if (error) {
        console.error('Request creation error:', error);
        throw new Error(error);
      }

      // Mettre à jour le profil avec les informations et marquer comme complété
      // Utiliser upsert pour créer ou mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          email: user.email || '',
          role: organizationType, // Définir le role (school ou company)
          full_name: fullName,
          phone: phoneNumber,
          country: country,
          city: city || '',
          postal_code: '', // Optionnel pour les organisations
          // Champs requis mais non pertinents pour les organisations
          education_level: 'Organisation',
          classes: 'N/A',
          subjects: 'N/A',
          subscription: 'basic',
          profile_completed: true,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        // Ne pas bloquer le flux si l'update du profil échoue
      }

      toast({
        title: 'Demande envoyée !',
        description: 'Votre demande de création d\'organisation a été envoyée avec succès. Elle sera examinée par un administrateur Savistas.',
        duration: 5000,
      });

      // Rediriger vers la page de statut de la demande
      navigate(`/${organizationType}/creation-request`);
    } catch (error) {
      console.error('Erreur lors de la création de la demande:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer votre demande. Veuillez réessayer.',
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
        <AlertTitle>Demande de création de votre {orgTypeLabel}</AlertTitle>
        <AlertDescription>
          Une fois ce formulaire soumis, votre demande de création d'organisation sera envoyée
          à un administrateur Savistas pour validation. Vous serez notifié par email une fois
          votre demande traitée.
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

        {/* Date de naissance : uniquement pour les entreprises */}
        {organizationType === 'company' && (
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
        )}

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
            Site web de l'organisation
          </Label>
          <Input
            id="organizationWebsite"
            type="url"
            value={organizationWebsite}
            onChange={(e) => setOrganizationWebsite(e.target.value)}
            placeholder="https://www.exemple.fr (optionnel)"
          />
          <p className="text-xs text-muted-foreground">Optionnel</p>
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
            Envoi en cours...
          </>
        ) : (
          'Envoyer ma demande'
        )}
      </Button>
    </form>
  );
};
