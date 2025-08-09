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

const Register = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 4 && termsAccepted && privacyAccepted) {
      // Here you would normally handle the registration
      console.log("Registration data:", formData);
      navigate("/dashboard");
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
            onRoleSelect={(role) => handleFormDataChange('role', role)}
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
            {renderStep()}
            
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
                  disabled={!canProceed()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  Créer un compte
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