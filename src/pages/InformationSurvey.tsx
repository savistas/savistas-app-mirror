import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

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
    part: '1. Informations générales',
    text: 'Âge :',
    type: 'radio',
    options: [
      { value: 'moins de 15', label: 'Moins de 15 ans' },
      { value: '15-18', label: '15-18 ans' },
      { value: '18+', label: '18 ans et plus' },
    ],
  },
  {
    id: 'q2',
    part: '1. Informations générales',
    text: 'Niveau d’études actuel :',
    type: 'radio',
    options: [
      { value: 'secondaire', label: 'Secondaire (Collège/Lycée)' },
      { value: 'superieur', label: 'Enseignement supérieur' },
      { value: 'autre', label: 'Autre' },
    ],
  },
  {
    id: 'q3',
    part: '1. Informations générales',
    text: 'Matières ou domaines où tu réussis le mieux :',
    type: 'textarea',
    placeholder: 'Ex: Mathématiques, Histoire, Sport...',
  },
  {
    id: 'q4',
    part: '1. Informations générales',
    text: 'Matières ou domaines où tu rencontres le plus de difficultés :',
    type: 'textarea',
    placeholder: 'Ex: Physique, Français, Langues...',
  },
  {
    id: 'q5',
    part: '2. Méthodes et habitudes d’apprentissage',
    text: 'Comment préfères-tu apprendre ?',
    type: 'multiselect',
    options: [
      { value: 'lire', label: 'Lire' },
      { value: 'ecouter', label: 'Écouter (podcasts, cours audio)' },
      { value: 'pratiquer', label: 'Pratiquer (exercices, projets)' },
      { value: 'videos', label: 'Regarder des vidéos' },
      { value: 'discuter', label: 'Discuter/Expliquer à d\'autres' },
    ],
  },
  {
    id: 'q6',
    part: '2. Méthodes et habitudes d’apprentissage',
    text: 'Quand tu apprends, prends-tu des notes ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q7',
    part: '2. Méthodes et habitudes d’apprentissage',
    text: 'Utilises-tu des résumés ou des schémas pour comprendre ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q8',
    part: '2. Méthodes et habitudes d’apprentissage',
    text: 'Préfères-tu travailler seul(e) ou en groupe ?',
    type: 'radio',
    options: [
      { value: 'seul', label: 'Seul(e)' },
      { value: 'groupe', label: 'En groupe' },
      { value: 'indifferent', label: 'Indifférent' },
    ],
  },
  {
    id: 'q9',
    part: '2. Méthodes et habitudes d’apprentissage',
    text: 'Étudies-tu régulièrement ou plutôt juste avant les examens ?',
    type: 'radio',
    options: [
      { value: 'regulierement', label: 'Régulièrement' },
      { value: 'avant_examens', label: 'Juste avant les examens' },
      { value: 'les_deux', label: 'Un peu des deux' },
    ],
  },
  {
    id: 'q10',
    part: '2. Méthodes et habitudes d’apprentissage',
    text: 'Utilises-tu Internet ou des applications pour t’aider à apprendre ? Lesquels ?',
    type: 'textarea',
    placeholder: 'Ex: YouTube, Khan Academy, Quizlet...',
  },
  {
    id: 'q11',
    part: '3. Compréhension et traitement de l’information',
    text: 'Quand tu lis un texte scolaire, arrives-tu à comprendre rapidement l’idée principale ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q12',
    part: '3. Compréhension et traitement de l’information',
    text: 'Sais-tu repérer les mots-clés importants dans un texte ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q13',
    part: '3. Compréhension et traitement de l’information',
    text: 'Arrives-tu facilement à reformuler un texte avec tes propres mots ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q14',
    part: '3. Compréhension et traitement de l’information',
    text: 'Sais-tu planifier ta réponse avant de répondre à une question écrite ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q15',
    part: '3. Compréhension et traitement de l’information',
    text: 'Est-ce que tu fais souvent des erreurs d’inattention dans tes réponses ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q16',
    part: '4. Organisation et gestion du temps',
    text: 'As-tu un planning ou un agenda pour organiser tes études ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
    ],
  },
  {
    id: 'q17',
    part: '4. Organisation et gestion du temps',
    text: 'Combien d’heures en moyenne travailles-tu par jour pour l’école ?',
    type: 'radio',
    options: [
      { value: 'moins_2h', label: 'Moins de 2 heures' },
      { value: '2-3h', label: '2-3 heures' },
      { value: '3h+', label: '3 heures et plus' },
    ],
  },
  {
    id: 'q18',
    part: '4. Organisation et gestion du temps',
    text: 'As-tu du mal à commencer un travail ou un devoir ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q19',
    part: '4. Organisation et gestion du temps',
    text: 'Arrives-tu à finir tes travaux dans les délais ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q20',
    part: '5. Concentration et difficultés d’apprentissage',
    text: 'As-tu parfois du mal à rester concentré(e) longtemps ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q21',
    part: '5. Concentration et difficultés d’apprentissage',
    text: 'Te distrais-tu facilement pendant que tu étudies ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q22',
    part: '5. Concentration et difficultés d’apprentissage',
    text: 'As-tu déjà été évalué(e) ou diagnostiqué(e) pour un trouble comme :',
    type: 'multiselect',
    options: [
      { value: 'TDA/TDAH', label: 'TDA/TDAH (trouble du déficit de l’attention avec ou sans hyperactivité)' },
      { value: 'Troubles DYS', label: 'Troubles DYS (Dyslexie/Dysorthographie/Dyscalculie)' },
      { value: 'Autres', label: 'Autres (préciser)' },
    ],
  },
  {
    id: 'q23',
    part: '5. Concentration et difficultés d’apprentissage',
    text: 'Si oui, as-tu un plan d’aide ou un aménagement scolaire ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'non_applicable', label: 'Non applicable' },
    ],
  },
  {
    id: 'q24',
    part: '6. Motivation et aspects psychologiques',
    text: 'Aimes-tu apprendre de nouvelles choses ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q25',
    part: '6. Motivation et aspects psychologiques',
    text: 'Te sens-tu souvent découragé(e) face à un travail scolaire difficile ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q26',
    part: '6. Motivation et aspects psychologiques',
    text: 'Est-ce que tu stresses beaucoup avant ou pendant un examen ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q27',
    part: '6. Motivation et aspects psychologiques',
    text: 'Te fixes-tu des objectifs pour tes études ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
  {
    id: 'q28',
    part: '6. Motivation et aspects psychologiques',
    text: 'Te récompenses-tu quand tu atteins un objectif ?',
    type: 'radio',
    options: [
      { value: 'oui', label: 'Oui' },
      { value: 'non', label: 'Non' },
      { value: 'parfois', label: 'Parfois' },
    ],
  },
];

