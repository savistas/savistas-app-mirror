import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import BurgerMenu from "@/components/BurgerMenu";
import {
  User,
  Power,
  Menu,
  Clock
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types"; // Import Json type

// Helper function to format seconds to readable time
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
};

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

interface ExerciseResponse {
  id: string;
  exercise_id: string;
  user_id: string;
  metadata: Json | null; // Updated to use Json type for metadata
  created_at: string;
  total_time_seconds?: number;
}

interface QuestionTiming {
  id: string;
  exercise_response_id: string;
  question_index: string;
  time_spent_seconds: number;
  created_at: string;
}

const Result = () => {
  const { id } = useParams<{ id: string }>(); // Exercise ID
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [exerciseMetadata, setExerciseMetadata] = useState<ExerciseMetadata | null>(null);
  const [userResponsesDetails, setUserResponsesDetails] = useState<UserResponseDetail[]>([]); // Store detailed responses
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0);
  const [questionTimings, setQuestionTimings] = useState<QuestionTiming[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!id || !user) {
        setError("Exercise ID or User ID is missing.");
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile for display name
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setDisplayName(profileData.full_name || user.user_metadata?.full_name || profileData.email || user.email || 'Mon profil');
        } else {
          setDisplayName(user.user_metadata?.full_name || user.email || 'Mon profil');
        }

        // Fetch exercise metadata
        const { data: exerciseData, error: exerciseError } = await supabase
          .from("exercises")
          .select("metadata, course_id")
          .eq("id", id)
          .single();

        if (exerciseError) {
          throw exerciseError;
        }

        if (exerciseData && exerciseData.metadata) {
          setExerciseMetadata({
            ...(exerciseData.metadata as unknown as ExerciseMetadata),
            course_id: exerciseData.course_id,
          });
        } else {
          setError("Exercise metadata not found.");
        }

        // Fetch user responses for this exercise including timing data
        const { data: responsesData, error: responsesError } = await supabase
          .from("exercise_responses")
          .select("id, metadata, total_time_seconds")
          .eq("exercise_id", id)
          .eq("user_id", user.id)
          .single(); // Expecting a single response for the whole exercise

        if (responsesError) {
          throw responsesError;
        }

        if (responsesData && responsesData.metadata) {
          const parsedMetadata = responsesData.metadata as unknown as ExerciseResponseMetadata;
          setUserResponsesDetails(parsedMetadata.user_responses || []);
          setTotalTimeSeconds(responsesData.total_time_seconds || 0);

          // Fetch individual question timings
          const { data: timingsData, error: timingsError } = await supabase
            .from("question_timings")
            .select("*")
            .eq("exercise_response_id", responsesData.id)
            .order("created_at", { ascending: true });

          if (timingsError) {
            console.error("Error fetching question timings:", timingsError);
          } else if (timingsData) {
            setQuestionTimings(timingsData);
          }
        } else {
          setError("User responses metadata not found.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement des résultats...</p>
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
        <p>Aucune donnée d'exercice trouvée.</p>
      </div>
    );
  }

  const totalQuestions = exerciseMetadata.questions.length;
  const correctAnswersCount = userResponsesDetails.filter((res) => res.is_correct_sub_question).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <User className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">{displayName || 'Mon profil'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Power className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <BurgerMenu />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 animate-fade-in pb-24">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Result Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              Résultats de l'exercice
            </h1>
            <p className="text-muted-foreground">
              {exerciseMetadata.matiere} - {exerciseMetadata.niveau}
            </p>
          </div>

          {/* Score Display */}
          <Card className="border-border">
            <CardContent className="p-8">
              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-primary">
                  {correctAnswersCount}/{totalQuestions}
                </div>
                <div className="text-xl text-green-500 font-medium">
                  {correctAnswersCount === totalQuestions ? "Excellent travail !" : "Bon début"}
                </div>
                <div className="text-muted-foreground">
                  Vous avez obtenu {Math.round((correctAnswersCount / totalQuestions) * 100)}% de bonnes réponses
                </div>

                {/* Temps total directement sous le score */}
                {totalTimeSeconds > 0 && (
                  <div className="flex items-center justify-center space-x-2 pt-4 border-t border-border/50 mt-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Temps total</p>
                      <p className="text-3xl font-bold text-primary">
                        {formatTime(totalTimeSeconds)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Timing Statistics */}
          {totalTimeSeconds > 0 && (
            <Card className="border-border bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Temps moyen</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatTime(Math.round(totalTimeSeconds / totalQuestions))}
                    </p>
                    <p className="text-xs text-muted-foreground">par question</p>
                  </div>
                  <div className="text-center p-4 bg-background/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Total questions</p>
                    <p className="text-xl font-bold text-foreground">
                      {totalQuestions}
                    </p>
                    <p className="text-xs text-muted-foreground">répondues</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Questions Review */}
          <h2 className="text-xl font-semibold text-foreground mt-8">Récapitulatif des questions</h2>
          {exerciseMetadata.questions.map((question, index) => {
            const userResponseDetail = userResponsesDetails.find(
              (res) => res.question_index === question.question_index
            );
            const correctAnswer = question.reponses.find((rep) => rep.correcte === "true");
            const isUserAnswerCorrect = userResponseDetail?.is_correct_sub_question;

            // Get timing from either question_timings table or metadata
            const questionTimingFromTable = questionTimings.find(
              (timing) => timing.question_index === question.question_index
            );
            const timeSpent = questionTimingFromTable?.time_spent_seconds || userResponseDetail?.time_spent_seconds;

            return (
              <Card key={index} className="border-border">
                <CardContent className="p-6 space-y-4">
                  {/* Timing badge - centered on mobile, right-aligned on desktop */}
                  {timeSpent !== undefined && (
                    <div className="flex justify-center md:justify-end">
                      <div className="flex items-center space-x-1 text-sm bg-primary/10 px-3 py-1 rounded-full">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium text-primary">{formatTime(timeSpent)}</span>
                      </div>
                    </div>
                  )}

                  {/* Question title */}
                  <h3 className="text-lg font-medium text-foreground text-center md:text-left">
                    Question {question.question_index}: {question.question_titre}
                  </h3>
                  <p className="text-muted-foreground">
                    Votre réponse:{" "}
                    <span
                      className={isUserAnswerCorrect ? "text-green-500 font-medium" : "text-red-500 font-medium"}
                    >
                      {userResponseDetail ? `${userResponseDetail.user_answer}. ${question.reponses.find(rep => rep.lettre === userResponseDetail.user_answer)?.texte}` : "Non répondu"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Bonne réponse:{" "}
                    <span className="text-green-500 font-medium">
                      {correctAnswer?.lettre}. {correctAnswer?.texte}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Explication: {question.explication_reponse_correcte}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {/* Main CTA */}
          <Button 
            asChild
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
          >
            <Link to={`/courses/${exerciseMetadata.course_id}`}>Retour au cours</Link>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Result;
