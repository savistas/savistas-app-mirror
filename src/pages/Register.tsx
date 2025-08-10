import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { StepIndicator } from "@/components/register/StepIndicator";
import { RoleStep } from "@/components/register/RoleStep";
import { SubscriptionStep } from "@/components/register/SubscriptionStep";
import { InformationStep } from "@/components/register/InformationStep";
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
    // Step 2: Subscription
    subscription: "",
    // Step 3: Information
    country: "",
    city: "",
    postalCode: "",
    educationLevel: "",
    classes: "",
    subjects: "",
    profilePhoto: null as File | null,
    linkCode: "",
    linkRelation: "",
    ent: "",
    aiLevel: "",
    // Step 4: Personal Info
    fullName: "",
    email: "",
    phone: "",
    password: ""
  });

  const stepTitles = ["Rôle", "Abonnement", "Informations", "Compte"];

  const handleFormDataChange = (field: string, value: string | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentStep < 4) {
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
    if (currentStep === 4 && termsAccepted && privacyAccepted) {
      setLoading(true);
      
      try {
        // Préparer l'URL de photo (upload après connexion pour utiliser l'ID utilisateur)
        let profilePhotoUrl: string | null = null;

        // Créer le compte avec toutes les données du formulaire
        const userData = {
          full_name: formData.fullName,
          role: formData.role,
          subscription: formData.subscription,
          country: formData.country,
          city: formData.city,
          postal_code: formData.postalCode,
          education_level: formData.educationLevel,
          classes: formData.classes,
          subjects: formData.subjects,
          phone: formData.phone,
          link_code: formData.linkCode,
          link_relation: formData.linkRelation,
          ent: formData.ent,
          ai_level: formData.aiLevel,
          profile_photo_url: profilePhotoUrl
        };

        const { error } = await signUp(formData.email, formData.password, userData);
        
        if (error) {
          toast({
            title: "Erreur d'inscription",
            description: error.message,
            variant: "destructive",
          });
        } else {
          // Connexion automatique après création du compte
          const { error: autoSignInError } = await signIn(formData.email, formData.password);
          if (autoSignInError) {
            toast({
              title: "Vérification requise",
              description: "Confirmez votre email depuis votre boîte mail",
            });
            return;
          }

          // Récupérer l'ID utilisateur puis uploader la photo dans le dossier de l'utilisateur
          const { data: userResp } = await supabase.auth.getUser();
          const uid = userResp.user?.id;
          if (uid && formData.profilePhoto) {
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
            }
          }

          // Vérifier l'existence du profil puis mettre à jour/insérer
          const { data: existing } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', uid as string)
            .maybeSingle();

          const profileUpdate = { ...userData, email: formData.email, ...(profilePhotoUrl ? { profile_photo_url: profilePhotoUrl } : {}) };

          if (existing) {
            const { error: profileError } = await supabase
              .from('profiles')
              .update(profileUpdate)
              .eq('user_id', uid as string);
            if (profileError) console.error('Erreur mise à jour profil:', profileError);
          } else {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({ ...profileUpdate, user_id: uid as string });
            if (insertError) console.error('Erreur création profil:', insertError);
          }

          toast({
            title: "Compte créé avec succès!",
            description: "Redirection vers votre dashboard",
          });
          navigate("/dashboard");
        }
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la création du compte",
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
        return formData.subscription !== "";
      case 3:
        return true; // Information step is optional
      case 4:
        return formData.fullName && formData.email && formData.password && termsAccepted && privacyAccepted;
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
          <SubscriptionStep 
            selectedSubscription={formData.subscription}
            onSubscriptionSelect={(subscription) => handleFormDataChange('subscription', subscription)}
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
          <PersonalInfoStep 
            formData={formData}
            onFormDataChange={handleFormDataChange}
            termsAccepted={termsAccepted}
            privacyAccepted={privacyAccepted}
            onTermsChange={setTermsAccepted}
            onPrivacyChange={setPrivacyAccepted}
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
              totalSteps={4}
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
                disabled={currentStep === 1}
                className="flex items-center space-x-2"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Précédent</span>
              </Button>
              
              {currentStep < 4 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceed()}
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
                      {loading ? "Création..." : "Créer un compte"}
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