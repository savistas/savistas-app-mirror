import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Question {
  id: string;
  part: string;
  text: string;
  type: 'radio' | 'text' | 'textarea' | 'multiselect';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

const questions: Question[] = [
  {
    id: 'q1',
    part: '1. Préférence d\'apprentissage',
    text: 'Quand tu veux comprendre une nouvelle idée…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je préfère voir un schéma, une image ou une vidéo.' },
      { value: 'B', label: 'J’aime écouter quelqu’un l’expliquer à l’oral.' },
      { value: 'C', label: 'Je préfère manipuler, tester, faire un exemple pratique.' },
      { value: 'D', label: 'J’aime lire un texte ou un résumé.' },
    ],
  },
  {
    id: 'q2',
    part: '2. Mémoire et mémorisation',
    text: 'Quand tu apprends une poésie ou une leçon…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je la lis et relis pour mémoriser.' },
      { value: 'B', label: 'Je l’écoute plusieurs fois ou je la chante.' },
      { value: 'C', label: 'Je fais des gestes ou je marche en répétant.' },
      { value: 'D', label: 'J’invente des dessins ou des couleurs pour me souvenir.' },
    ],
  },
  {
    id: 'q3',
    part: '3. Résolution de problèmes',
    text: 'Quand tu dois résoudre un problème de maths…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je dessine le problème sous forme de schéma.' },
      { value: 'B', label: 'Je réfléchis étape par étape, comme un calcul logique.' },
      { value: 'C', label: 'J’aime en discuter avec quelqu’un.' },
      { value: 'D', label: 'Je préfère imaginer une situation réelle pour tester.' },
    ],
  },
  {
    id: 'q4',
    part: '4. Intérêts personnels',
    text: 'Quand tu as du temps libre, tu préfères…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Lire ou écrire (journal, histoire, poème).' },
      { value: 'B', label: 'Jouer d’un instrument ou écouter de la musique.' },
      { value: 'C', label: 'Faire du sport, bouger, bricoler.' },
      { value: 'D', label: 'Observer la nature, les animaux, les plantes.' },
    ],
  },
  {
    id: 'q5',
    part: '5. Travail en groupe',
    text: 'Quand tu travailles en groupe…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je préfère écouter et ensuite donner mon avis.' },
      { value: 'B', label: 'J’aime organiser les idées et trouver une logique.' },
      { value: 'C', label: 'Je participe activement aux échanges.' },
      { value: 'D', label: 'Je propose souvent de dessiner ou visualiser nos idées.' },
    ],
  },
  {
    id: 'q6',
    part: '6. Rétention d\'information',
    text: 'Quand tu dois retenir une information importante…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je la réécris plusieurs fois.' },
      { value: 'B', label: 'Je l’associe à une mélodie ou un rythme.' },
      { value: 'C', label: 'J’en fais un dessin ou un schéma.' },
      { value: 'D', label: 'Je l’explique à quelqu’un ou je la mets en pratique.' },
    ],
  },
  {
    id: 'q7',
    part: '7. Préférence d\'enseignement',
    text: 'En classe, tu préfères que l’enseignant…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Fasse un dessin ou une carte mentale au tableau.' },
      { value: 'B', label: 'Explique avec beaucoup d’exemples concrets.' },
      { value: 'C', label: 'Raconte et détaille la leçon à l’oral.' },
      { value: 'D', label: 'Donne un texte ou un document à lire.' },
    ],
  },
  {
    id: 'q8',
    part: '8. Découverte de nouveaux lieux',
    text: 'Quand tu découvres un nouvel endroit…',
    type: 'radio',
    options: [
      { value: 'A', label: 'J’observe les lieux et les détails autour de moi.' },
      { value: 'B', label: 'J’écoute les sons, les voix, l’ambiance.' },
      { value: 'C', label: 'J’explore en marchant et en touchant les choses.' },
      { value: 'D', label: 'Je préfère lire un plan ou des informations écrites.' },
    ],
  },
  {
    id: 'q9',
    part: '9. Définition de la réussite',
    text: 'Pour toi, réussir c’est surtout…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Bien comprendre les mots et savoir les utiliser.' },
      { value: 'B', label: 'Trouver la solution logique à un problème.' },
      { value: 'C', label: 'Savoir travailler en équipe avec les autres.' },
      { value: 'D', label: 'Découvrir par soi-même et exprimer sa créativité.' },
    ],
  },
  {
    id: 'q10',
    part: '10. Rappel de souvenirs',
    text: 'Quand tu veux te souvenir d’un moment important…',
    type: 'radio',
    options: [
      { value: 'A', label: 'Je revois les images dans ma tête.' },
      { value: 'B', label: 'Je me rappelle ce que j’ai entendu ou dit.' },
      { value: 'C', label: 'Je revois les gestes que j’ai faits.' },
      { value: 'D', label: 'Je relis mes notes ou ce que j’ai écrit.' },
    ],
  },
];

