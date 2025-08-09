import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { useState } from "react";

const subjects = [
  "Mathématiques",
  "Français", 
  "Anglais",
  "Histoire-Géographie",
  "Physique-Chimie",
  "SVT",
  "Philosophie",
  "Économie",
  "Informatique",
  "Autre"
];

const classes = [
  "CP", "CE1", "CE2", "CM1", "CM2", // Primaire
  "6ème", "5ème", "4ème", "3ème", // Collège
  "Seconde", "Première", "Terminale", // Lycée
  "Bac+1", "Bac+2", "Bac+3", "Bac+4", "Bac+5+" // Supérieur
];

interface InformationStepProps {
  formData: {
    country: string;
    city: string;
    postalCode: string;
    educationLevel: string;
    classes: string;
    subjects: string;
    profilePhoto: File | null;
  };
  onFormDataChange: (field: string, value: string | File | null) => void;
}

export const InformationStep = ({ formData, onFormDataChange }: InformationStepProps) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    formData.subjects ? formData.subjects.split(',').map(s => s.trim()) : []
  );

  const handleSubjectChange = (subject: string) => {
    const newSelection = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    
    setSelectedSubjects(newSelection);
    onFormDataChange('subjects', newSelection.join(', '));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFormDataChange('profilePhoto', file);
  };

  const removePhoto = () => {
    onFormDataChange('profilePhoto', null);
  };
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Informations complémentaires
        </h2>
        <p className="text-muted-foreground">
          Complétez votre profil pour une expérience personnalisée
        </p>
      </div>

      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Localisation */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Localisation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Pays *</Label>
              <Select value={formData.country} onValueChange={(value) => onFormDataChange('country', value)}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  <SelectItem value="france">France</SelectItem>
                  <SelectItem value="belgium">Belgique</SelectItem>
                  <SelectItem value="switzerland">Suisse</SelectItem>
                  <SelectItem value="canada">Canada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => onFormDataChange('city', e.target.value)}
                placeholder="Paris"
                className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postalCode">Code postal *</Label>
              <Input
                id="postalCode"
                value={formData.postalCode}
                onChange={(e) => onFormDataChange('postalCode', e.target.value)}
                placeholder="75001"
                className="transition-all duration-200 hover:border-primary/50 focus:border-primary"
              />
            </div>
          </div>
        </div>

        {/* Informations académiques */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Informations académiques</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Niveau d'enseignement</Label>
              <Select value={formData.educationLevel} onValueChange={(value) => onFormDataChange('educationLevel', value)}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                  <SelectValue placeholder="Sélectionnez le niveau" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  <SelectItem value="primaire">Primaire</SelectItem>
                  <SelectItem value="college">Collège</SelectItem>
                  <SelectItem value="lycee">Lycée</SelectItem>
                  <SelectItem value="superieur">Supérieur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Classe(s)</Label>
              <Select value={formData.classes} onValueChange={(value) => onFormDataChange('classes', value)}>
                <SelectTrigger className="transition-all duration-200 hover:border-primary/50 focus:border-primary">
                  <SelectValue placeholder="Sélectionnez la/les classe(s)" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg max-h-60">
                  {classes.map((classe) => (
                    <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Matières */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Matière(s) *</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {subjects.map((subject) => (
              <div 
                key={subject}
                className={`group cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
                  selectedSubjects.includes(subject) 
                    ? 'bg-primary/10 border-primary' 
                    : 'bg-background border-border hover:border-primary/50'
                } border rounded-lg p-3 flex items-center space-x-3`}
                onClick={() => handleSubjectChange(subject)}
              >
                <div className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  selectedSubjects.includes(subject)
                    ? 'bg-primary border-primary'
                    : 'border-border group-hover:border-primary/50'
                }`}>
                  {selectedSubjects.includes(subject) && (
                    <div className="w-full h-full rounded-full bg-primary scale-75"></div>
                  )}
                </div>
                <span className={`text-sm transition-colors duration-200 ${
                  selectedSubjects.includes(subject) 
                    ? 'text-primary font-medium' 
                    : 'text-foreground group-hover:text-primary'
                }`}>
                  {subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Photo de profil */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-foreground">Photo de profil</h3>
          <div className="flex items-center justify-center">
            {formData.profilePhoto ? (
              <div className="relative group">
                <div className="w-32 h-32 bg-primary/10 border-2 border-primary border-dashed rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={URL.createObjectURL(formData.profilePhoto)} 
                    alt="Photo de profil" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  onClick={removePhoto}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="cursor-pointer group">
                <div className="w-32 h-32 bg-background border-2 border-dashed border-border group-hover:border-primary transition-all duration-200 rounded-full flex flex-col items-center justify-center space-y-2 group-hover:bg-primary/5">
                  <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors duration-200">
                    Ajouter une photo
                  </span>
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
  );
};