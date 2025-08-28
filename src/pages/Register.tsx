import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { StepIndicator } from "@/components/register/StepIndicator";
import { RoleStep } from "@/components/register/RoleStep";
import { SubscriptionStep } from "@/components/register/SubscriptionStep";
import { InformationStep } from "@/components/register/InformationStep";
import { EducationStep } from "@/components/register/EducationStep";
import { PersonalInfoStep } from "@/components/register/PersonalInfoStep";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Role
    role: "",
    // Step 2: Personal Info
    fullName: "",
    email: "",
    phone: "",
    password: "",
    // Step 3: Information
    country: "",
    city: "",
    postalCode: "",
    profilePhoto: null as File | null,
    linkCode: "",
    linkRelation: "",
    ent: "",
    aiLevel: "",
    // Step 4: Education
    educationLevel: "",
    classes: "",
    subjects: "",
    // Step 5: Subscription
    subscription: "",
  });

  const stepTitles = ["Rôle", "Compte", "Informations", "Parcours scolaire", "Abonnement"];

  const handleFormDataChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = async () => {
    if (currentStep === 2) {
      // Logique de création de compte déplacée ici
      setLoading(true);
      try {
        const userData = {
          full_name: formData.fullName,
          role: formData.role,
          phone: formData.phone,
        };

        const { error } = await signUp(formData.email, formData.password, userData);
        
        if (error) {
          console.error("Erreur d'inscription Supabase:", error);
          toast({
            title: "Erreur d'inscription",
            description: error.message,
            variant: "destructive",
          });
          setLoading(false); // Arrêter le chargement en cas d'erreur
          return; // Ne pas passer à l'étape suivante en cas d'erreur
        } else {
          // Connexion automatique après création du compte
          const { error: autoSignInError } = await signIn(formData.email, formData.password);
          if (autoSignInError) {
            toast({
              title: "Vérification requise",
              description: "Confirmez votre email depuis votre boîte mail",
            });
            setLoading(false);
            return;
          }

          // Récupérer l'ID utilisateur et créer/mettre à jour le profil initial
          const { data: userResp } = await supabase.auth.getUser();
          const uid = userResp.user?.id;

          if (uid) {
            const profileData = {
              full_name: formData.fullName,
              email: formData.email,
              role: formData.role,
              phone: formData.phone,
              // Les autres champs seront mis à jour aux étapes suivantes
            };

            // Vérifier si le profil existe déjà
            const { data: existingProfile, error: fetchError } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', uid)
              .maybeSingle();

            if (fetchError) {
              console.error('Erreur lors de la vérification du profil existant:', fetchError);
            } else if (existingProfile) {
              // Si le profil existe, le mettre à jour
              const { error: updateError } = await supabase
                .from('profiles')
                .update(profileData)
                .eq('user_id', uid);
              if (updateError) console.error('Erreur mise à jour profil initial:', updateError);
            } else {
              // Si le profil n'existe pas, l'insérer
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({ ...profileData, user_id: uid });
              if (insertError) console.error('Erreur création profil initial:', insertError);
            }
          }
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la création du compte",
          variant: "destructive",
        });
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 5 && termsAccepted && privacyAccepted) {
      setLoading(true);
      
      try {
        // Préparer l'URL de photo (upload après connexion pour utiliser l'ID utilisateur)
        let profilePhotoUrl: string | null = null;

        // Récupérer l'ID utilisateur
        const { data: userResp } = await supabase.auth.getUser();
        const uid = userResp.user?.id;

        if (!uid) {
          toast({
            title: "Erreur",
            description: "Utilisateur non connecté. Veuillez vous reconnecter.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        // Uploader la photo de profil si elle existe
        if (formData.profilePhoto) {
          const fileExt = formData.profilePhoto.name.split('.').pop();
          const fileName = `${Date.now()}.${fileExt}`;
          const filePath = `${uid}/${fileName}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('profile-photos')
            .upload(filePath, formData.profilePhoto, { upsert: true });
          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from('profile-photos')
              .getPublicUrl(uploadData.path);
            profilePhotoUrl = urlData.publicUrl;
          } else {
            console.error('Erreur upload photo:', uploadError);
          }
        }

        // Mettre à jour le profil avec les données des étapes 3, 4 et 5
        const profileUpdate = {
          country: formData.country,
          city: formData.city,
          postal_code: formData.postalCode,
          education_level: formData.educationLevel, // Cette valeur est-elle correcte ?
          classes: formData.classes,
          subjects: formData.subjects,
          link_code: formData.linkCode,
          link_relation: formData.linkRelation,
          ent: formData.ent,
          ai_level: formData.aiLevel,
          ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {})
        };

        console.log("Mise à jour du profil avec:", profileUpdate); // Ajout du console.log

        const { error: profileError } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('user_id', uid);

        if (profileError) {
          console.error('Erreur mise à jour profil final:', profileError);
          toast({
            title: "Erreur de mise à jour du profil",
            description: profileError.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Compte créé et profil mis à jour avec succès!",
            description: "Redirection vers votre dashboard",
          });
          navigate("/dashboard");
        }
      } catch (error) {
        console.error('Erreur inattendue lors de la finalisation du compte:', error); // Ajout pour débogage
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la finalisation du compte",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.role !== "";
      case 2:
        return formData.fullName && formData.email && formData.password && termsAccepted && privacyAccepted && !loading; // Ajout de !loading
      case 3:
        return formData.country !== "" && formData.city !== "" && formData.postalCode !== "";
      case 4:
        return formData.educationLevel !== "" && formData.classes !== "" && formData.subjects !== "";
      case 5:
        return formData.subscription !== "";
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <RoleStep 
            selectedRole={formData.role}
            onRoleSelect={(role) => { handleFormDataChange('role', role); setTimeout(() => handleNext(), 150); }}
          />
        );
      case 2:
        return (
          <PersonalInfoStep 
            formData={formData}
            onFormDataChange={handleFormDataChange}
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            onTermsChange={setTermsAccepted}
            onPrivacyChange={setPrivacyAccepted}
            loading={loading} // Passer l'état de chargement
          />
        );
      case 3:
        return (
          <InformationStep 
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 4:
        return (
          <EducationStep 
            formData={formData}
            onFormDataChange={handleFormDataChange}
          />
        );
      case 5:
        return (
          <SubscriptionStep 
            selectedSubscription={formData.subscription}
            onSubscriptionSelect={(subscription) => handleFormDataChange('subscription', subscription)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background py-8 px-6">
        <div className="max-w-4xl mx-auto animate-fade-in">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-8">
              Créer un compte
            </h1>
            <StepIndicator 
              currentStep={currentStep}
              totalSteps={5}
              stepTitles={stepTitles}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="animate-fade-in">{renderStep()}</div>
            
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrev}
                disabled={currentStep === 1 || loading} // Désactiver pendant le chargement
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </Button>
              
              {currentStep < 5 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed() || loading} // Désactiver pendant le chargement
                  className="flex items-center space-x-2"
                >
                  <span>Suivant</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                  ) : (
                    <Button 
                      type="submit"
                      disabled={!canProceed() || loading}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                    >
                      {loading ? "Finalisation..." : "Créer un compte"}
                    </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Register;
