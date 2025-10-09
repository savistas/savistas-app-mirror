import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Question {
  id: string;
  part: string;
  text: string;
  type: 'radio';
  options: { value: string; label: string }[];
}

const questions: Question[] = [
  {
    id: 'q1',
    part: '1. Attention et concentration',
    text: 'Quand tu dois rester assis pour travailler ou écouter :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je me concentre facilement.' },
      { value: 'B', label: 'Je me déconcentre vite mais je reprends.' },
      { value: 'C', label: 'Je ne parviens pas à rester attentif et je m\'agite.' },
    ],
  },
  {
    id: 'q2',
    part: '2. Lecture et langage écrit',
    text: 'Lorsque tu lis ou écris :',
    type: 'radio',
    options: [
      { value: 'A', label: 'C\'est fluide et correct.' },
      { value: 'B', label: 'J\'ai quelques erreurs régulières (lettres inversées, confusions).' },
      { value: 'C', label: 'J\'ai des blocages fréquents, incompréhension, lecture très difficile.' },
    ],
  },
  {
    id: 'q3',
    part: '3. Communication orale',
    text: 'Quand tu parles avec les autres :',
    type: 'radio',
    options: [
      { value: 'A', label: 'J\'utilise le langage adapté à la situation.' },
      { value: 'B', label: 'J\'ai du mal à trouver mes mots ou je fais des phrases maladroites.' },
      { value: 'C', label: 'Je ne comprends pas bien les échanges ou je ne réponds pas de façon adaptée.' },
    ],
  },
  {
    id: 'q4',
    part: '4. Motricité fine',
    text: 'Pour l\'écriture, le découpage, l\'habillage :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je réalise correctement.' },
      { value: 'B', label: 'Je suis maladroit mais j\'y arrive.' },
      { value: 'C', label: 'J\'évite ou j\'échoue souvent.' },
    ],
  },
  {
    id: 'q5',
    part: '5. Motricité globale',
    text: 'Pour le sport, les jeux de ballon, courir, coordonner mes gestes :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Comme les autres jeunes de mon âge.' },
      { value: 'B', label: 'Je suis plus maladroit, je tombe souvent.' },
      { value: 'C', label: 'Je suis très en difficulté pour suivre les activités motrices.' },
    ],
  },
  {
    id: 'q6',
    part: '6. Interaction sociale',
    text: 'Avec les autres jeunes :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je joue et échange facilement.' },
      { value: 'B', label: 'Je suis parfois maladroit mais je m\'adapte.' },
      { value: 'C', label: 'Je préfère être seul, je ne comprends pas les règles sociales.' },
    ],
  },
  {
    id: 'q7',
    part: '7. Sensibilité sensorielle',
    text: 'Face aux bruits, lumières, textures, nourriture :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je réagis normalement.' },
      { value: 'B', label: 'Je suis parfois gêné (ex. je bouche mes oreilles).' },
      { value: 'C', label: 'Je réagis fortement ou j\'évite systématiquement.' },
    ],
  },
  {
    id: 'q8',
    part: '8. Régulation émotionnelle',
    text: 'Quand je suis frustré ou contrarié :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je me calme vite.' },
      { value: 'B', label: 'J\'ai du mal à gérer mes émotions.' },
      { value: 'C', label: 'J\'ai des crises fréquentes, colère difficile à apaiser.' },
    ],
  },
  {
    id: 'q9',
    part: '9. Mémoire / apprentissages',
    text: 'Quand je dois retenir une leçon ou une consigne :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je retiens bien et je restitue.' },
      { value: 'B', label: 'Je retiens partiellement, j\'oublie vite.' },
      { value: 'C', label: 'Je ne parviens pas à mémoriser ou comprendre.' },
    ],
  },
  {
    id: 'q10',
    part: '10. Calcul / logique',
    text: 'Face aux mathématiques :',
    type: 'radio',
    options: [
      { value: 'A', label: 'J\'ai le niveau attendu pour mon âge.' },
      { value: 'B', label: 'J\'ai quelques difficultés régulières.' },
      { value: 'C', label: 'Je ne comprends pas les chiffres, j\'ai des problèmes de base.' },
    ],
  },
  {
    id: 'q11',
    part: '11. Tics / mouvements involontaires',
    text: 'Je répète souvent des mouvements ou sons involontaires (clignements, grimaces, bruits de gorge) :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Jamais.' },
      { value: 'B', label: 'Parfois mais c\'est discret.' },
      { value: 'C', label: 'Fréquents et difficiles à contrôler.' },
    ],
  },
  {
    id: 'q12',
    part: '12. Fluidité de la parole',
    text: 'Quand je parle :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je parle de manière fluide.' },
      { value: 'B', label: 'J\'ai quelques répétitions ou blocages.' },
      { value: 'C', label: 'Je bloque souvent, je répète ou saccade ma parole.' },
    ],
  },
  {
    id: 'q13',
    part: '13. Sensibilités isolées',
    text: 'Si je n\'ai pas de difficultés sociales, mais j\'ai des réactions fortes aux bruits, lumières, odeurs :',
    type: 'radio',
    options: [
      { value: 'A', label: 'Rarement.' },
      { value: 'B', label: 'Parfois.' },
      { value: 'C', label: 'Très souvent.' },
    ],
  },
];

