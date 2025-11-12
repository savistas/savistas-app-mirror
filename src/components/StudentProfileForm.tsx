import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { OrganizationCodeInput } from '@/components/OrganizationCodeInput';
import { Loader2, AlertCircle, Check, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PlanDetailsDialog } from '@/components/subscription/PlanDetailsDialog';

interface StudentProfileFormProps {
  onComplete: () => void;
  joinedViaCode?: boolean;
  organizationId?: string | null;
  organizationName?: string | null;
  organizationCode?: string | null;
}

const subscriptions = [
  {
    id: "basic",
    name: "Basique",
    price: "Gratuit",
    duration: "",
    aiModel: "basique",
    storage: "limité",
    tokens: "faible",
    speed: "standard",
    popular: false
  },
  {
    id: "premium",
    name: "Premium",
    price: "9,99€",
    duration: "/mois",
    aiModel: "avancé",
    storage: "modéré",
    tokens: "moyen",
    speed: "prioritaire",
    popular: true
  },
  {
    id: "pro",
    name: "Pro",
    price: "19,99€",
    duration: "/mois",
    aiModel: "pro",
    storage: "illimité",
    tokens: "illimité",
    speed: "ultra prioritaire",
    popular: false
  }
];

export const StudentProfileForm = ({
  onComplete,
  joinedViaCode = false,
  organizationId = null,
  organizationName = null,
  organizationCode = null,
}: StudentProfileFormProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // États pour informations générales
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [orgCode, setOrgCode] = useState(organizationCode || '');
  const [ent, setEnt] = useState('');
  const [aiLevel, setAiLevel] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  // États pour parcours scolaire
  const [educationLevel, setEducationLevel] = useState('');
  const [classes, setClasses] = useState('');
  const [subjects, setSubjects] = useState('');

  // État pour l'abonnement
  const [subscription, setSubscription] = useState('basic');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<'premium' | 'pro'>('premium');

  // États pour la validation du code d'organisation
  const [organizationValidated, setOrganizationValidated] = useState<boolean>(false);
  const [validatedOrgId, setValidatedOrgId] = useState<string | null>(null);
  const [validatedOrgName, setValidatedOrgName] = useState<string | null>(null);

  const handleOrganizationValidation = (
    isValid: boolean,
    orgId: string | null,
    orgName: string | null
  ) => {
    setOrganizationValidated(isValid);
    setValidatedOrgId(orgId);
    setValidatedOrgName(orgName);
  };

  const handlePlanClick = (sub: typeof subscriptions[0]) => {
    if (sub.price === "Gratuit") {
      // Free plan: just select it
      setSubscription(sub.id);
    } else {
      // Paid plan: open upgrade dialog
      setSelectedPlanForUpgrade(sub.id as 'premium' | 'pro');
      setShowUpgradeDialog(true);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setProfilePhoto(file);
  };

  const removePhoto = () => {
    setProfilePhoto(null);
  };

  // Charger les données existantes au montage du composant
  useEffect(() => {
    const loadExistingData = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('country, city, postal_code, link_code, education_level, classes, subjects, subscription, ai_level, ent')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data) {
        setCountry(data.country || '');
        setCity(data.city || '');
        setPostalCode(data.postal_code || '');
        setInvitationCode(data.link_code || '');
        setEducationLevel(data.education_level || '');
        setClasses(data.classes || '');
        setSubjects(data.subjects || '');
        setSubscription(data.subscription || 'basic');
        setAiLevel(data.ai_level || '');
        setEnt(data.ent || '');
      }
    };

    loadExistingData();
  }, [user]);

  // Mettre à jour le code d'organisation quand il est validé
  useEffect(() => {
    if (organizationCode) {
      setOrgCode(organizationCode);
    }
  }, [organizationCode]);

  // Validation des champs obligatoires
  const isFormValid = () => {
    // Si l'étudiant a rejoint via code, l'abonnement n'est pas requis
    if (joinedViaCode) {
      return country && educationLevel && classes && subjects;
    }
    return country && educationLevel && classes && subjects && subscription;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!isFormValid()) {
      toast({
        title: 'Champs requis',
        description: 'Veuillez remplir tous les champs obligatoires (Pays, Niveau d\'enseignement, Classes, Matières).',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      // Upload photo de profil si existe
      let profilePhotoUrl: string | null = null;
      if (profilePhoto) {
        const fileExt = profilePhoto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, profilePhoto, { upsert: true });

        if (uploadError) {
          console.error('Photo upload error:', uploadError);
        } else if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(uploadData.path);
          profilePhotoUrl = urlData.publicUrl;
        }
      }

      // Préparer les données de mise à jour
      const profileUpdate: any = {
        user_id: user.id,
        email: user.email,
        country,
        city: city || null,
        postal_code: postalCode || null,
        link_code: invitationCode || null,
        education_level: educationLevel,
        classes,
        subjects,
        // Si rejoint via code, utiliser 'basic' par défaut (géré par l'organisation)
        subscription: joinedViaCode ? 'basic' : subscription,
        ai_level: aiLevel || null,
        ent: ent || null,
        profile_completed: true,
        updated_at: new Date().toISOString(),
      };

      if (profilePhotoUrl) {
        profileUpdate.profile_photo_url = profilePhotoUrl;
      }

      // Mettre à jour le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileUpdate, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (profileError) {
        console.error('Profile update error:', profileError);
        throw profileError;
      }

      // Si rejoint via code : ajouter le membre à l'organisation avec statut 'pending'
      if (joinedViaCode && organizationId) {
        const { data: existingMembership } = await supabase
          .from('organization_members')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!existingMembership) {
          // Récupérer l'abonnement B2C existant pour le sauvegarder
          const { data: currentSubscription } = await supabase
            .from('user_subscriptions')
            .select('plan, stripe_subscription_id')
            .eq('user_id', user.id)
            .maybeSingle();

          const memberData: any = {
            organization_id: organizationId,
            user_id: user.id,
            role: 'student',
            status: 'pending',
            requested_at: new Date().toISOString(),
          };

          // Sauvegarder le plan actuel si ce n'est pas le plan basique par défaut
          if (currentSubscription && currentSubscription.plan !== 'basic') {
            memberData.previous_subscription_plan = currentSubscription.plan;
            memberData.previous_stripe_subscription_id = currentSubscription.stripe_subscription_id;
            console.log(`Saving previous subscription: ${currentSubscription.plan}`);
          }

          const { error: memberError } = await supabase
            .from('organization_members')
            .insert(memberData);

          if (memberError) {
            console.error('Error adding member:', memberError);
            throw new Error('Erreur lors de l\'ajout à l\'organisation');
          }
        }
      }

      // Message de succès
      if (joinedViaCode && organizationName) {
        toast({
          title: 'Demande envoyée !',
          description: `Votre demande d'adhésion à ${organizationName} a été envoyée. Vous recevrez une notification une fois approuvée.`,
        });
      } else if (organizationValidated && validatedOrgName) {
        toast({
          title: 'Profil complété !',
          description: `Votre demande d'adhésion à ${validatedOrgName} a été envoyée.`,
        });
      } else {
        toast({
          title: 'Profil complété !',
          description: 'Vos informations ont été enregistrées avec succès.',
        });
      }

      onComplete();
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre profil.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerte profil incomplet */}
      <Alert className="border-orange-200 bg-orange-50">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <strong>Profil incomplet</strong>
          <br />
          Veuillez remplir toutes les informations obligatoires ci-dessous pour accéder à votre espace d'apprentissage personnalisé.
        </AlertDescription>
      </Alert>

      {/* Titre */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Complétez votre profil</h2>
        <p className="text-slate-600">Quelques informations supplémentaires pour personnaliser votre expérience</p>
      </div>

      {/* Formulaire avec sections */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Informations générales */}
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold">1</span>
              <span className="text-lg font-semibold text-slate-900">Informations générales</span>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-6">
                {/* Pays et Ville */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="country">
                      Pays <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Votre pays"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Votre ville"
                    />
                  </div>
                </div>

                {/* Code postal et Code de liaison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Code postal</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Votre code postal"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invitationCode">Code de liaison</Label>
                    <Input
                      id="invitationCode"
                      value={invitationCode}
                      onChange={(e) => setInvitationCode(e.target.value)}
                      placeholder="Code de liaison"
                    />
                  </div>
                </div>

                {/* Code d'invitation (Organisation) */}
                <div className="space-y-3 border-t pt-6">
                  <Label>Code d'invitation (optionnel)</Label>

                  {joinedViaCode && organizationName ? (
                    // Si rejoint via dialog : afficher le code validé en vert
                    <div className="space-y-2">
                      <Input
                        value={orgCode}
                        disabled
                        className="border-green-500 bg-green-50 text-green-900 font-medium"
                      />
                      <p className="text-sm text-green-700 flex items-center gap-2">
                        <Check className="w-4 h-4" />
                        Vous allez rejoindre : <strong>{organizationName}</strong>
                      </p>
                    </div>
                  ) : (
                    // Sinon : afficher le champ normal
                    <>
                      <p className="text-sm text-slate-600">
                        Si vous faites partie d'une école ou d'une entreprise utilisant Savistas,
                        entrez le code d'invitation fourni par votre établissement.
                      </p>
                      <OrganizationCodeInput
                        value={orgCode}
                        onChange={setOrgCode}
                        onValidationChange={handleOrganizationValidation}
                      />
                    </>
                  )}
                </div>

                {/* ENT et Niveau IA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ent">ENT</Label>
                    <Input
                      id="ent"
                      value={ent}
                      onChange={(e) => setEnt(e.target.value)}
                      placeholder="ENT"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="aiLevel">Niveau IA</Label>
                    <Select value={aiLevel} onValueChange={setAiLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Niveau IA" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="debutant">Débutant</SelectItem>
                        <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                        <SelectItem value="avance">Avancé</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Photo de profil */}
                <div className="space-y-3">
                  <Label>Photo de profil</Label>
                  <div className="flex items-center justify-start">
                    {profilePhoto ? (
                      <div className="relative group">
                        <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center overflow-hidden">
                          <img
                            src={URL.createObjectURL(profilePhoto)}
                            alt="Photo de profil"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                          onClick={removePhoto}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-32 h-32 border-2 border-dashed border-slate-300 hover:border-primary transition-colors rounded-lg flex flex-col items-center justify-center space-y-2 hover:bg-slate-50">
                          <Upload className="w-8 h-8 text-slate-400" />
                          <span className="text-xs text-slate-500">Ajouter une photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Section 2: Parcours scolaire */}
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold">2</span>
              <span className="text-lg font-semibold text-slate-900">Parcours scolaire</span>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-6">
                {/* Niveau d'enseignement */}
                <div className="space-y-2">
                  <Label htmlFor="educationLevel">
                    Niveau d'enseignement <span className="text-red-500">*</span>
                  </Label>
                  <Select value={educationLevel} onValueChange={setEducationLevel} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez votre niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primaire">Primaire</SelectItem>
                      <SelectItem value="college">Collège</SelectItem>
                      <SelectItem value="lycee">Lycée</SelectItem>
                      <SelectItem value="superieur">Supérieur</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Classes */}
                <div className="space-y-2">
                  <Label htmlFor="classes">
                    Classes <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="classes"
                    value={classes}
                    onChange={(e) => setClasses(e.target.value)}
                    placeholder="Ex: 2nde, 1ère, Terminale"
                    required
                  />
                </div>

                {/* Matières */}
                <div className="space-y-2">
                  <Label htmlFor="subjects">
                    Matières <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subjects"
                    value={subjects}
                    onChange={(e) => setSubjects(e.target.value)}
                    placeholder="Ex: Mathématiques, Physique, Histoire"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Section 3: Abonnement (masquée si rejoint via code) */}
        {!joinedViaCode && (
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-slate-50">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-semibold">3</span>
                <span className="text-lg font-semibold text-slate-900">Abonnement</span>
              </div>
            </div>
            <div className="px-6 py-6">
              <div className="space-y-4">
                  <div className="mb-4">
                    <Label>
                      Type d'abonnement <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {subscriptions.map((sub) => (
                      <Card
                      key={sub.id}
                      className={cn(
                        "rounded-lg hover:shadow-lg transition-all duration-300 border-2 relative cursor-pointer",
                        subscription === sub.id
                          ? 'border-primary bg-primary/5 shadow-lg'
                          : 'border-slate-200 hover:border-primary/50',
                        sub.popular && "ring-2 ring-primary/20"
                      )}
                      onClick={() => handlePlanClick(sub)}
                    >
                      {sub.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            Populaire
                          </span>
                        </div>
                      )}

                      <CardHeader className="text-center pb-2">
                        <CardTitle className="text-xl">{sub.name}</CardTitle>
                        <div className={cn(
                          "text-3xl font-bold",
                          sub.price === "Gratuit" ? "text-primary" : "text-slate-400"
                        )}>
                          {sub.price}
                          <span className="text-sm font-normal">
                            {sub.duration}
                          </span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Modèle IA: {sub.aiModel}</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Stockage: {sub.storage}</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Tokens: {sub.tokens}</span>
                          </li>
                          <li className="flex items-center space-x-2">
                            <Check className="w-4 h-4 text-green-500" />
                            <span className="text-sm">Rapidité: {sub.speed}</span>
                          </li>
                        </ul>

                        <Button
                          type="button"
                          variant={subscription === sub.id ? "default" : "outline"}
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlanClick(sub);
                          }}
                        >
                          {sub.price === "Gratuit"
                            ? (subscription === sub.id ? "Sélectionné" : "Choisir")
                            : "Souscrire"
                          }
                        </Button>
                      </CardContent>
                    </Card>
                    ))}
                  </div>
                </div>
              </div>
            </div>
        )}

        {/* Message d'information si rejoint via code */}
        {joinedViaCode && organizationName && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Organisation rejointe</strong>
                <br />
                Vous êtes membre de <strong>{organizationName}</strong>. L'abonnement est géré par votre organisation.
              </AlertDescription>
            </Alert>

            {subscription !== 'basic' && (
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  <strong>💡 Information importante :</strong>
                  <br />
                  Vous avez actuellement un abonnement <strong>{subscription === 'premium' ? 'Premium' : 'Pro'}</strong>.
                  En rejoignant l'organisation, votre abonnement personnel sera mis en pause et sauvegardé.
                  Si vous quittez l'organisation ultérieurement, votre abonnement {subscription === 'premium' ? 'Premium' : 'Pro'} sera automatiquement restauré.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Bouton de soumission */}
        <div className="mt-8 flex justify-center">
          <Button
            type="submit"
            size="lg"
            className="px-12"
            disabled={loading || !isFormValid()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              'Compléter mon profil'
            )}
          </Button>
        </div>
      </form>

      {/* Plan Details Dialog for Premium/Pro plans */}
      <PlanDetailsDialog
        open={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        plan={selectedPlanForUpgrade}
      />
    </div>
  );
};
