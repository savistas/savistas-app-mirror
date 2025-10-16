import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
import { Progress } from "@/components/ui/progress";
import { QuizTimer } from "@/components/QuizTimer";
import {
  User,
  Power,
  Menu,
  Bot,
  Zap
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types";
import { sendQuizErrorsToWebhook } from "@/lib/errorCategorizationService";
import { useQuizTimer } from "@/hooks/useQuizTimer";

interface Question {
  type: string;
  reponses: { texte: string; lettre: string; correcte: string }[];
  question_index: string;
  question_titre: string;
  explication_reponse_correcte: string;
}

interface ExerciseMetadata {
  niveau: string;
  matiere: string;
  questions: Question[];
  difficulte: string;
  total_questions: string;
  course_id: string;
}

interface UserResponseDetail {
  question_index: string;
  user_answer: string;
  is_correct_sub_question?: boolean;
  time_spent_seconds?: number;
}

interface ExerciseResponseMetadata {
  user_responses: UserResponseDetail[];
}

const DailyQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exerciseMetadata, setExerciseMetadata] = useState<ExerciseMetadata | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userResponsesDetails, setUserResponsesDetails] = useState<UserResponseDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize quiz timer
  const {
    totalSeconds,
    currentQuestionSeconds,
    formattedTotalTime,
    formattedQuestionTime,
    questionTimings,
    startTimer,
    recordQuestionTime,
    isRunning
  } = useQuizTimer();

  useEffect(() => {
    const fetchExercise = async () => {
      if (!id) {
        setError("Exercise ID is missing.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("exercises")
          .select("metadata, course_id")
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (data && data.metadata) {
          setExerciseMetadata({
            ...(data.metadata as unknown as ExerciseMetadata),
            course_id: data.course_id,
          });
        } else {
          setError("Exercise metadata not found.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [id]);

  // Start timer when exercise is loaded
  useEffect(() => {
    if (exerciseMetadata && !loading && !error) {
      startTimer();
    }
  }, [exerciseMetadata, loading, error, startTimer]);

  const handleNext = async () => {
    if (!exerciseMetadata || !user) return;

    const currentQuestion = exerciseMetadata.questions[currentQuestionIndex];
    const isCorrectSubQuestion =
      selectedAnswer ===
      currentQuestion.reponses.find((rep) => rep.correcte === "true")?.lettre;

    // Record time spent on this question before creating response
    recordQuestionTime(currentQuestion.question_index);

    // Get the timing for this question (it's the last one recorded)
    const currentQuestionTiming = currentQuestionSeconds;

    const newUserResponseDetail: UserResponseDetail = {
      question_index: currentQuestion.question_index,
      user_answer: selectedAnswer,
      is_correct_sub_question: isCorrectSubQuestion,
      time_spent_seconds: currentQuestionTiming,
    };

    // Créer un tableau temporaire qui inclut la réponse de la question actuelle
    const finalUserResponsesDetails = [...userResponsesDetails, newUserResponseDetail];
    setUserResponsesDetails(finalUserResponsesDetails); // Mettre à jour l'état pour la prochaine fois

    if (currentQuestionIndex < exerciseMetadata.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedAnswer("");
    } else {
      // All questions answered, process and save responses
      let totalCorrectQuestions = 0;
      finalUserResponsesDetails.forEach((responseDetail) => { // Utiliser finalUserResponsesDetails ici
        if (responseDetail.is_correct_sub_question) {
          totalCorrectQuestions++;
        }
      });

      const overallScore = totalCorrectQuestions; // Score is number of correct sub-questions
      const overallIsCorrect = totalCorrectQuestions === exerciseMetadata.questions.length; // All correct for overall true

      // Insert exercise response with timing data
      const { data: insertedResponse, error: insertError } = await supabase
        .from("exercise_responses")
        .insert({
          exercise_id: id,
          course_id: exerciseMetadata.course_id,
          user_id: user.id,
          metadata: { user_responses: finalUserResponsesDetails } as unknown as Json,
          total_time_seconds: totalSeconds,
        })
        .select()
        .single();

      if (insertError || !insertedResponse) {
        console.error("Error saving exercise responses:", insertError);
        setError("Failed to save exercise responses.");
        return;
      }

      // Insert individual question timings
      if (questionTimings.length > 0) {
        const timingsToInsert = questionTimings.map((timing) => ({
          exercise_response_id: insertedResponse.id,
          question_index: timing.question_index,
          time_spent_seconds: timing.time_spent_seconds,
        }));

        const { error: timingsError } = await supabase
          .from("question_timings")
          .insert(timingsToInsert);

        if (timingsError) {
          console.error("Error saving question timings:", timingsError);
          // Don't block the flow if timing save fails
        }
      }

      const { error: updateError } = await supabase
        .from("exercises")
        .update({ statut: "Terminé" })
        .eq("id", id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating exercise status:", updateError);
        setError("Failed to update exercise status.");
        return;
      }

      // Récupérer la matière du cours pour l'envoi au webhook
      const { data: courseData } = await supabase
        .from("courses")
        .select("subject")
        .eq("id", exerciseMetadata.course_id)
        .single();

      // Envoyer les erreurs au webhook N8N pour catégorisation avec les données de timing
      if (courseData) {
        await sendQuizErrorsToWebhook(
          id,
          exerciseMetadata.course_id,
          user.id,
          courseData.subject || exerciseMetadata.matiere,
          exerciseMetadata.questions,
          finalUserResponsesDetails,
          totalSeconds
        );
      }

      navigate(`/result/${id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement de l'exercice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        <p>Erreur: {error}</p>
      </div>
    );
  }

  if (!exerciseMetadata || exerciseMetadata.questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Aucune question trouvée pour cet exercice.</p>
      </div>
    );
  }

  const currentQuestion = exerciseMetadata.questions[currentQuestionIndex];
  const totalQuestions = exerciseMetadata.questions.length;
  const progress = (currentQuestionIndex / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Bar */}
      <div className="w-full bg-muted h-1">
        <div 
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">Sarah Martin</span> {/* TODO: Replace with actual user name */}
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Power className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="sm">
            <Menu className="w-5 h-5" strokeWidth={1.5} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 animate-fade-in pb-24">
        {/* Timer Display */}
        <QuizTimer
          formattedTime={formattedTotalTime}
          isRunning={isRunning}
          showQuestionTime={true}
          formattedQuestionTime={formattedQuestionTime}
        />

        {/* Question Header */}
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold text-primary">
            {exerciseMetadata.matiere} - {exerciseMetadata.niveau}
          </h1>
          <p className="text-sm text-muted-foreground">
            Question {currentQuestionIndex + 1} sur {totalQuestions}
          </p>
        </div>

        {/* Question Card */}
        <Card className="border-border">
          <CardContent className="p-6 space-y-6">
            <h2 className="text-lg font-medium text-foreground leading-relaxed">
              {currentQuestion.question_titre}
            </h2>

            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-4">
                {currentQuestion.reponses.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <RadioGroupItem 
                      value={option.lettre} // Use letter as value
                      id={`option-${index}`}
                      className="border-border data-[state=checked]:border-primary data-[state=checked]:text-primary"
                    />
                    <Label 
                      htmlFor={`option-${index}`} 
                      className="flex-1 text-foreground cursor-pointer py-2"
                    >
                      {option.lettre}. {option.texte}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="pt-4">
          <Button 
            onClick={handleNext}
            disabled={!selectedAnswer}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6 disabled:opacity-50"
          >
            {currentQuestionIndex >= totalQuestions - 1 ? "Terminer" : "Suivant"}
          </Button>
        </div>

      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default DailyQuiz;
