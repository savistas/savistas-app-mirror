import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown, Check, X } from "lucide-react";
import { useState, useEffect } from "react";

interface EducationStepProps {
  formData: {
    educationLevel: string;
    classes: string;
    subjects: string;
  };
  onFormDataChange: (field: string, value: string | null) => void;
}

const educationLevels = [
  { value: "primaire", label: "École primaire" },
  { value: "college", label: "Collège" },
  { value: "lycee_general_techno", label: "Lycée – général & techno" },
  { value: "lycee_professionnel", label: "Lycée – professionnel" },
  { value: "post_bac_courts", label: "Post-bac courts" },
  { value: "universite", label: "Université" },
  { value: "ecoles", label: "Écoles" },
  { value: "forces_armees_securite", label: "Forces armées et sécurité" },
  { value: "formations_metiers_artisanat", label: "Formations métiers et artisanat" },
  { value: "formation_continue", label: "Formation continue / reprise d’études" },
];

const classesByEducationLevel: Record<string, string[]> = {
  primaire: ["CP", "CE1", "CE2", "CM1", "CM2"],
  college: ["6ᵉ", "5ᵉ", "4ᵉ", "3ᵉ"],
  lycee_general_techno: ["Seconde", "Première", "Terminale"],
  lycee_professionnel: ["CAP 1ʳᵉ année", "CAP 2ᵉ année", "Seconde pro", "Première pro", "Terminale pro"],
  post_bac_courts: ["BTS 1", "BTS 2", "BUT 1", "BUT 2", "BUT 3", "CPGE 1 (prépa)", "CPGE 2 (prépa)"],
  universite: ["Licence L1", "Licence L2", "Licence L3", "Master M1", "Master M2", "Doctorat (année 1+)"],
  ecoles: ["École d’ingénieur (années 1–5)", "École de commerce / PGE (années 1–3)", "Écoles santé (PASS/LAS ou équivalent)"],
  forces_armees_securite: ["Préparation militaire initiale", "École de sous-officiers", "École d’officiers", "École de la gendarmerie", "École de police", "École des pompiers", "École militaire spécialisée (ex. Saint-Cyr, Navale, Air)"],
  formations_metiers_artisanat: [
    "CAP Coiffure", "CAP Esthétique", "CAP Cuisine", "CAP Boulangerie", "CAP Pâtisserie",
    "CAP Mécanique auto/moto", "CAP Menuiserie", "CAP Électricité", "BP (Brevet Professionnel) Coiffure",
    "BP Esthétique", "BP Métiers de bouche", "Bac pro Métiers de la beauté", "Bac pro Métiers de la restauration",
    "Bac pro Maintenance", "Bac pro Bâtiment / Travaux publics"
  ],
  formation_continue: ["Remise à niveau / Alphabétisation", "Reprise d’études (adultes)", "VAE", "Préparation concours/examen", "Certification professionnelle", "Autre (à préciser)"],
};

