import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea"; // Added Textarea import
import { useEffect } from "react"; // Removed useState as selectedSubjects is no longer needed

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
  { value: "lycee", label: "Lycée" }, // Mappé à 'lycee'
  { value: "superieur", label: "Enseignement supérieur" }, // Mappé à 'superieur'
];

// Mappage des niveaux d'enseignement détaillés aux catégories de la base de données
const mapEducationLevelToDB = (level: string): string => {
  if (level.startsWith("lycee")) return "lycee";
  if (["post_bac_courts", "universite", "ecoles", "forces_armees_securite", "formations_metiers_artisanat", "formation_continue"].includes(level)) return "superieur";
  return level; // Pour 'primaire' et 'college' qui correspondent directement
};

const classesByEducationLevel: Record<string, string[]> = {
  primaire: ["CP", "CE1", "CE2", "CM1", "CM2"],
  college: ["6ᵉ", "5ᵉ", "4ᵉ", "3ᵉ"],
  lycee: ["Seconde", "Première", "Terminale", "CAP 1ʳᵉ année", "CAP 2ᵉ année", "Seconde pro", "Première pro", "Terminale pro"], // Regroupe général, techno et pro
  superieur: [
    "BTS 1", "BTS 2", "BUT 1", "BUT 2", "BUT 3", "CPGE 1 (prépa)", "CPGE 2 (prépa)",
    "Licence L1", "Licence L2", "Licence L3", "Master M1", "Master M2", "Doctorat (année 1+)",
    "École d’ingénieur (années 1–5)", "École de commerce / PGE (années 1–3)", "Écoles santé (PASS/LAS ou équivalent)",
    "Préparation militaire initiale", "École de sous-officiers", "École d’officiers", "École de la gendarmerie", "École de police", "École des pompiers", "École militaire spécialisée (ex. Saint-Cyr, Navale, Air)",
    "CAP Coiffure", "CAP Esthétique", "CAP Cuisine", "CAP Boulangerie", "CAP Pâtisserie",
    "CAP Mécanique auto/moto", "CAP Menuiserie", "CAP Électricité", "BP (Brevet Professionnel) Coiffure",
    "BP Esthétique", "BP Métiers de bouche", "Bac pro Métiers de la beauté", "Bac pro Métiers de la restauration",
    "Bac pro Maintenance", "Bac pro Bâtiment / Travaux publics",
    "Remise à niveau / Alphabétisation", "Reprise d’études (adultes)", "VAE", "Préparation concours/examen", "Certification professionnelle", "Autre (à préciser)"
  ],
};

const subjectsByEducationLevel: Record<string, string[]> = {
  primaire: ["Lecture / Écriture", "Mathématiques", "Sciences", "Histoire", "Géographie", "Arts plastiques", "Éducation musicale", "Éducation physique et sportive (EPS)"],
  college: ["Français", "Mathématiques", "Anglais", "Histoire-Géographie", "Sciences de la Vie et de la Terre (SVT)", "Physique-Chimie", "Technologie", "EPS", "Arts plastiques", "Musique"],
  lycee: ["Français", "Mathématiques", "Physique-Chimie", "SVT", "Histoire-Géographie", "Philosophie", "Langues vivantes (Anglais, Espagnol, Allemand…)", "Sciences économiques et sociales (SES)", "Numérique et sciences informatiques (NSI)", "Enseignement de spécialité (à préciser)"],
  superieur: ["Sciences (Mathématiques, Physique, Chimie, Biologie, Informatique…)", "Sciences humaines et sociales (Psychologie, Sociologie, Philosophie, Histoire, Géographie…)", "Langues et littérature", "Économie, Gestion, Droit", "Ingénierie, Architecture", "Médecine, Santé, Pharmacie", "Arts, Design, Communication", "Formation professionnelle (commerce, industrie, services, artisanat…)", "Préparation à un concours ou un examen (à préciser)", "Autre (à préciser)"],
};


export const EducationStep = ({ formData, onFormDataChange }: EducationStepProps) => {
  console.log("EducationStep rendered with formData:", formData);

  const availableClasses = formData.educationLevel ? classesByEducationLevel[formData.educationLevel] || [] : [];

  useEffect(() => {
    console.log("EducationStep useEffect triggered. Education Level:", formData.educationLevel);
    // Reset classes and subjects when education level changes
    onFormDataChange('classes', '');
    onFormDataChange('subjects', ''); // subjects is now free text, so just clear it
  }, [formData.educationLevel]);

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
            
            <Textarea
              placeholder="Ex: Mathématiques, Physique, Histoire, etc."
              value={formData.subjects}
              onChange={(e) => onFormDataChange('subjects', e.target.value)}
              className="h-24 border-0 bg-muted/50 rounded-xl text-sm focus:bg-background transition-all duration-200 resize-y"
              disabled={!formData.educationLevel}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