const columnMapping: Record<string, string> = {
  q1: 'age',
  q2: 'niveau_etudes',
  q3: 'matieres_reussite',
  q4: 'matieres_difficulte',
  q5: 'pref_apprendre',
  q6: 'prend_notes',
  q7: 'utilise_resumes',
  q8: 'travail_seul_groupe',
  q9: 'etude_frequence',
  q10: 'outils_apprentissage',
  q11: 'comprehension_texte',
  q12: 'reperer_mots_cles',
  q13: 'reformuler_texte',
  q14: 'planifier_reponse',
  q15: 'erreurs_inattention',
  q16: 'planning_etudes',
  q17: 'heures_travail_ecole',
  q18: 'difficulte_commencer',
  q19: 'finir_travaux_delais',
  q20: 'difficulte_concentration',
  q21: 'distraction_etudes',
  q22: 'trouble_diagnostique',
  q23: 'plan_aide_scolaire',
  q24: 'aime_apprendre',
  q25: 'decouragement_travail',
  q26: 'stress_examen',
  q27: 'objectifs_etudes',
  q28: 'recompense_objectif',
};

const InformationSurvey: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const navigate = useNavigate();

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswerChange = (questionId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (currentQuestion.type === 'radio' || currentQuestion.type === 'multiselect') {
      handleNext();
    }
  };

  const handleNext = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // End of survey
      console.log('Survey completed!', answers);

      // Save answers to Supabase
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const answersToInsert: Record<string, string | string[]> = {};
        for (const questionId in answers) {
          const columnName = columnMapping[questionId];
          if (columnName) {
            answersToInsert[columnName] = answers[questionId];
          }
        }

        const { error } = await supabase
          .from('profiles_infos')
          .insert({ user_id: user.id, ...answersToInsert });

        if (error) {
          console.error('Error saving answers to Supabase:', error);
          // Optionally, handle the error (e.g., show a message to the user)
        } else {
          console.log('Answers saved to Supabase successfully!');
        }
      } else {
        console.warn('No user logged in. Answers not saved.');
      }

      navigate('/dashboard'); // Redirect to dashboard or a thank you page
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
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
              <div key={option.value} className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer bg-white hover:bg-gray-100">
                <RadioGroupItem value={option.value} id={option.value} />
                <Label htmlFor={option.value} className="flex-grow cursor-pointer">{option.label}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case 'text':
        return (
          <Input
            type="text"
            placeholder={question.placeholder}
            value={currentValue as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full bg-white"
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={question.placeholder}
            value={currentValue as string}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full min-h-[100px] bg-white"
          />
        );
      case 'multiselect':
        const selectedValues = (currentValue || []) as string[];
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
            {question.options?.map((option) => (
              <Button
                key={option.value}
                variant={selectedValues.includes(option.value) ? "default" : "outline"}
                onClick={() => {
                  const newSelection = selectedValues.includes(option.value)
                    ? selectedValues.filter((val) => val !== option.value)
                    : [...selectedValues, option.value];
                  handleAnswerChange(question.id, newSelection);
                }}
                className="w-full px-4 py-2 rounded-full bg-white hover:bg-gray-100"
              >
                {option.label}
              </Button>
            ))}
          </div>
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

  const [direction, setDirection] = useState(0);

  const handleNextAnimated = () => {
    setDirection(1);
    handleNext();
  };

  const handlePreviousAnimated = () => {
    setDirection(-1);
    handlePrevious();
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Progress bar - fixe */}
      <header className="flex-shrink-0 w-full px-4 pt-4">
        <div className="w-full bg-blue-500 h-3 rounded-full overflow-hidden">
          <div className="bg-blue-700 h-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
        </div>
      </header>

      {/* Title - fixe */}
      <div className="flex-shrink-0 w-full text-center pt-8">
        <h2 className="text-2xl font-bold text-gray-800">{currentQuestion.part}</h2>
      </div>

      {/* Main content - centré vertical */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl flex flex-col items-center space-y-8">
          {/* Question */}
          <div className="p-6 text-center w-full">
            <p className="text-lg text-gray-600 mt-1">{currentQuestion.text}</p>
          </div>

          {/* Animated answers */}
          <div className="relative overflow-hidden w-full px-6 pb-4 min-h-[180px] flex items-center justify-center">
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

          {/* Navigation directement sous réponses */}
          <div className="flex justify-between w-full px-6">
            <Button
              onClick={handlePreviousAnimated}
              disabled={currentQuestionIndex === 0}
              variant="ghost"
              className="w-12 h-12 rounded-full flex items-center justify-center bg-white border text-gray-800 hover:bg-gray-100"
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            {(currentQuestion.type === 'text' || currentQuestion.type === 'textarea') && (
              <Button
                onClick={handleNextAnimated}
                disabled={!answers[currentQuestion.id]}
                variant="default"
                className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-600 text-white hover:bg-blue-700"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InformationSurvey;