const subjectsByEducationLevel: Record<string, string[]> = {
  primaire: ["Lecture / Écriture", "Mathématiques", "Sciences", "Histoire", "Géographie", "Arts plastiques", "Éducation musicale", "Éducation physique et sportive (EPS)"],
  college: ["Français", "Mathématiques", "Anglais", "Histoire-Géographie", "Sciences de la Vie et de la Terre (SVT)", "Physique-Chimie", "Technologie", "EPS", "Arts plastiques", "Musique"],
  lycee_general_techno: ["Français", "Mathématiques", "Physique-Chimie", "SVT", "Histoire-Géographie", "Philosophie", "Langues vivantes (Anglais, Espagnol, Allemand…)", "Sciences économiques et sociales (SES)", "Numérique et sciences informatiques (NSI)", "Enseignement de spécialité (à préciser)"],
  lycee_professionnel: ["Français", "Mathématiques", "Physique-Chimie", "SVT", "Histoire-Géographie", "Philosophie", "Langues vivantes (Anglais, Espagnol, Allemand…)", "Sciences économiques et sociales (SES)", "Numérique et sciences informatiques (NSI)", "Enseignement de spécialité (à préciser)"], // Same as general/techno for now, adjust if needed
  post_bac_courts: ["Sciences (Mathématiques, Physique, Chimie, Biologie, Informatique…)", "Sciences humaines et sociales (Psychologie, Sociologie, Philosophie, Histoire, Géographie…)", "Langues et littérature", "Économie, Gestion, Droit", "Ingénierie, Architecture", "Médecine, Santé, Pharmacie", "Arts, Design, Communication"],
  universite: ["Sciences (Mathématiques, Physique, Chimie, Biologie, Informatique…)", "Sciences humaines et sociales (Psychologie, Sociologie, Philosophie, Histoire, Géographie…)", "Langues et littérature", "Économie, Gestion, Droit", "Ingénierie, Architecture", "Médecine, Santé, Pharmacie", "Arts, Design, Communication"],
  ecoles: ["Sciences (Mathématiques, Physique, Chimie, Biologie, Informatique…)", "Sciences humaines et sociales (Psychologie, Sociologie, Philosophie, Histoire, Géographie…)", "Langues et littérature", "Économie, Gestion, Droit", "Ingénierie, Architecture", "Médecine, Santé, Pharmacie", "Arts, Design, Communication"],
  forces_armees_securite: ["Sciences (Mathématiques, Physique, Chimie, Biologie, Informatique…)", "Sciences humaines et sociales (Psychologie, Sociologie, Philosophie, Histoire, Géographie…)", "Langues et littérature", "Économie, Gestion, Droit", "Ingénierie, Architecture", "Médecine, Santé, Pharmacie", "Arts, Design, Communication"],
  formations_metiers_artisanat: ["Sciences (Mathématiques, Physique, Chimie, Biologie, Informatique…)", "Sciences humaines et sociales (Psychologie, Sociologie, Philosophie, Histoire, Géographie…)", "Langues et littérature", "Économie, Gestion, Droit", "Ingénierie, Architecture", "Médecine, Santé, Pharmacie", "Arts, Design, Communication"],
  formation_continue: ["Alphabétisation / Remise à niveau", "Formation professionnelle (commerce, industrie, services, artisanat…)", "Préparation à un concours ou un examen (à préciser)", "Autre (à préciser)"],
};


export const EducationStep = ({ formData, onFormDataChange }: EducationStepProps) => {
  console.log("EducationStep rendered with formData:", formData);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    formData.subjects ? formData.subjects.split(',').map(s => s.trim()).filter(s => s.length > 0) : []
  );

  const availableClasses = formData.educationLevel ? classesByEducationLevel[formData.educationLevel] || [] : [];
  const availableSubjects = formData.educationLevel ? subjectsByEducationLevel[formData.educationLevel] || [] : [];

  useEffect(() => {
    console.log("EducationStep useEffect triggered. Education Level:", formData.educationLevel);
    // Reset classes and subjects when education level changes
    onFormDataChange('classes', '');
    setSelectedSubjects([]);
    onFormDataChange('subjects', '');
  }, [formData.educationLevel]);

  const handleSubjectChange = (subject: string) => {
    const newSelection = selectedSubjects.includes(subject)
      ? selectedSubjects.filter(s => s !== subject)
      : [...selectedSubjects, subject];
    
    setSelectedSubjects(newSelection);
    onFormDataChange('subjects', newSelection.join(', '));
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Votre parcours scolaire
        </h2>
        <p className="text-muted-foreground">
          Aidez-nous à personnaliser votre expérience en nous parlant de votre éducation.
        </p>
      </div>

      <div className="w-[90%] md:w-4/5 mx-auto">
        <div className="bg-card rounded-2xl p-8 shadow-sm">
          {/* Niveau d'enseignement */}
          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Niveau d'enseignement *</Label>
                <Select value={formData.educationLevel} onValueChange={(value) => onFormDataChange('educationLevel', value)}>
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Sélectionnez le niveau" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl">
                    {educationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Classe(s) */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">Classe(s) *</Label>
                <Select 
                  value={formData.classes} 
                  onValueChange={(value) => onFormDataChange('classes', value)}
                  disabled={!formData.educationLevel}
                >
                  <SelectTrigger className="h-12 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200">
                    <SelectValue placeholder="Sélectionnez la/les classe(s)" className="text-xs" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg rounded-xl max-h-60">
                    {availableClasses.length > 0 ? (
                      availableClasses.map((classe) => (
                        <SelectItem key={classe} value={classe}>{classe}</SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">Sélectionnez d'abord un niveau d'enseignement</div>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Matières */}
          <div className="space-y-6 mb-8">
            <Label className="text-sm font-medium text-foreground">Matière(s) suivie(s) ou étudiée(s) actuellement *</Label>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between border-0 bg-muted/50 rounded-xl text-sm hover:bg-background transition-all duration-200"
                  disabled={!formData.educationLevel}
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
                  {availableSubjects.length > 0 ? (
                    availableSubjects.map((subject) => (
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
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">Sélectionnez d'abord un niveau d'enseignement</div>
                  )}
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
        </div>
      </div>
    </div>
  );
};