// Règles de scoring pour calculer les niveaux de risque
const calculateScores = (answers: Record<string, string>) => {
  const scores = {
    tdah_score: 'Faible',
    dyslexie_score: 'Faible',
    dyscalculie_score: 'Faible',
    dyspraxie_score: 'Faible',
    tsa_score: 'Faible',
    trouble_langage_score: 'Faible',
    tdi_score: 'Faible',
    tics_tourette_score: 'Faible',
    begaiement_score: 'Faible',
    trouble_sensoriel_isole_score: 'Faible',
  };

  // TDAH (Q1 + Q8)
  if (answers.q1 === 'C' && answers.q8 === 'C') scores.tdah_score = 'Très élevé';
  else if (answers.q1 === 'C' || answers.q8 === 'C') scores.tdah_score = 'Élevé';
  else if (answers.q1 === 'B' && answers.q8 === 'B') scores.tdah_score = 'Modéré';

  // Dyslexie (Q2 + Q9)
  if (answers.q2 === 'C' && answers.q9 === 'C') scores.dyslexie_score = 'Très élevé';
  else if ((answers.q2 === 'C' && answers.q9 === 'B') || (answers.q2 === 'B' && answers.q9 === 'C')) scores.dyslexie_score = 'Élevé';
  else if (answers.q2 === 'B' && answers.q9 === 'B') scores.dyslexie_score = 'Modéré';

  // Dyscalculie (Q10 + Q9)
  if (answers.q10 === 'C') scores.dyscalculie_score = 'Très élevé';
  else if (answers.q10 === 'B' && answers.q9 === 'C') scores.dyscalculie_score = 'Élevé';
  else if (answers.q10 === 'B') scores.dyscalculie_score = 'Modéré';

  // Dyspraxie (Q4 + Q5)
  if (answers.q4 === 'C' && answers.q5 === 'C') scores.dyspraxie_score = 'Très élevé';
  else if ((answers.q4 === 'C' && answers.q5 === 'B') || (answers.q4 === 'B' && answers.q5 === 'C')) scores.dyspraxie_score = 'Élevé';
  else if (answers.q4 === 'B' && answers.q5 === 'B') scores.dyspraxie_score = 'Modéré';

  // TSA (Q3 + Q6 + Q7)
  const tsaC = [answers.q3, answers.q6, answers.q7].filter(a => a === 'C').length;
  const tsaB = [answers.q3, answers.q6, answers.q7].filter(a => a === 'B').length;
  if (tsaC >= 2) scores.tsa_score = 'Très élevé';
  else if (tsaC === 1 && tsaB >= 1) scores.tsa_score = 'Élevé';
  else if (tsaB >= 2) scores.tsa_score = 'Modéré';

  // Trouble du langage (Q3 isolé si pas TSA élevé)
  if (scores.tsa_score === 'Faible' || scores.tsa_score === 'Modéré') {
    if (answers.q3 === 'C' && answers.q6 === 'A' && answers.q7 === 'A') scores.trouble_langage_score = 'Élevé';
    else if (answers.q3 === 'B') scores.trouble_langage_score = 'Modéré';
  }

  // TDI (Q2 + Q9 + Q10)
  const tdiC = [answers.q2, answers.q9, answers.q10].filter(a => a === 'C').length;
  const tdiB = [answers.q2, answers.q9, answers.q10].filter(a => a === 'B').length;
  if (tdiC === 3) scores.tdi_score = 'Très élevé';
  else if (tdiC >= 2) scores.tdi_score = 'Élevé';
  else if (tdiC === 1 && tdiB >= 1) scores.tdi_score = 'Modéré';

  // Tics/Tourette (Q11)
  if (answers.q11 === 'C') scores.tics_tourette_score = 'Très élevé';
  else if (answers.q11 === 'B') scores.tics_tourette_score = 'Modéré';

  // Bégaiement (Q12)
  if (answers.q12 === 'C') scores.begaiement_score = 'Très élevé';
  else if (answers.q12 === 'B') scores.begaiement_score = 'Modéré';

  // Trouble sensoriel isolé (Q13 si Q6=A)
  if (answers.q6 === 'A') {
    if (answers.q13 === 'C') scores.trouble_sensoriel_isole_score = 'Élevé';
    else if (answers.q13 === 'B') scores.trouble_sensoriel_isole_score = 'Modéré';
  }

  return scores;
};

