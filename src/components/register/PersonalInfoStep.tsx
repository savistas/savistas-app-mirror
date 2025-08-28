import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface PersonalInfoStepProps {
  formData: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  };
  onFormDataChange: (field: string, value: string) => void;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  onTermsChange: (checked: boolean) => void;
  onPrivacyChange: (checked: boolean) => void;
  loading: boolean; // Nouvelle prop
}

export const PersonalInfoStep = ({ 
  formData, 
  onFormDataChange, 
  termsAccepted, 
  privacyAccepted, 
  onTermsChange, 
  onPrivacyChange 
}: PersonalInfoStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Informations personnelles
        </h2>
        <p className="text-muted-foreground">
          Créez votre compte avec vos informations personnelles
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nom complet *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => onFormDataChange('fullName', e.target.value)}
              placeholder="Jean Dupont"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Adresse e-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => onFormDataChange('email', e.target.value)}
              placeholder="jean.dupont@email.com"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone (optionnel)</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => onFormDataChange('phone', e.target.value)}
              placeholder="06 12 34 56 78"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => onFormDataChange('password', e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="terms" 
              checked={termsAccepted}
              onCheckedChange={onTermsChange}
            />
            <Label htmlFor="terms" className="text-sm">
              J'accepte les <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">conditions d'utilisation</a> *
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="privacy" 
              checked={privacyAccepted}
              onCheckedChange={onPrivacyChange}
            />
            <Label htmlFor="privacy" className="text-sm">
              J'accepte la <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">politique de confidentialité</a> *
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
};