const scoringRules: Record<string, Record<string, Record<string, number>>> = {
  q1: {
    A: { score_visuel: 1, score_spatial: 1 },
    B: { score_auditif: 1, score_linguistique: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_lecture: 1 },
  },
  q2: {
    A: { score_linguistique: 1 },
    B: { score_musicale: 1, score_auditif: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_visuel: 1 },
  },
  q3: {
    A: { score_spatial: 1 },
    B: { score_logique_mathematique: 1 },
    C: { score_interpersonnelle: 1 },
    D: { score_kinesthésique: 1 },
  },
  q4: {
    A: { score_linguistique: 1 },
    B: { score_musicale: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_naturaliste: 1 },
  },
  q5: {
    A: { score_intrapersonnelle: 1 },
    B: { score_logique_mathematique: 1 },
    C: { score_interpersonnelle: 1 },
    D: { score_spatial: 1, score_visuel: 1 },
  },
  q6: {
    A: { score_ecriture: 1 },
    B: { score_musicale: 1 },
    C: { score_visuel: 1 },
    D: { score_kinesthésique: 1, score_interpersonnelle: 1 },
  },
  q7: {
    A: { score_visuel: 1 },
    B: { score_kinesthésique: 1 },
    C: { score_auditif: 1 },
    D: { score_lecture: 1 },
  },
  q8: {
    A: { score_spatial: 1 },
    B: { score_auditif: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_lecture: 1 },
  },
  q9: {
    A: { score_linguistique: 1 },
    B: { score_logique_mathematique: 1 },
    C: { score_interpersonnelle: 1 },
    D: { score_intrapersonnelle: 1, score_spatial: 1 },
  },
  q10: {
    A: { score_visuel: 1 },
    B: { score_auditif: 1 },
    C: { score_kinesthésique: 1 },
    D: { score_lecture: 1, score_ecriture: 1 },
  },
};

