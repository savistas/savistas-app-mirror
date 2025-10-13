import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AutoResizeTextarea from "@/components/AutoResizeTextarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, LogOut, ChevronLeft, ChevronRight, AlertCircle, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import ProfileQuestionEditModal from "@/components/ProfileQuestionEditModal";
import InformationSurveyDialog from "@/components/InformationSurveyDialog";
import { useNavigate } from "react-router-dom";
import { InformationStep } from "@/components/register/InformationStep";
import { EducationStep } from "@/components/register/EducationStep";
import { SubscriptionStep } from "@/components/register/SubscriptionStep";
import { StepIndicator } from "@/components/register/StepIndicator";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // États pour le mode complétion
  const [isProfileIncomplete, setIsProfileIncomplete] = useState(false);
  const [completionStep, setCompletionStep] = useState(1);
  const [completionData, setCompletionData] = useState({
    country: "",
    city: "",
    postalCode: "",
    profilePhoto: null as File | null,
    linkCode: "",
    linkRelation: "",
    ent: "",
    aiLevel: "",
    educationLevel: "",
    classes: "",
    subjects: "",
    subscription: "",
  });

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: "",
    postal_code: "",
    education_level: "",
    classes: "",
    subjects: "",
    role: "",
    subscription: "basic",
    link_code: "",
    link_relation: "",
    ent: "",
    ai_level: "",
    troubles_detection_completed: false,
    learning_styles_completed: false,
  });

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // État pour les styles d'apprentissage
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);

  const [profilesInfos, setProfilesInfos] = useState<{
    pref_apprendre_idee?: string;
    memoire_poesie?: string;
    resoudre_maths?: string;
    temps_libre_pref?: string;
    travail_groupe_role?: string;
    retenir_info?: string;
    pref_enseignant?: string;
    decouvrir_endroit?: string;
    reussir_definition?: string;
    souvenir_important?: string;
  } | null>(null);

  // État pour la modal d'édition
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    questionKey: string;
    currentValue: string;
  }>({
    isOpen: false,
    questionKey: '',
    currentValue: '',
  });

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,email,phone,country,city,postal_code,education_level,classes,subjects,subscription,profile_photo_url')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        toast({ title: "Profil", description: "Impossible de charger le profil", variant: "destructive" });
        return;
      }
      if (data) {
        setForm({
          full_name: data.full_name ?? "",
          email: data.email ?? user.email ?? "",
          phone: data.phone ?? "",
          country: data.country ?? "",
          city: data.city ?? "",
          postal_code: data.postal_code ?? "",
          education_level: data.education_level ?? "",
          classes: data.classes ?? "",
          subjects: data.subjects ?? "",
          role: data.role ?? "",
          subscription: data.subscription ?? "basic",
          link_code: data.link_code ?? "",
          link_relation: data.link_relation ?? "",
          ent: data.ent ?? "",
          ai_level: data.ai_level ?? "",
          troubles_detection_completed: data.troubles_detection_completed ?? false,
          learning_styles_completed: data.learning_styles_completed ?? false,
        });
        setAvatarUrl(data.profile_photo_url ?? null);

        // Vérifier si le profil est incomplet
        const isIncomplete = !data.country || 
          !data.education_level || 
          !data.classes || 
          !data.subjects || 
          !data.subscription;

        if (isIncomplete) {
          setIsProfileIncomplete(true);
          // Pré-remplir completionData avec les données existantes
          setCompletionData(prev => ({
            ...prev,
            country: data.country ?? "",
            city: data.city ?? "",
            postalCode: data.postal_code ?? "",
            educationLevel: data.education_level ?? "",
            classes: data.classes ?? "",
            subjects: data.subjects ?? "",
            subscription: data.subscription ?? "",
          }));
        } else {
          setIsProfileIncomplete(false);
        }
      } else {
        // fallback minimal
        setForm((f) => ({ ...f, email: user.email ?? "" }));
        setIsProfileIncomplete(true); // Si pas de données, profil incomplet
      }
    };
    loadProfile();
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    const loadProfilesInfos = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles_infos')
        .select('pref_apprendre_idee,memoire_poesie,resoudre_maths,temps_libre_pref,travail_groupe_role,retenir_info,pref_enseignant,decouvrir_endroit,reussir_definition,souvenir_important')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!active) return;
      if (error) {
        toast({ title: "Informations d'apprentissage", description: "Impossible de charger les informations d'apprentissage", variant: "destructive" });
        return;
      }
      if (data) {
        setProfilesInfos(data);
      }
    };
    loadProfilesInfos();
    return () => { active = false; };
  }, [user]);

  const onChange = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // Gestionnaires pour la modal d'édition
  const handleEditQuestion = (questionKey: string, currentValue: string) => {
    setEditModal({
      isOpen: true,
      questionKey,
      currentValue,
    });
  };

  const handleCloseModal = () => {
    setEditModal({
      isOpen: false,
      questionKey: '',
      currentValue: '',
    });
  };

  const handleSaveQuestion = (newValue: string) => {
    if (profilesInfos) {
      setProfilesInfos({
        ...profilesInfos,
        [editModal.questionKey]: newValue,
      });
    }
  };

  const handleUpload = async (file: File) => {
    if (!user) return;
    try {
      setLoading(true);
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}.${ext}`;
      const filePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(uploadData.path);

      const publicUrl = urlData.publicUrl;
      setAvatarUrl(publicUrl);

      // Ensure profile exists, then update
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('profiles').update({ profile_photo_url: publicUrl }).eq('user_id', user.id);
      } else {
        await supabase.from('profiles').insert({
          user_id: user.id,
          email: user.email,
          full_name: form.full_name,
          profile_photo_url: publicUrl,
        });
      }

      toast({ title: "Photo mise à jour", description: "Votre photo de profil a été enregistrée" });
    } catch (e: any) {
      toast({ title: "Erreur d'upload", description: e.message ?? "Impossible d'enregistrer la photo", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Fonctions pour le mode complétion
  const calculateCompletionProgress = () => {
    const totalFields = 5; // country, city, postalCode, educationLevel, classes, subjects, subscription
    const requiredFields = ['country', 'city', 'postalCode', 'educationLevel', 'classes', 'subjects', 'subscription'];
    const completedFields = requiredFields.filter(field => {
      const value = completionData[field as keyof typeof completionData];
      return value && value !== "";
    });
    
    const percentage = Math.round((completedFields.length / totalFields) * 100);
    const missing = requiredFields.filter(field => {
      const value = completionData[field as keyof typeof completionData];
      return !value || value === "";
    }).map(field => {
      const fieldNames: Record<string, string> = {
        country: "Pays",
        city: "Ville", 
        postalCode: "Code postal",
        educationLevel: "Niveau d'éducation",
        classes: "Classes",
        subjects: "Matières",
        subscription: "Abonnement"
      };
      return fieldNames[field] || field;
    });

    return { percentage, missing };
  };

  const handleCompletionNext = () => {
    if (canProceedCompletion() && completionStep < 3) {
      setCompletionStep(prev => prev + 1);
    }
  };

  const handleCompletionPrev = () => {
    if (completionStep > 1) {
      setCompletionStep(prev => prev - 1);
    }
  };

  const canProceedCompletion = () => {
    // Vérifier seulement les champs obligatoires
    return (
      completionData.country !== "" && 
      completionData.educationLevel !== "" && 
      completionData.classes !== "" && 
      completionData.subjects !== "" && 
      completionData.subscription !== ""
    );
  };

  const handleCompletionSubmit = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Upload photo de profil si existe
      let profilePhotoUrl: string | null = null;
      if (completionData.profilePhoto) {
        const fileExt = completionData.profilePhoto.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, completionData.profilePhoto, { upsert: true });
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(uploadData.path);
          profilePhotoUrl = urlData.publicUrl;
        }
      }

      // Mise à jour du profil
      const profileUpdate = {
        country: completionData.country,
        city: completionData.city,
        postal_code: completionData.postalCode,
        education_level: completionData.educationLevel,
        classes: completionData.classes,
        subjects: completionData.subjects,
        subscription: completionData.subscription,
        link_code: completionData.linkCode,
        link_relation: completionData.linkRelation,
        ent: completionData.ent,
        ai_level: completionData.aiLevel,
        ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {})
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      toast({
        title: "Profil complété !",
        description: "Actualisation de la page...",
      });
      
      // Reload automatique de la page pour actualiser l'état du profil
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de compléter le profil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('profiles').update(form).eq('user_id', user.id);
      } else {
        await supabase.from('profiles').insert({ ...form, user_id: user.id });
      }
      toast({ title: "Profil enregistré", description: "Vos informations ont été mises à jour" });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible d'enregistrer", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas", variant: "destructive" });
      return;
    }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast({ title: "Mot de passe mis à jour", description: "Votre mot de passe a été changé avec succès." });
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de changer le mot de passe", variant: "destructive" });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setEmailLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });
      if (error) throw error;
      toast({ title: "Email mis à jour", description: "Un email de confirmation a été envoyé à votre nouvelle adresse et à votre ancienne adresse. Veuillez cliquer sur les liens dans les deux emails pour finaliser le changement." });
      setNewEmail("");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de changer l'email", variant: "destructive" });
    } finally {
      setEmailLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté avec succès." });
      navigate("/auth");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message ?? "Impossible de se déconnecter", variant: "destructive" });
    }
  };

  const handleRetakeQuestionnaires = async () => {
    if (!user) return;
    try {
      // Reset les flags pour permettre de refaire les tests
      await supabase
        .from('profiles')
        .update({ 
          troubles_detection_completed: false,
          learning_styles_completed: false,
          survey_completed: false
        })
        .eq('user_id', user.id);
      
      toast({ 
        title: "Questionnaires réinitialisés", 
        description: "Vous pouvez maintenant refaire les questionnaires sur le tableau de bord."
      });
      
      navigate('/dashboard');
    } catch (e: any) {
      toast({ 
        title: "Erreur", 
        description: e.message ?? "Impossible de réinitialiser les questionnaires", 
        variant: "destructive" 
      });
    }
  };

  // Rendu de la page Profil
  return (
    <div className="min-h-screen bg-background px-6 py-8 pb-28">
      <div className="max-w-2xl mx-auto animate-fade-in">
        
        {/* Section de complétion du profil (si profil incomplet) */}
        {isProfileIncomplete && (
          <div className="mb-8">
            {/* Message d'alerte */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900">
                    Profil incomplet
                  </h3>
                  <p className="text-sm text-amber-700">
                    Veuillez remplir toutes les informations obligatoires ci-dessous pour accéder à votre espace d'apprentissage personnalisé.
                  </p>
                </div>
              </div>
            </div>

            {/* Titre */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Complétez votre profil
              </h1>
              <p className="text-muted-foreground">
                Quelques informations supplémentaires pour personnaliser votre expérience
              </p>
            </div>

          {/* Accordéons avec les informations obligatoires */}
          <div className="space-y-6">
            {/* Accordéon Informations générales */}
            <Card className="border-border">
              <CardContent className="p-6">
                <Accordion type="single" collapsible defaultValue="info" className="w-full">
                  <AccordionItem value="info">
                    <AccordionTrigger className="flex items-center justify-between hover:no-underline">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          completionData.country ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {completionData.country ? <Check className="w-4 h-4" /> : <span>1</span>}
                        </div>
                        <span className="text-lg font-medium">Informations générales</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">Pays <span className="text-red-500">*</span></Label>
                          <Input
                            id="country"
                            value={completionData.country}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, country: e.target.value }))}
                            placeholder="Votre pays"
                            required
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">Ville</Label>
                          <Input
                            id="city"
                            value={completionData.city}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, city: e.target.value }))}
                            placeholder="Votre ville"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Code postal</Label>
                          <Input
                            id="postalCode"
                            value={completionData.postalCode}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, postalCode: e.target.value }))}
                            placeholder="Votre code postal"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkCode">Code de liaison</Label>
                          <Input
                            id="linkCode"
                            value={completionData.linkCode}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, linkCode: e.target.value }))}
                            placeholder="Code de liaison"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="linkRelation">Lien de parenté</Label>
                          <Input
                            id="linkRelation"
                            value={completionData.linkRelation}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, linkRelation: e.target.value }))}
                            placeholder="Lien de parenté"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="ent">ENT</Label>
                          <Input
                            id="ent"
                            value={completionData.ent}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, ent: e.target.value }))}
                            placeholder="ENT"
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="aiLevel">Niveau IA</Label>
                          <Select value={completionData.aiLevel} onValueChange={(value) => setCompletionData(prev => ({ ...prev, aiLevel: value }))}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Niveau IA" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="debutant">Débutant</SelectItem>
                              <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                              <SelectItem value="avance">Avancé</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Bouton photo de profil en dessous */}
                      <div className="mt-6">
                        <Label>Photo de profil</Label>
                        <div className="mt-2">
                          <input
                            id="profilePhoto"
                            type="file"
                            accept=".png,.jpeg,.jpg"
                            className="hidden"
                            onChange={(e) => e.target.files?.[0] && setCompletionData(prev => ({ ...prev, profilePhoto: e.target.files![0] }))}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('profilePhoto')?.click()}
                            className="w-32 h-32 border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center overflow-hidden p-0"
                          >
                            {completionData.profilePhoto ? (
                              <img
                                src={URL.createObjectURL(completionData.profilePhoto)}
                                alt="Photo de profil"
                                className="object-cover w-full h-full"
                              />
                            ) : avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="Photo de profil"
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <>
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-500 text-xl">+</span>
                                </div>
                                <span className="text-sm text-gray-600">Ajouter une photo</span>
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Accordéon Parcours scolaire */}
            <Card className="border-border">
              <CardContent className="p-6">
                <Accordion type="single" collapsible defaultValue="education" className="w-full">
                  <AccordionItem value="education">
                    <AccordionTrigger className="flex items-center justify-between hover:no-underline">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          completionData.educationLevel && completionData.classes && completionData.subjects ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {completionData.educationLevel && completionData.classes && completionData.subjects ? <Check className="w-4 h-4" /> : <span>2</span>}
                        </div>
                        <span className="text-lg font-medium">Parcours scolaire</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="educationLevel">Niveau d'enseignement <span className="text-red-500">*</span></Label>
                          <Select value={completionData.educationLevel} onValueChange={(value) => setCompletionData(prev => ({ ...prev, educationLevel: value }))}>
                            <SelectTrigger className="text-xs">
                              <SelectValue placeholder="Sélectionnez votre niveau" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="primaire">Primaire</SelectItem>
                              <SelectItem value="college">Collège</SelectItem>
                              <SelectItem value="lycee">Lycée</SelectItem>
                              <SelectItem value="superieur">Supérieur</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="classes">Classes <span className="text-red-500">*</span></Label>
                          <Input
                            id="classes"
                            value={completionData.classes}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, classes: e.target.value }))}
                            placeholder="Ex: 2nde, 1ère, Terminale"
                            required
                            className="text-xs"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="subjects">Matières <span className="text-red-500">*</span></Label>
                          <Input
                            id="subjects"
                            value={completionData.subjects}
                            onChange={(e) => setCompletionData(prev => ({ ...prev, subjects: e.target.value }))}
                            placeholder="Ex: Mathématiques, Physique, Histoire"
                            required
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Accordéon Abonnement */}
            <Card className="border-border">
              <CardContent className="p-6">
                <Accordion type="single" collapsible defaultValue="subscription" className="w-full">
                  <AccordionItem value="subscription">
                    <AccordionTrigger className="flex items-center justify-between hover:no-underline">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          completionData.subscription ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {completionData.subscription ? <Check className="w-4 h-4" /> : <span>3</span>}
                        </div>
                        <span className="text-lg font-medium">Abonnement</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-4">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Type d'abonnement *</Label>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Abonnement Basique */}
                            <Card
                              className={`cursor-pointer border-2 transition-all duration-300 hover:shadow-lg ${
                                completionData.subscription === 'basic' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setCompletionData(prev => ({ ...prev, subscription: 'basic' }))}
                            >
                              <CardContent className="p-4">
                                <div className="text-center mb-4">
                                  <h3 className="text-xl font-semibold">Basique</h3>
                                  <div className="text-2xl font-bold text-primary">
                                    Gratuit
                                  </div>
                                </div>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Modèle IA: basique</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Stockage: limité</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Tokens: faible</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Rapidité: standard</span>
                                  </li>
                                </ul>
                                <Button
                                  variant={completionData.subscription === 'basic' ? "default" : "outline"}
                                  className="w-full mt-4"
                                  onClick={() => setCompletionData(prev => ({ ...prev, subscription: 'basic' }))}
                                >
                                  {completionData.subscription === 'basic' ? "Sélectionné" : "Choisir"}
                                </Button>
                              </CardContent>
                            </Card>

                            {/* Abonnement Premium */}
                            <Card
                              className={`cursor-not-allowed border-2 transition-all duration-300 opacity-50 relative ${
                                completionData.subscription === 'premium' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                                  Populaire
                                </span>
                              </div>
                              <CardContent className="p-4">
                                <div className="text-center mb-4">
                                  <h3 className="text-xl font-semibold">Premium</h3>
                                  <div className="text-2xl font-bold text-muted-foreground">
                                    9,99€
                                    <span className="text-sm font-normal">/mois</span>
                                  </div>
                                </div>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Modèle IA: avancé</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Stockage: modéré</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Tokens: moyen</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Rapidité: prioritaire</span>
                                  </li>
                                </ul>
                                <Button
                                  variant="outline"
                                  className="w-full mt-4"
                                  disabled
                                >
                                  Bientôt disponible
                                </Button>
                              </CardContent>
                            </Card>

                            {/* Abonnement Pro */}
                            <Card
                              className={`cursor-not-allowed border-2 transition-all duration-300 opacity-50 ${
                                completionData.subscription === 'pro' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="text-center mb-4">
                                  <h3 className="text-xl font-semibold">Pro</h3>
                                  <div className="text-2xl font-bold text-muted-foreground">
                                    19,99€
                                    <span className="text-sm font-normal">/mois</span>
                                  </div>
                                </div>
                                <ul className="space-y-2 text-sm">
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Modèle IA: pro</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Stockage: illimité</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Tokens: illimité</span>
                                  </li>
                                  <li className="flex items-center space-x-2">
                                    <Check className="w-4 h-4 text-green-500" />
                                    <span>Rapidité: ultra prioritaire</span>
                                  </li>
                                </ul>
                                <Button
                                  variant="outline"
                                  className="w-full mt-4"
                                  disabled
                                >
                                  Bientôt disponible
                                </Button>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Bouton de finalisation en dehors des containers */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleCompletionSubmit}
              disabled={!canProceedCompletion() || loading}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            >
              {loading ? "Finalisation..." : "✨ Finaliser mon profil"}
            </Button>
          </div>
        </div>
        )}

        {/* Section profil normal (grisée si profil incomplet) */}
        <div className={isProfileIncomplete ? "opacity-50 pointer-events-none" : ""}>
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-2xl">Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Photo et nom utilisateur */}
            <div className="flex items-center space-x-4 mb-6 pb-6 border-b">
              <Avatar className="w-16 h-16">
                <AvatarImage src={avatarUrl ?? undefined} alt={form.full_name || form.email || 'Avatar'} />
                <AvatarFallback className="text-lg">
                  {(form.full_name || form.email || 'P').slice(0,1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">
                  {form.full_name || 'Nom non renseigné'}
                </h2>
                <p className="text-sm text-muted-foreground">{form.email}</p>
              </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto sm:h-10">
                <TabsTrigger value="general" className="text-sm sm:text-sm py-3 sm:py-2">Informations générales</TabsTrigger>
                <TabsTrigger value="education" className="text-sm sm:text-sm py-3 sm:py-2">Informations scolaires</TabsTrigger>
                <TabsTrigger value="subscription" className="text-sm sm:text-sm py-3 sm:py-2">Abonnement</TabsTrigger>
              </TabsList>

              {/* Onglet Informations générales */}
              <TabsContent value="general" className="space-y-6 mt-6">
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="flex items-center space-x-6">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={avatarUrl ?? undefined} alt={form.full_name || form.email || 'Avatar'} />
                      <AvatarFallback>{(form.full_name || form.email || 'P').slice(0,1).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        id="avatar"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        disabled={loading}
                      />
                      <Button type="button" onClick={() => document.getElementById('avatar')?.click()} disabled={loading}>
                        {loading ? 'Chargement...' : 'Changer la photo'}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Nom complet</Label>
                      <Input value={form.full_name} onChange={(e) => onChange('full_name', e.target.value)} placeholder="Votre nom" />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={form.email} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input value={form.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="Votre téléphone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Pays</Label>
                      <Input value={form.country} onChange={(e) => onChange('country', e.target.value)} placeholder="Votre pays" />
                    </div>
                    <div className="space-y-2">
                      <Label>Ville</Label>
                      <Input value={form.city} onChange={(e) => onChange('city', e.target.value)} placeholder="Votre ville" />
                    </div>
                    <div className="space-y-2">
                      <Label>Code postal</Label>
                      <Input value={form.postal_code} onChange={(e) => onChange('postal_code', e.target.value)} placeholder="Votre code postal" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Onglet Informations scolaires */}
              <TabsContent value="education" className="space-y-6 mt-6">
                <form onSubmit={handleSave} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Niveau d'enseignement</Label>
                      <Input value={form.education_level} onChange={(e) => onChange('education_level', e.target.value)} placeholder="Ex: Collège, Lycée" />
                    </div>
                    <div className="space-y-2">
                      <Label>Classes</Label>
                      <Input value={form.classes} onChange={(e) => onChange('classes', e.target.value)} placeholder="Ex: 2nde, 1ère" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Matières</Label>
                      <Input value={form.subjects} onChange={(e) => onChange('subjects', e.target.value)} placeholder="Ex: Mathématiques, Physique" />
                    </div>
                    <div className="space-y-2">
                      <Label>Code de liaison</Label>
                      <Input value={form.link_code} onChange={(e) => onChange('link_code', e.target.value)} placeholder="Code de liaison" />
                    </div>
                    <div className="space-y-2">
                      <Label>Relation de liaison</Label>
                      <Input value={form.link_relation} onChange={(e) => onChange('link_relation', e.target.value)} placeholder="Type de relation" />
                    </div>
                    <div className="space-y-2">
                      <Label>ENT</Label>
                      <Input value={form.ent} onChange={(e) => onChange('ent', e.target.value)} placeholder="Votre ENT" />
                    </div>
                    <div className="space-y-2">
                      <Label>Niveau IA</Label>
                      <Input value={form.ai_level} onChange={(e) => onChange('ai_level', e.target.value)} placeholder="Votre niveau IA" />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* Onglet Abonnement */}
              <TabsContent value="subscription" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Abonnement Basique */}
                  <Card className={`border-2 transition-all duration-300 ${
                    form.subscription === 'basic' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200'
                  }`}>
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold">Basique</h3>
                        <div className="text-2xl font-bold text-primary">
                          Gratuit
                        </div>
                        {form.subscription === 'basic' && (
                          <div className="mt-2 text-sm text-blue-600 font-medium">
                            ✓ Abonnement actuel
                          </div>
                        )}
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Modèle IA: basique</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Stockage: limité</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Tokens: faible</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Rapidité: standard</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  {/* Abonnement Premium */}
                  <Card className={`border-2 transition-all duration-300 ${
                    form.subscription === 'premium' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 opacity-50'
                  } relative`}>
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                        Populaire
                      </span>
                    </div>
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold">Premium</h3>
                        <div className="text-2xl font-bold text-muted-foreground">
                          9,99€
                          <span className="text-sm font-normal">/mois</span>
                        </div>
                        {form.subscription === 'premium' && (
                          <div className="mt-2 text-sm text-blue-600 font-medium">
                            ✓ Abonnement actuel
                          </div>
                        )}
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Modèle IA: avancé</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Stockage: modéré</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Tokens: moyen</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Rapidité: prioritaire</span>
                        </li>
                      </ul>
                      <Button 
                        variant="outline"
                        className="w-full mt-4"
                        disabled
                      >
                        Bientôt disponible
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Abonnement Pro */}
                  <Card className={`border-2 transition-all duration-300 ${
                    form.subscription === 'pro' ? 'border-blue-500 bg-blue-50 shadow-md' : 'border-gray-200 opacity-50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-semibold">Pro</h3>
                        <div className="text-2xl font-bold text-muted-foreground">
                          19,99€
                          <span className="text-sm font-normal">/mois</span>
                        </div>
                        {form.subscription === 'pro' && (
                          <div className="mt-2 text-sm text-blue-600 font-medium">
                            ✓ Abonnement actuel
                          </div>
                        )}
                      </div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Modèle IA: pro</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Stockage: illimité</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Tokens: illimité</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span>Rapidité: ultra prioritaire</span>
                        </li>
                      </ul>
                      <Button 
                        variant="outline"
                        className="w-full mt-4"
                        disabled
                      >
                        Bientôt disponible
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Section Styles d'apprentissage - affichée uniquement si pas complété et pas d'infos */}
        {!form.learning_styles_completed && (!profilesInfos || !Object.values(profilesInfos).some(value => value)) && (
          <Card className="border-border mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Styles d'apprentissage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                Remplez le questionnaire de styles d'apprentissage pour personnaliser votre expérience.
              </p>
              <Button
                onClick={() => setShowSurveyDialog(true)}
                variant="outline"
                className="w-full"
              >
                Remplir les styles d'apprentissage
              </Button>
            </CardContent>
          </Card>
        )}



        {profilesInfos && Object.values(profilesInfos).some(value => value) && (
          <Card className="border-border mt-8">
            <CardHeader>
              <CardTitle className="text-2xl">Infos d'apprentissage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2 relative">
                <Label>1. Préférence d'apprentissage</Label>
                <AutoResizeTextarea value={profilesInfos.pref_apprendre_idee ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('pref_apprendre_idee', profilesInfos.pref_apprendre_idee ?? '')}
                  aria-label="Modifier la préférence d'apprentissage"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>2. Mémoire et mémorisation</Label>
                <AutoResizeTextarea value={profilesInfos.memoire_poesie ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('memoire_poesie', profilesInfos.memoire_poesie ?? '')}
                  aria-label="Modifier la mémoire et mémorisation"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>3. Résolution de problèmes</Label>
                <AutoResizeTextarea value={profilesInfos.resoudre_maths ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('resoudre_maths', profilesInfos.resoudre_maths ?? '')}
                  aria-label="Modifier la résolution de problèmes"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>4. Intérêts personnels</Label>
                <AutoResizeTextarea value={profilesInfos.temps_libre_pref ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('temps_libre_pref', profilesInfos.temps_libre_pref ?? '')}
                  aria-label="Modifier les intérêts personnels"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>5. Travail en groupe</Label>
                <AutoResizeTextarea value={profilesInfos.travail_groupe_role ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('travail_groupe_role', profilesInfos.travail_groupe_role ?? '')}
                  aria-label="Modifier le travail en groupe"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>6. Rétention d'information</Label>
                <AutoResizeTextarea value={profilesInfos.retenir_info ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('retenir_info', profilesInfos.retenir_info ?? '')}
                  aria-label="Modifier la rétention d'information"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>7. Préférence d'enseignement</Label>
                <AutoResizeTextarea value={profilesInfos.pref_enseignant ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('pref_enseignant', profilesInfos.pref_enseignant ?? '')}
                  aria-label="Modifier la préférence d'enseignement"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>8. Découverte de nouveaux lieux</Label>
                <AutoResizeTextarea value={profilesInfos.decouvrir_endroit ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('decouvrir_endroit', profilesInfos.decouvrir_endroit ?? '')}
                  aria-label="Modifier la découverte de nouveaux lieux"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>9. Définition de la réussite</Label>
                <AutoResizeTextarea value={profilesInfos.reussir_definition ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('reussir_definition', profilesInfos.reussir_definition ?? '')}
                  aria-label="Modifier la définition de la réussite"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 relative">
                <Label>10. Rappel de souvenirs</Label>
                <AutoResizeTextarea value={profilesInfos.souvenir_important ?? ""} disabled />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 mt-7 mr-2 flex hover:bg-blue-50"
                  onClick={() => handleEditQuestion('souvenir_important', profilesInfos.souvenir_important ?? '')}
                  aria-label="Modifier le rappel de souvenirs"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section pour refaire les questionnaires */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Questionnaires de personnalisation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Refaites les questionnaires de prédétection de troubles et de styles d'apprentissage pour mettre à jour votre profil.
            </p>
            <Button
              onClick={handleRetakeQuestionnaires}
              variant="outline"
              className="w-full"
            >
              Refaire les questionnaires de prédétection
            </Button>
          </CardContent>
        </Card>

        {/* Section pour changer le mot de passe */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Changer le mot de passe</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={passwordLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmNewPassword">Confirmer le nouveau mot de passe</Label>
                <Input
                  id="confirmNewPassword"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={passwordLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={passwordLoading}>
                  {passwordLoading ? 'Enregistrement...' : 'Changer le mot de passe'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section pour changer l'email */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="text-2xl">Changer l'email</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newEmail">Nouvel email</Label>
                <Input
                  id="newEmail"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="nouvel.email@example.com"
                  required
                  disabled={emailLoading}
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={emailLoading}>
                  {emailLoading ? 'Enregistrement...' : 'Changer l\'email'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Section pour se déconnecter */}
        <Card className="border-red-200 bg-red-50/50 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl text-red-700">Se déconnecter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-red-600">
                Vous serez redirigé vers la page de connexion après déconnexion.
              </p>
              <div className="flex justify-end">
                <Button 
                  onClick={handleLogout}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modal d'édition des questions */}
        <ProfileQuestionEditModal
          isOpen={editModal.isOpen}
          onClose={handleCloseModal}
          questionKey={editModal.questionKey}
          currentValue={editModal.currentValue}
          onSave={handleSaveQuestion}
        />

        {/* Dialogue des styles d'apprentissage */}
        <InformationSurveyDialog
          isOpen={showSurveyDialog}
          onClose={() => setShowSurveyDialog(false)}
          onSurveyComplete={() => {
            setShowSurveyDialog(false);
            window.location.reload(); // Recharger pour mettre à jour les données
          }}
          initialQuestionIndex={0}
          initialAnswers={{}}
          onQuestionIndexChange={() => {}}
          onAnswersChange={() => {}}
        />
        </div>
        {/* Fin de la section profil normal */}
        
      </div>
      <BottomNav />
    </div>
  );
};

export default Profile;
