import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface InformationStepProps {
  formData: {
    country: string;
    city: string;
    educationLevel: string;
    classes: string;
    subjects: string;
  };
  onFormDataChange: (field: string, value: string) => void;
}

export const InformationStep = ({ formData, onFormDataChange }: InformationStepProps) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Informations académiques
        </h2>
        <p className="text-muted-foreground">
          Renseignez vos informations pour personnaliser votre expérience
        </p>
      </div>

      <div className="space-y-6 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="country">Pays</Label>
            <Select value={formData.country} onValueChange={(value) => onFormDataChange('country', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un pays" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="france">France</SelectItem>
                <SelectItem value="belgium">Belgique</SelectItem>
                <SelectItem value="switzerland">Suisse</SelectItem>
                <SelectItem value="canada">Canada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="city">Ville/Code postal</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => onFormDataChange('city', e.target.value)}
              placeholder="Paris, 75001"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Niveau d'enseignement</Label>
            <Select value={formData.educationLevel} onValueChange={(value) => onFormDataChange('educationLevel', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un niveau" />
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
            <Label htmlFor="classes">Classe(s)</Label>
            <Input
              id="classes"
              placeholder="Ex: Première S"
              value={formData.classes}
              onChange={(e) => onFormDataChange('classes', e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subjects">Matière(s)</Label>
          <Input
            id="subjects"
            placeholder="Ex: Mathématiques, Physique"
            value={formData.subjects}
            onChange={(e) => onFormDataChange('subjects', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};