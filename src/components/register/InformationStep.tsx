import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Upload, X, ChevronDown, Check } from "lucide-react";
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
    linkCode: string;
    linkRelation: string;
    ent: string;
    aiLevel: string;
  };
  onFormDataChange: (field: string, value: string | File | null) => void;
}

export const InformationStep = ({ formData, onFormDataChange }: InformationStepProps) => {
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    formData.subjects ? formData.subjects.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
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

      {/* Container spécifique à l'étape 3 - 90% mobile, 80% desktop, sans bordures */}
      <div className="w-[90%] md:w-4/5 mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-sm">
          
          {/* Localisation */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="country" className="text-sm font-medium text-foreground">Pays *</Label>
                <Select value={formData.country} onValueChange={(value) => onFormDataChange('country', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Sélectionner un pays" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl">
                    <SelectItem value="france">France</SelectItem>
                    <SelectItem value="belgium">Belgique</SelectItem>
                    <SelectItem value="switzerland">Suisse</SelectItem>
                    <SelectItem value="canada">Canada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label htmlFor="city" className="text-sm font-medium text-foreground">Ville *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => onFormDataChange('city', e.target.value)}
                  placeholder="Ville"
                  className="h-12 border-0 bg-muted/50 rounded-xl text-sm placeholder:text-xs focus:bg-background transition-all duration-200"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="postalCode" className="text-sm font-medium text-foreground">Code postal *</Label>
                <Input
                  id="postalCode"
                  value={formData.postalCode}
                  onChange={(e) => onFormDataChange('postalCode', e.target.value)}
                  placeholder="Code post"
                  className="h-12 border-0 bg-muted/50 rounded-xl text-sm placeholder:text-xs focus:bg-background transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Informations académiques */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Niveau d'enseignement</Label>
                <Select value={formData.educationLevel} onValueChange={(value) => onFormDataChange('educationLevel', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Sélectionnez le niveau" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl">
                    <SelectItem value="primaire">Primaire</SelectItem>
                    <SelectItem value="college">Collège</SelectItem>
                    <SelectItem value="lycee">Lycée</SelectItem>
                    <SelectItem value="superieur">Supérieur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Classe(s)</Label>
                <Select value={formData.classes} onValueChange={(value) => onFormDataChange('classes', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Sélectionnez la/les classe(s)" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl max-h-60">
                    {classes.map((classe) => (
                      <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Matières */}
          <div className="space-y-6 mb-8">
            <Label className="text-sm font-medium text-foreground">Matière(s) *</Label>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between border-0 bg-muted/50 rounded-xl text-sm hover:bg-background transition-all duration-200"
                >
                  <span className="text-left text-xs">
                    {selectedSubjects.length === 0 
                      ? "Sélectionnez une ou plusieurs matières"
                      : selectedSubjects.length === 1
                      ? selectedSubjects[0]
                      : `${selectedSubjects.length} matières sélectionnées`
                    }
                  </span>
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 bg-background border border-border shadow-lg rounded-xl" align="start">
                <div className="max-h-60 overflow-y-auto p-2">
                  {subjects.map((subject) => (
                    <div
                      key={subject}
                      className="flex items-center space-x-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors duration-200"
                      onClick={() => handleSubjectChange(subject)}
                    >
                      <Checkbox
                        checked={selectedSubjects.includes(subject)}
                        onChange={() => handleSubjectChange(subject)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <span className="text-sm text-foreground">{subject}</span>
                      {selectedSubjects.includes(subject) && (
                        <Check className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Affichage des matières sélectionnées sous forme de tags */}
            {selectedSubjects.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSubjects.map((subject) => (
                  <span
                    key={subject}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    {subject}
                    <button
                      type="button"
                      onClick={() => handleSubjectChange(subject)}
                      className="ml-1 hover:bg-primary/20 rounded-full p-0.5 transition-colors duration-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section de liaison */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="linkCode" className="text-sm font-medium text-foreground">Code de liaison</Label>
                <Input
                  id="linkCode"
                  value={formData.linkCode}
                  onChange={(e) => onFormDataChange('linkCode', e.target.value)}
                  placeholder="Code de liaison"
                  className="h-12 border-0 bg-muted/50 rounded-xl text-sm placeholder:text-xs focus:bg-background transition-all duration-200"
                />
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Relation liaison</Label>
                <Select value={formData.linkRelation} onValueChange={(value) => onFormDataChange('linkRelation', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Type de relation" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl">
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="tuteur">Tuteur</SelectItem>
                    <SelectItem value="enseignant">Enseignant</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section ENT et IA */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">ENT / Pronote</Label>
                <Select value={formData.ent} onValueChange={(value) => onFormDataChange('ent', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Sélectionnez votre ENT" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl">
                    <SelectItem value="pronote">Pronote</SelectItem>
                    <SelectItem value="elyco">Elyco</SelectItem>
                    <SelectItem value="eclat-bfc">Eclat-BFC</SelectItem>
                    <SelectItem value="monbureaunumerique">MonBureauNumerique</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Niveau de l'IA</Label>
                <Select value={formData.aiLevel} onValueChange={(value) => onFormDataChange('aiLevel', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Niveau souhaité" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl">
                    <SelectItem value="debutant">Débutant</SelectItem>
                    <SelectItem value="intermediaire">Intermédiaire</SelectItem>
                    <SelectItem value="avance">Avancé</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Photo de profil */}
          <div className="space-y-6">
            <Label className="text-sm font-medium text-foreground">Photo de profil</Label>
            <div className="flex items-center justify-center">
              {formData.profilePhoto ? (
                <div className="relative group">
                  <div className="w-32 h-32 bg-muted/50 border-2 border-dashed border-primary rounded-2xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={URL.createObjectURL(formData.profilePhoto)} 
                      alt="Photo de profil" 
                      className="w-full h-full object-cover rounded-2xl"
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
                  <div className="w-32 h-32 bg-muted/50 border-2 border-dashed border-border group-hover:border-primary transition-all duration-200 rounded-2xl flex flex-col items-center justify-center space-y-2 group-hover:bg-primary/5">
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
    </div>
  );
};