interface TroublesDetectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TroublesDetectionDialog: React.FC<TroublesDetectionDialogProps> = ({
  isOpen,
  onClose,
  onComplete,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [direction, setDirection] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInitialChoice, setShowInitialChoice] = useState(false);
  const [hasMedicalDiagnosis, setHasMedicalDiagnosis] = useState<boolean | null>(null);
  const [medicalDiagnosisDetails, setMedicalDiagnosisDetails] = useState('');
  const [showQCMChoice, setShowQCMChoice] = useState(false);
  const [showMedicalDiagnosisInput, setShowMedicalDiagnosisInput] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setShowWelcome(true);
      setShowInitialChoice(false);
      setHasMedicalDiagnosis(null);
      setMedicalDiagnosisDetails('');
      setShowQCMChoice(false);
      setShowMedicalDiagnosisInput(false);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setIsNavigating(false);
    }
  }, [isOpen]);

  const currentQuestion = questions[currentQuestionIndex];

  // Vérification de sécurité pour éviter l'affichage de questions vides
  useEffect(() => {
    if (currentQuestionIndex >= questions.length) {
      console.warn('Index de question invalide:', currentQuestionIndex, 'sur', questions.length);
      setCurrentQuestionIndex(0);
    }
    if (currentQuestionIndex < 0) {
      console.warn('Index de question négatif:', currentQuestionIndex);
      setCurrentQuestionIndex(0);
    }
  }, [currentQuestionIndex]);

  // Effet pour forcer le re-rendu et log quand la question change
  useEffect(() => {
    if (questions[currentQuestionIndex]) {
      console.log('Question changée vers index:', currentQuestionIndex, '- Titre:', questions[currentQuestionIndex].part);
    }
  }, [currentQuestionIndex]);

  // Protection supplémentaire pour éviter les erreurs
  if (!currentQuestion) {
    console.error('Question non trouvée à l\'index:', currentQuestionIndex);
    return null;
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);
    
    // Auto-advance for radio questions avec délai pour éviter les conflits
    if (currentQuestionIndex < questions.length - 1 && !isNavigating) {
      setIsNavigating(true);
      setTimeout(() => {
        handleNextAnimated();
        setIsNavigating(false);
      }, 150); // Petit délai pour laisser l'animation se terminer
    }
  };

  const handleNext = async () => {
    // Vérifications de sécurité
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
      console.error('Index de question invalide dans handleNext:', currentQuestionIndex);
      setCurrentQuestionIndex(0);
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        console.warn('Tentative de navigation vers un index invalide:', nextIndex);
      }
    } else {
      // Calculate scores and save to database
      await saveResults();
    }
  };

  const saveResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save raw answers
    const rawAnswersData = {
      user_id: user.id,
      has_medical_diagnosis: hasMedicalDiagnosis || false,
      medical_diagnosis_details: medicalDiagnosisDetails || null,
      q1_attention: answers.q1 || null,
      q2_lecture: answers.q2 || null,
      q3_communication: answers.q3 || null,
      q4_motricite_fine: answers.q4 || null,
      q5_motricite_globale: answers.q5 || null,
      q6_interaction_sociale: answers.q6 || null,
      q7_sensibilite_sensorielle: answers.q7 || null,
      q8_regulation_emotionnelle: answers.q8 || null,
      q9_memoire: answers.q9 || null,
      q10_calcul: answers.q10 || null,
      q11_tics: answers.q11 || null,
      q12_fluidite_parole: answers.q12 || null,
      q13_sensibilites_isolees: answers.q13 || null,
    };

    // Check if record exists
    const { data: existingAnswers } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existingAnswers) {
      await supabase
        .from('troubles_questionnaire_reponses')
        .update(rawAnswersData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('troubles_questionnaire_reponses')
        .insert(rawAnswersData);
    }

    // Calculate and save scores
    const scores = hasMedicalDiagnosis ? {} : calculateScores(answers);
    const scoresData = {
      user_id: user.id,
      has_medical_diagnosis: hasMedicalDiagnosis || false,
      medical_diagnosis_details: medicalDiagnosisDetails || null,
      ...scores,
    };

    // Check if scores exist
    const { data: existingScores } = await supabase
      .from('troubles_detection_scores')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existingScores) {
      await supabase
        .from('troubles_detection_scores')
        .update(scoresData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('troubles_detection_scores')
        .insert(scoresData);
    }

    // Update profile to mark troubles detection as completed
    await supabase
      .from('profiles')
      .update({ troubles_detection_completed: true })
      .eq('user_id', user.id);

    onComplete();
  };

  const handlePrevious = () => {
    // Vérifications de sécurité
    if (currentQuestionIndex < 0 || currentQuestionIndex >= questions.length) {
      console.error('Index de question invalide dans handlePrevious:', currentQuestionIndex);
      setCurrentQuestionIndex(0);
      return;
    }

    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      if (prevIndex >= 0) {
        setCurrentQuestionIndex(prevIndex);
      } else {
        console.warn('Tentative de navigation vers un index négatif:', prevIndex);
      }
    }
  };

  const handleNextAnimated = () => {
    if (isNavigating) return; // Éviter la navigation multiple simultanée
    setDirection(1);
    handleNext();
  };

  const handlePreviousAnimated = () => {
    if (isNavigating) return; // Éviter la navigation multiple simultanée
    setDirection(-1);
    handlePrevious();
  };

  const handleStartQuestionnaire = () => {
    setShowWelcome(false);
    setShowInitialChoice(true);
  };

  const handleDiagnosisChoice = (hasDiagnosis: boolean) => {
    setHasMedicalDiagnosis(hasDiagnosis);
    if (hasDiagnosis) {
      // Show text field for diagnosis details
      setShowInitialChoice(false);
      setShowMedicalDiagnosisInput(true);
    } else {
      // Ask if they want to do the QCM
      setShowInitialChoice(false);
      setShowQCMChoice(true);
    }
  };

  const handleQCMChoice = async (wantsQCM: boolean) => {
    if (wantsQCM) {
      setShowQCMChoice(false);
      // Start the questionnaire
    } else {
      // Skip QCM and save that troubles detection is completed without data
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ troubles_detection_completed: true })
          .eq('user_id', user.id);
      }
      onComplete();
    }
  };

  const handleSaveDiagnosis = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Save medical diagnosis data
    const medicalData = {
      user_id: user.id,
      has_medical_diagnosis: true,
      medical_diagnosis_details: medicalDiagnosisDetails,
    };

    // Save to troubles_questionnaire_reponses
    const { data: existingAnswers } = await supabase
      .from('troubles_questionnaire_reponses')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existingAnswers) {
      await supabase
        .from('troubles_questionnaire_reponses')
        .update(medicalData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('troubles_questionnaire_reponses')
        .insert(medicalData);
    }

    // Save to troubles_detection_scores (no scores, just medical diagnosis)
    const scoresData = {
      user_id: user.id,
      has_medical_diagnosis: true,
      medical_diagnosis_details: medicalDiagnosisDetails,
    };

    const { data: existingScores } = await supabase
      .from('troubles_detection_scores')
      .select('user_id')
      .eq('user_id', user.id)
      .single();

    if (existingScores) {
      await supabase
        .from('troubles_detection_scores')
        .update(scoresData)
        .eq('user_id', user.id);
    } else {
      await supabase
        .from('troubles_detection_scores')
        .insert(scoresData);
    }

    // Update profile to mark troubles detection as completed
    await supabase
      .from('profiles')
      .update({ troubles_detection_completed: true })
      .eq('user_id', user.id);

    onComplete();
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="!w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden mx-auto rounded-lg">
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <img src="/logo-savistas.png" alt="Savistas Logo" className="mb-6 h-24" />
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-bold text-gray-800">
                Prédétection de troubles
              </DialogTitle>
              <DialogDescription className="text-lg text-gray-600 mt-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <AlertCircle className="h-5 w-5 text-yellow-600 inline mr-2" />
                  <span className="text-yellow-800">
                    Attention : ceci n'est pas un diagnostic médical.
                  </span>
                </div>
                <p className="mt-4">
                  Afin de mieux personnaliser votre accompagnement, nous vous proposons une étape de prédétection.
                </p>
              </DialogDescription>
            </DialogHeader>
            <Button
              onClick={handleStartQuestionnaire}
              className="mt-8 px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            >
              Commencer
            </Button>
          </div>
        ) : showInitialChoice ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Avez-vous déjà été diagnostiqué(e) ?
            </h2>
            <div className="flex gap-4">
              <Button
                onClick={() => handleDiagnosisChoice(true)}
                className="px-8 py-4 text-lg bg-green-600 hover:bg-green-700 text-white rounded-full"
              >
                Oui
              </Button>
              <Button
                onClick={() => handleDiagnosisChoice(false)}
                className="px-8 py-4 text-lg bg-red-600 hover:bg-red-700 text-white rounded-full"
              >
                Non
              </Button>
            </div>
          </div>
        ) : showMedicalDiagnosisInput ? (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">
              Veuillez préciser votre diagnostic
            </h2>
            <Textarea
              placeholder="Veuillez préciser le ou les troubles diagnostiqués, ainsi que le médecin ou spécialiste"
              value={medicalDiagnosisDetails}
              onChange={(e) => setMedicalDiagnosisDetails(e.target.value)}
              className="w-full max-w-xl min-h-[150px] mb-8"
            />
            <Button
              onClick={handleSaveDiagnosis}
              disabled={!medicalDiagnosisDetails.trim()}
              className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full"
            >
              Enregistrer
            </Button>
          </div>
        ) : showQCMChoice ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Voulez-vous réaliser un court QCM de prédétection des troubles ?
            </h2>
            <p className="text-gray-600 mb-8">
              Ce test n'a pas de valeur médicale, mais il peut révéler des signaux utiles pour mieux personnaliser votre parcours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button
                onClick={() => handleQCMChoice(true)}
                className="px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full sm:w-auto"
              >
                Oui, je fais le test
              </Button>
              <Button
                onClick={() => handleQCMChoice(false)}
                variant="outline"
                className="px-8 py-4 text-lg rounded-full w-full sm:w-auto"
              >
                Non merci
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress bar */}
            <header className="flex-shrink-0 w-full px-4 pt-4">
              <div className="w-full bg-blue-500 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-700 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </header>

            {/* Title */}
            <div className="flex-shrink-0 w-[90%] mx-auto text-center pt-8" key={`title-${currentQuestionIndex}`}>
              <h2 className="text-2xl font-bold text-gray-800">{currentQuestion.part}</h2>
            </div>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4" key={`main-${currentQuestionIndex}`}>
              <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
                {/* Question */}
                <div className="p-6 text-center w-full mt-4" key={`question-${currentQuestionIndex}`}>
                  <p className="text-lg text-gray-600 mt-1">{currentQuestion.text}</p>
                </div>

                {/* Animated answers */}
                <div className="relative overflow-hidden w-full px-6 pb-4 min-h-[250px] flex items-center justify-center">
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={currentQuestionIndex}
                      custom={direction}
                      variants={variants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                      }}
                      className="absolute w-full max-w-xl"
                    >
                      <RadioGroup
                        onValueChange={(value) => handleAnswerChange(`q${currentQuestionIndex + 1}`, value)}
                        value={answers[`q${currentQuestionIndex + 1}`] || ''}
                        className="flex flex-col space-y-2"
                      >
                        {currentQuestion.options?.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer bg-white hover:bg-gray-100"
                            onClick={() => handleAnswerChange(`q${currentQuestionIndex + 1}`, option.value)}
                          >
                            <RadioGroupItem value={option.value} id={option.value} />
                            <Label htmlFor={option.value} className="flex-grow cursor-pointer">{option.label}</Label>
                          </div>
                        )) || []}
                      </RadioGroup>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex justify-between w-full px-6 mt-4">
                  <Button
                    onClick={handlePreviousAnimated}
                    disabled={currentQuestionIndex === 0 || isNavigating}
                    variant="ghost"
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white border text-gray-800 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  {currentQuestionIndex === questions.length - 1 ? (
                    <Button
                      onClick={saveResults}
                      disabled={!answers[`q${currentQuestionIndex + 1}`] || isNavigating}
                      variant="default"
                      className="px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-lg"
                    >
                      Terminer
                    </Button>
                  ) : null}
                </div>
              </div>
            </main>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TroublesDetectionDialog;