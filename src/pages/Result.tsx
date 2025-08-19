import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BottomNav from "@/components/BottomNav";
import { 
  User, 
  Power, 
  Menu
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Json } from "@/integrations/supabase/types"; // Import Json type

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
}

const Result = () => {
  const { id } = useParams<{ id: string }>(); // Exercise ID
  const { user } = useAuth();
  const [exerciseMetadata, setExerciseMetadata] = useState<ExerciseMetadata | null>(null);
  const [userResponsesDetails, setUserResponsesDetails] = useState<UserResponseDetail[]>([]); // Store detailed responses
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

        // Fetch user responses for this exercise
        const { data: responsesData, error: responsesError } = await supabase
          .from("exercise_responses")
          .select("metadata") // Select only metadata
          .eq("exercise_id", id)
          .eq("user_id", user.id)
          .single(); // Expecting a single response for the whole exercise

        if (responsesError) {
          throw responsesError;
        }

        if (responsesData && responsesData.metadata) {
          const parsedMetadata = responsesData.metadata as unknown as ExerciseResponseMetadata;
          setUserResponsesDetails(parsedMetadata.user_responses || []);
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
          <span className="font-medium text-foreground">{user?.email || 'Mon profil'}</span>
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
              </div>
            </CardContent>
          </Card>

          {/* Questions Review */}
          <h2 className="text-xl font-semibold text-foreground mt-8">Récapitulatif des questions</h2>
          {exerciseMetadata.questions.map((question, index) => {
            const userResponseDetail = userResponsesDetails.find(
              (res) => res.question_index === question.question_index
            );
            const correctAnswer = question.reponses.find((rep) => rep.correcte === "true");
            const isUserAnswerCorrect = userResponseDetail?.is_correct_sub_question;

            return (
              <Card key={index} className="border-border">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-lg font-medium text-foreground">
                    Question {question.question_index}: {question.question_titre}
                  </h3>
                  <p className="text-muted-foreground">
                    Votre réponse:{" "}
                    <span
                      className={isUserAnswerCorrect ? "text-green-500" : "text-red-500"}
                    >
                      {userResponseDetail ? `${userResponseDetail.user_answer}. ${question.reponses.find(rep => rep.lettre === userResponseDetail.user_answer)?.texte}` : "Non répondu"}
                    </span>
                  </p>
                  <p className="text-muted-foreground">
                    Bonne réponse:{" "}
                    <span className="text-green-500">
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
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Result;