// Fonction pour obtenir les 3 meilleurs styles d'apprentissage
const getTopLearningStyles = (scores: Record<string, number>) => {
  const learningStyleNames: Record<string, string> = {
    score_visuel: 'Visuel',
    score_spatial: 'Spatial',
    score_auditif: 'Auditif',
    score_linguistique: 'Linguistique',
    score_kinesthésique: 'Kinesthésique',
    score_lecture: 'Lecture',
    score_ecriture: 'Écriture',
    score_logique_mathematique: 'Logique-mathématique',
    score_interpersonnelle: 'Interpersonnelle',
    score_musicale: 'Musicale',
    score_naturaliste: 'Naturaliste',
    score_intrapersonnelle: 'Intrapersonnelle',
  };

  return Object.entries(scores)
    .map(([key, score]) => ({
      name: learningStyleNames[key] || key,
      score: score,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
};

// Fonction pour obtenir la couleur du badge selon l'index
const getStyleColor = (index: number) => {
  const pastelColors = [
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-yellow-100 text-yellow-800 border-yellow-200",
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
  ];
  return pastelColors[index % pastelColors.length];
};

interface InformationSurveyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSurveyComplete: () => void;
  initialQuestionIndex: number;
  initialAnswers: Record<string, string | string[]>;
  onQuestionIndexChange: (index: number) => void;
  onAnswersChange: (answers: Record<string, string | string[]>) => void;
}

const InformationSurveyDialog: React.FC<InformationSurveyDialogProps> = ({
  isOpen,
  onClose,
  onSurveyComplete,
  initialQuestionIndex,
  initialAnswers,
  onQuestionIndexChange,
  onAnswersChange,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndexInternal] = useState(initialQuestionIndex);
  const [answers, setAnswersInternal] = useState<Record<string, string | string[]>>(initialAnswers);
  const [direction, setDirection] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true); // State for the welcome screen
  const [showResults, setShowResults] = useState(false);
  const [calculatedScores, setCalculatedScores] = useState<Array<{name: string, score: number}> | null>(null);

  // Synchronize internal state with props
  useEffect(() => {
    setCurrentQuestionIndexInternal(initialQuestionIndex);
  }, [initialQuestionIndex]);

  useEffect(() => {
    setAnswersInternal(initialAnswers);
  }, [initialAnswers]);

  useEffect(() => {
    if (isOpen) {
      setShowWelcome(initialQuestionIndex === 0 && Object.keys(initialAnswers).length === 0); // Show welcome only if starting fresh
      setShowResults(false); // Reset results when dialog opens
      setCalculatedScores(null); // Reset calculated scores
    }
  }, [isOpen, initialQuestionIndex, initialAnswers]);

  const setCurrentQuestionIndex = (index: number) => {
    setCurrentQuestionIndexInternal(index);
    onQuestionIndexChange(index);
  };

  const setAnswers = (newAnswers: Record<string, string | string[]>) => {
    setAnswersInternal(newAnswers);
    onAnswersChange(newAnswers);
  };

  const handleCloseClick = () => {
    console.log('🟢 handleCloseClick called in InformationSurveyDialog');
    onClose();
  };

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers); // Pass the new state directly

    if (currentQuestion.type === 'radio') {
      // For radio, automatically go to next question after selection
      // unless it's the last question
      if (currentQuestionIndex < questions.length - 1) {
        handleNextAnimated();
      } else {
        // If it's the last question and it's radio, save immediately
        handleNext();
      }
    }
  };

  const handleNext = async () => {
    console.log('handleNext called');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Dernière question - calculer les scores et afficher les résultats
      console.log('Survey completed!', answers);

      // Calculate learning style scores
      const learningStyleScores: Record<string, number> = {
        score_visuel: 0,
        score_spatial: 0,
        score_auditif: 0,
        score_linguistique: 0,
        score_kinesthésique: 0,
        score_lecture: 0,
        score_ecriture: 0,
        score_logique_mathematique: 0,
        score_interpersonnelle: 0,
        score_musicale: 0,
        score_naturaliste: 0,
        score_intrapersonnelle: 0,
      };

      for (const questionId in answers) {
        const answerOption = answers[questionId];
        if (typeof answerOption === 'string' && scoringRules[questionId] && scoringRules[questionId][answerOption]) {
          const scoresToAdd = scoringRules[questionId][answerOption];
          for (const style in scoresToAdd) {
            learningStyleScores[style] += scoresToAdd[style];
          }
        }
      }

      console.log('Calculated learning style scores:', learningStyleScores);

      // Stocker les scores et afficher la page de résultats
      const topStyles = getTopLearningStyles(learningStyleScores);
      setCalculatedScores(topStyles);
      setShowResults(true);
    }
  };

  const saveResults = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Recalculer les scores complets (pas seulement le top 3)
      const learningStyleScores: Record<string, number> = {
        score_visuel: 0,
        score_spatial: 0,
        score_auditif: 0,
        score_linguistique: 0,
        score_kinesthésique: 0,
        score_lecture: 0,
        score_ecriture: 0,
        score_logique_mathematique: 0,
        score_interpersonnelle: 0,
        score_musicale: 0,
        score_naturaliste: 0,
        score_intrapersonnelle: 0,
      };

      for (const questionId in answers) {
        const answerOption = answers[questionId];
        if (typeof answerOption === 'string' && scoringRules[questionId] && scoringRules[questionId][answerOption]) {
          const scoresToAdd = scoringRules[questionId][answerOption];
          for (const style in scoresToAdd) {
            learningStyleScores[style] += scoresToAdd[style];
          }
        }
      }

      // Check if a record already exists for the user in styles_apprentissage
      const { data: existingStyle, error: fetchError } = await supabase
        .from('styles_apprentissage')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing learning style:', fetchError);
      } else {
        let saveError;
        if (existingStyle) {
          // Update existing record
          const { error } = await supabase
            .from('styles_apprentissage')
            .update(learningStyleScores)
            .eq('user_id', user.id);
          saveError = error;
        } else {
          // Insert new record
          const { error } = await supabase
            .from('styles_apprentissage')
            .insert({ user_id: user.id, ...learningStyleScores });
          saveError = error;
        }

        if (saveError) {
          console.error('Error saving learning styles to Supabase:', saveError);
        } else {
          console.log('Learning styles saved to Supabase successfully!');

          // Save raw answers to profiles_infos
          const rawAnswersToSave: Record<string, string> = {};
          questions.forEach(question => {
            const answerValue = answers[question.id];
            if (question.type === 'radio' && typeof answerValue === 'string' && question.options) {
              const selectedOption = question.options.find(option => option.value === answerValue);
              if (selectedOption) {
                switch (question.id) {
                  case 'q1': rawAnswersToSave.pref_apprendre_idee = selectedOption.label; break;
                  case 'q2': rawAnswersToSave.memoire_poesie = selectedOption.label; break;
                  case 'q3': rawAnswersToSave.resoudre_maths = selectedOption.label; break;
                  case 'q4': rawAnswersToSave.temps_libre_pref = selectedOption.label; break;
                  case 'q5': rawAnswersToSave.travail_groupe_role = selectedOption.label; break;
                  case 'q6': rawAnswersToSave.retenir_info = selectedOption.label; break;
                  case 'q7': rawAnswersToSave.pref_enseignant = selectedOption.label; break;
                  case 'q8': rawAnswersToSave.decouvrir_endroit = selectedOption.label; break;
                  case 'q9': rawAnswersToSave.reussir_definition = selectedOption.label; break;
                  case 'q10': rawAnswersToSave.souvenir_important = selectedOption.label; break;
                }
              }
            }
          });

          const { data: existingProfile, error: fetchProfileError } = await supabase
            .from('profiles_infos')
            .select('user_id')
            .eq('user_id', user.id)
            .single();

          if (fetchProfileError && fetchProfileError.code !== 'PGRST116') {
            console.error('Error fetching existing profile info:', fetchProfileError);
          } else {
            let profileSaveError;
            if (existingProfile) {
              const { error } = await supabase
                .from('profiles_infos')
                .update(rawAnswersToSave)
                .eq('user_id', user.id);
              profileSaveError = error;
            } else {
              const { error } = await supabase
                .from('profiles_infos')
                .insert({ user_id: user.id, ...rawAnswersToSave });
              profileSaveError = error;
            }

            if (profileSaveError) {
              console.error('Error saving profile info to Supabase:', profileSaveError);
            } else {
              console.log('Profile info saved to Supabase successfully!');
            }
          }
        }
      }
    } else {
      console.warn('No user logged in. Data not saved.');
    }

    // Call onSurveyComplete to properly close the dialog BEFORE reloading
    onSurveyComplete();

    // Reload page after a small delay to ensure dialog closes properly
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  // Réactiver la fermeture du dialogue en cas de succès
  useEffect(() => {
    if (!isOpen && initialQuestionIndex === questions.length && Object.keys(initialAnswers).length > 0) {
      onClose();
    }
  }, [isOpen, initialQuestionIndex, initialAnswers, onClose]);

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      // If on the first question, go back to welcome screen
      setShowWelcome(true);
    }
  };

  const renderQuestionInput = (question: Question) => {
    const currentValue = answers[question.id] || '';

    switch (question.type) {
      case 'radio':
        return (
          <RadioGroup
            onValueChange={(value) => handleAnswerChange(question.id, value)}
            value={currentValue as string}
            className="flex flex-col space-y-2"
          >
            {question.options?.map((option) => (
              <div
                key={option.value}
                className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer bg-white hover:bg-gray-100"
                onClick={() => handleAnswerChange(question.id, option.value)}
              >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label htmlFor={option.value} className="flex-grow cursor-pointer">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      default:
        return null;
    }
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? -1000 : 1000, // Inversé
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 1000 : -1000, // Inversé
      opacity: 0,
    }),
  };

  const handleNextAnimated = () => {
    setDirection(1);
    handleNext();
  };

  const handlePreviousAnimated = () => {
    setDirection(-1);
    handlePrevious();
  };

  const allQuestionsAnswered = () => {
    // Pour les nouvelles questions, toutes sont de type radio et doivent avoir une réponse
    for (const question of questions) {
      const answer = answers[question.id];
      if (!answer || (typeof answer === 'string' && answer.trim() === '')) {
        console.log(`Question ${question.id} not answered.`);
        return false;
      }
    }
    console.log('All questions answered!');
    return true;
  };

  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="!w-[90vw] h-[90vh] flex flex-col p-0 overflow-hidden mx-auto rounded-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCloseClick}
          className="absolute top-4 right-4 w-8 h-8 p-0 rounded-full hover:bg-gray-100 z-10"
        >
          <X className="h-4 w-4" />
        </Button>

        {showWelcome ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <img src="/logo-savistas.png" alt="Savistas Logo" className="mb-6 h-24" />
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-bold text-gray-800">Bienvenue !</DialogTitle>
              <DialogDescription className="text-lg text-gray-600 mt-2">
                Afin de personnaliser au mieux votre apprentissage afin de l'adapter au type de méthode veuillez remplir judicieusement ce questionnaire
              </DialogDescription>
            </DialogHeader>
            <div className="w-full flex justify-center">
              <Button
                onClick={() => setShowWelcome(false)}
                className="mt-8 px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full"
              >
                Commencer le questionnaire
              </Button>
            </div>
          </div>
        ) : showResults ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col h-full p-8 overflow-y-auto relative"
          >
            {/* Contenu de la page de résultats */}
            <div className="flex flex-col items-center justify-start max-w-3xl mx-auto w-full space-y-6 pt-8">
              {/* Titre */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-800">
                  Vos styles d'apprentissage dominants
                </h2>
                <p className="text-gray-600">
                  Voici une analyse de vos réponses au questionnaire
                </p>
              </div>

              {/* Résultats */}
              <div className="w-full bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Vos 3 styles d'apprentissage dominants :
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {calculatedScores?.map((style, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.3 }}
                    >
                      <Badge
                        variant="secondary"
                        className={`px-4 py-3 text-md font-semibold w-full justify-center border-2 ${getStyleColor(index)}`}
                      >
                        {style.name}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* FAQ en Accordéon */}
              <div className="w-full">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1" className="border rounded-lg px-4">
                    <AccordionTrigger className="text-left hover:no-underline">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <span className="font-semibold text-gray-800">
                          À propos de vos résultats
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-700 space-y-3 pt-2">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                        <p className="font-medium text-blue-900">
                          📊 Comprendre vos styles d'apprentissage
                        </p>
                        <p className="text-sm">
                          Ces résultats identifient vos styles d'apprentissage dominants basés sur vos préférences et habitudes.
                        </p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p>
                          <strong>Comment utiliser ces résultats ?</strong>
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>Ces styles vous aident à comprendre comment vous apprenez le mieux</li>
                          <li>Utilisez ces informations pour adapter vos méthodes d'étude</li>
                          <li>Votre expérience d'apprentissage sera personnalisée en fonction de ces résultats</li>
                          <li>Vous pouvez refaire ce test à tout moment depuis votre profil</li>
                        </ul>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>

              {/* Bouton Terminer */}
              <div className="w-full pt-4">
                <Button
                  onClick={saveResults}
                  className="w-full px-8 py-4 text-lg bg-blue-600 hover:bg-blue-700 text-white rounded-full"
                >
                  Terminer et enregistrer
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Progress bar - fixe */}
            <header className="flex-shrink-0 w-full px-4 pt-16">
              <div className="w-full bg-blue-500 h-3 rounded-full overflow-hidden">
                <div className="bg-blue-700 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </header>

            {/* Title */}
            <div className="flex-shrink-0 w-[90%] mx-auto text-center pt-8" key={`title-${currentQuestionIndex}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{currentQuestion.part}</h2>
            </div>

            {/* Main content */}
            <main className="flex-1 flex items-center justify-center p-4" key={`main-${currentQuestionIndex}`}>
              <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
                {/* Question */}
                <div className="p-6 text-center w-full mt-4" key={`question-${currentQuestionIndex}`}>
                  <p className="text-lg text-gray-600 mt-1">{currentQuestion.text}</p>
                </div>

                {/* Animated answers */}
                <div className="relative overflow-visible w-full px-6 pb-4 pt-2 min-h-[250px] flex items-center justify-center">
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
                      {renderQuestionInput(currentQuestion)}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation directly under answers */}
                <div className="flex justify-between w-full px-6 mt-4">
                  <Button
                    onClick={handlePreviousAnimated}
                    disabled={currentQuestionIndex === 0 && showWelcome}
                    variant="ghost"
                    className="w-12 h-12 rounded-full flex items-center justify-center bg-white border text-gray-800 hover:bg-gray-100"
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  {isLastQuestion ? (
                    <Button
                      onClick={handleNext}
                      disabled={!allQuestionsAnswered()}
                      variant="default"
                      className="px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-lg"
                    >
                      Voir les résultats
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextAnimated}
                      disabled={!answers[currentQuestion.id] || (Array.isArray(answers[currentQuestion.id]) && (answers[currentQuestion.id] as string[]).length === 0)}
                      variant="default"
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700"
                    >
                      <ChevronRight className="h-8 w-8" />
                    </Button>
                  )}
                </div>
              </div>
            </main>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
};

export default InformationSurveyDialog;
