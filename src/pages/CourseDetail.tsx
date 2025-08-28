import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom"; // Added useNavigate
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BottomNav from "@/components/BottomNav";
import { ArrowLeft, FileText, ArrowRight, CheckCircle, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, XAxis, YAxis, LineChart, Line } from "recharts"; // Changed BarChart to LineChart, Bar to Line
// import { Json } from "@/integrations/supabase/types"; // Removed Json import

interface Course {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  cover_url: any; // Changed from string | null to any
  days_number: number | string | null;
  file_url: any; // Changed to handle JSON output
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Exercise {
  id: string;
  course_id: string;
  order_index: number;
  metadata: any; // JSONB type
  date_exercice: string;
  statut: string;
  user_id: string;
  exercice_title?: string; // Re-added based on user feedback
  exercise_responses?: { metadata: any }[]; // Changed to any
}

interface ProgressData {
  date: string;
  score: number;
  orderIndex: number; // Added orderIndex for x-axis
}

interface UserResponseDetail {
  question_index: string;
  user_answer: string;
  is_correct_sub_question?: boolean;
}

interface ExerciseResponseMetadata {
  user_responses: UserResponseDetail[];
}

// Type guard function
function isExerciseResponseMetadata(obj: any): obj is ExerciseResponseMetadata {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'user_responses' in obj &&
    Array.isArray(obj.user_responses)
  );
}

const CourseDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoadingRevision, setIsLoadingRevision] = useState(false); // New state for loading

  const handleGenerateRevisionSheet = async () => {
    if (!id) {
      alert("ID du cours manquant pour générer la fiche de révision.");
      return;
    }

    setIsLoadingRevision(true);
    try {
      const response = await fetch("https://n8n.srv932562.hstgr.cloud/webhook/recap-cours", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ course_id: id }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log("Webhook response:", result);

      // Check if the response contains id_course
      if (result && result.id_course) {
        alert("Fiche de révision générée avec succès ! Redirection...");
        // Assuming there's a route to view the revision sheet
        navigate(`/revision-sheet/${result.id_course}`);
      } else {
        alert("Fiche de révision demandée, mais l'ID du cours n'a pas été retourné par le webhook.");
      }
    } catch (error: any) {
      console.error("Erreur lors de l'appel du webhook:", error);
      alert(`Erreur lors de la génération de la fiche de révision: ${error.message}`);
    } finally {
      setIsLoadingRevision(false);
    }
  };

  const confirmDelete = async () => {
    if (!id) {
      alert("ID du cours manquant.");
      return;
    }

    try {
      // 1. Supprimer les réponses aux exercices
      const { error: responsesError } = await supabase
        .from('exercise_responses')
        .delete()
        .in('exercise_id', exercises.map(ex => ex.id));

      if (responsesError) {
        throw responsesError;
      }

      // 2. Supprimer les exercices
      const { error: exercisesError } = await supabase
        .from('exercises')
        .delete()
        .eq('course_id', id);

      if (exercisesError) {
        throw exercisesError;
      }

      // 3. Supprimer le cours
      const { error: courseError } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (courseError) {
        throw courseError;
      }

      alert("Cours et données associées supprimés avec succès !");
      navigate("/dashboard");
    } catch (error: any) {
      alert(`Erreur lors de la suppression: ${error.message}`);
      console.error("Erreur de suppression:", error);
    } finally {
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCourse = () => {
    setShowDeleteConfirm(true);
  };

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressData[]>([]);
  const isMobile = useIsMobile();

  useEffect(() => {
    const fetchCourseAndExercises = async () => {
      if (!id) {
        setError("Course ID is missing.");
        setLoading(false);
        return;
      }

      try {
        // Fetch course details
        const { data: courseData, error: courseError } = await supabase
          .from("courses")
          .select("*")
          .eq("id", id)
          .single();

        if (courseError) {
          throw courseError;
        }
        setCourse(courseData);

        // Fetch exercises for the course
        const { data: exercisesData, error: exercisesError } = await supabase
          .from("exercises")
          .select("*, exercise_responses(metadata)") // Removed exercice_title from selection
          .eq("course_id", id)
          .order("order_index", { ascending: true });

        if (exercisesError) {
          throw exercisesError;
        }
        setExercises(exercisesData);

        // Prepare data for the progress chart
        const formattedProgressData: ProgressData[] = exercisesData
          .map((exercise) => { // Removed filter to include all exercises
            let score = 0;
            // Only calculate score if exercise is completed and has responses
            if (
              exercise.statut === "Terminé" &&
              exercise.exercise_responses &&
              exercise.exercise_responses.length > 0 &&
              exercise.exercise_responses[0].metadata
            ) {
              const responseMetadata = exercise.exercise_responses![0].metadata;
              if (isExerciseResponseMetadata(responseMetadata)) {
                const userResponses = responseMetadata.user_responses;
                if (userResponses && userResponses.length > 0) {
                  const correctAnswersCount = userResponses.filter((res) => res.is_correct_sub_question).length;
                  score = correctAnswersCount; // Score is directly the number of correct answers out of 5
                }
              }
            }
            return {
              date: new Date(exercise.date_exercice).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "2-digit",
              }),
              score: score,
              orderIndex: exercise.order_index, // Use order_index for the x-axis
            };
          })
          .sort((a, b) => a.orderIndex - b.orderIndex); // Sort by orderIndex for the x-axis

        // Add a starting point (0,0) for the chart
        const initialPoint: ProgressData = {
          date: "Début", // A label for the starting point
          score: 0,
          orderIndex: 0, // An index before the first exercise
        };

        // Ensure progressData always has at least the initial point
        setProgressData(formattedProgressData.length > 0 ? [initialPoint, ...formattedProgressData] : [initialPoint]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndExercises();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement du cours...</p>
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

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cours non trouvé.</p>
      </div>
    );
  }

  const totalExercises = exercises.length;
  const completedExercises = exercises.filter(
    (exercise) => exercise.statut === "Terminé"
  ).length;
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{course.title}</h1>
        </div>
        <Button variant="destructive" size="sm" onClick={handleDeleteCourse}>
          <Trash2 className="h-4 w-4 mr-2" />
          Supprimer
        </Button>
      </header>

      <main className="p-6 space-y-6 pb-24 lg:w-[70%] lg:mx-auto">
        {/* Matière en étiquette */}
        {course.subject && (
          <div className="text-center mb-4"> {/* Added div for centering */}
            <p className="text-base font-semibold uppercase text-white bg-blue-500 px-3 py-1 rounded inline-block"> {/* Changed text-sm to text-base, increased padding */}
              {course.subject}
            </p>
          </div>
        )}

        {/* Section Documents Uploadés */}
        <Card>
          <CardHeader>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-xl font-semibold text-foreground">Documents du cours</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  {(() => {
                    let fileUrls: string[] = [];
                    if (course.file_url) {
                      console.log("Type of course.file_url:", typeof course.file_url, "Value:", course.file_url);
                      if (Array.isArray(course.file_url)) {
                        fileUrls = course.file_url;
                      } else if (typeof course.file_url === 'string') {
                        try {
                          const parsed = JSON.parse(course.file_url);
                          if (Array.isArray(parsed)) {
                            fileUrls = parsed;
                          } else if (typeof parsed === 'string') {
                            fileUrls = [parsed];
                          } else {
                            // If it's a string but not a JSON array or string, treat as single URL
                            fileUrls = [course.file_url];
                          }
                        } catch (e) {
                          // Not a valid JSON string, treat as single URL
                          fileUrls = [course.file_url];
                        }
                      }
                      // If it's neither an array nor a string, fileUrls remains empty
                    }

                    if (fileUrls.length > 0) {
                      return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {fileUrls.map((fileUrl, index) => (
                        <Button key={index} asChild>
                          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                            <FileText className="h-4 w-4" />
                            <span>Document {index + 1}</span>
                          </a>
                        </Button>
                      ))}
                    </div>
                      );
                    } else {
                      return (
                        <p className="text-muted-foreground">Aucun document n'a été uploadé pour ce cours.</p>
                      );
                    }
                  })()}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardHeader>
        </Card>

        {/* Section Graphique de Progression */}
        {progressData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-foreground">Progression des Réponses</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ score: { label: "Score", color: "hsl(var(--chart-1))" } }}
                className={`w-full ${isMobile ? 'h-[250px]' : 'h-[220px]'}`}
              >
                <LineChart
                  accessibilityLayer
                  data={progressData}
                  height={isMobile ? 250 : 220}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                  <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="orderIndex"
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    tickFormatter={(value) => value === 0 ? "Début" : progressData.find(d => d.orderIndex === value)?.date || `Ex. ${value}`}
                    fontSize={12}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tickLine={false}
                    tickMargin={8}
                    axisLine={false}
                    tickFormatter={(value) => value.toFixed(0)}
                    ticks={[0, 1, 2, 3, 4, 5]}
                    fontSize={12}
                    interval={0}
                  />
                  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "#3b82f6" }}
                    activeDot={{ r: 6, fill: "#1d4ed8" }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {/* Section Exercices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Exercices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {exercises.length > 0 ? (
              isMobile ? (
                <div className="space-y-4">
                  {exercises.map((exercise) => (
                    <Card key={exercise.id}>
                      <CardHeader>
                    <CardTitle className="text-lg">
                      {exercise.exercice_title || `Exercice ${exercise.order_index}`}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {new Date(exercise.date_exercice).toLocaleDateString()}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mt-4">
                      {exercise.statut !== "Terminé" && (
                        <Link to={`/daily-quiz/${exercise.id}`} className="w-full">
                          <Button className="w-full">
                            Commencer <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      )}
                    </div>
                    {(() => {
                      let resultText = "N/A";
                      let resultColorClass = "";

                      if (exercise.exercise_responses && exercise.exercise_responses.length > 0 && exercise.exercise_responses[0].metadata) {
                        const responseMetadata = exercise.exercise_responses[0].metadata;
                        if (isExerciseResponseMetadata(responseMetadata)) {
                          const userResponses = responseMetadata.user_responses;
                          if (userResponses && userResponses.length > 0) {
                            const totalQuestions = userResponses.length;
                            const correctAnswersCount = userResponses.filter((res) => res.is_correct_sub_question).length;
                            resultText = `${correctAnswersCount}/${totalQuestions}`;

                            if (correctAnswersCount <= 2) {
                              resultColorClass = "bg-red-500";
                            } else if (correctAnswersCount === 3 || correctAnswersCount === 4) {
                              resultColorClass = "bg-orange-500";
                            } else if (correctAnswersCount === 5) {
                              resultColorClass = "bg-green-500";
                            }
                          }
                        }
                      } else {
                        resultColorClass = "bg-gray-500";
                      }
                      return (
                        resultText !== "N/A" && (
                          <Badge className={`${resultColorClass} text-white h-10 flex items-center justify-center w-full mt-4`}>
                            {resultText}
                          </Badge>
                        )
                      );
                    })()}
                  </CardContent>
                </Card>
              ))}
            </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Titre de l'exercice</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Résultat</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="font-medium whitespace-normal">
                          {exercise.exercice_title || `Exercice ${exercise.order_index}`}
                        </TableCell>
                        <TableCell>{new Date(exercise.date_exercice).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {exercise.statut === "Terminé" ? (
                            <Link to={`/result/${exercise.id}`}>
                              <Button variant="outline">Voir le résultat</Button>
                            </Link>
                          ) : (
                            <Link to={`/daily-quiz/${exercise.id}`}>
                              <Button>Commencer <ArrowRight className="ml-2 h-4 w-4" /></Button>
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            let resultText = "N/A";
                            let resultColorClass = "";

                            if (exercise.exercise_responses && exercise.exercise_responses.length > 0 && exercise.exercise_responses[0].metadata) {
                              const responseMetadata = exercise.exercise_responses[0].metadata;
                              if (isExerciseResponseMetadata(responseMetadata)) {
                                const userResponses = responseMetadata.user_responses;
                                if (userResponses && userResponses.length > 0) {
                                  const totalQuestions = userResponses.length;
                                  const correctAnswersCount = userResponses.filter((res) => res.is_correct_sub_question).length;
                                  resultText = `${correctAnswersCount}/${totalQuestions}`;

                                  if (correctAnswersCount <= 2) {
                                    resultColorClass = "bg-red-500";
                                  } else if (correctAnswersCount === 3 || correctAnswersCount === 4) {
                                    resultColorClass = "bg-orange-500";
                                  } else if (correctAnswersCount === 5) { // Assuming 5 is the max possible correct answers
                                    resultColorClass = "bg-green-500";
                                  }
                                }
                              }
                            } else { // If no exercise responses or metadata
                              resultColorClass = "bg-gray-500";
                            }
                            return (
                              <Badge className={`${resultColorClass} text-white h-10 flex items-center justify-center`}>
                                {resultText}
                              </Badge>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )
            ) : (
              <p className="text-muted-foreground text-center">
                Aucun exercice disponible pour ce cours.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Section Récapitulatif de révision */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">Récapitulatif de révision</CardTitle>
          </CardHeader>
          <CardContent>
            {completedExercises === totalExercises && totalExercises > 0 ? (
              <Button
                className="w-full"
                onClick={handleGenerateRevisionSheet}
                disabled={isLoadingRevision}
              >
                {isLoadingRevision ? "Génération en cours..." : "Générer ma fiche de révision"}
              </Button>
            ) : (
              <p className="text-muted-foreground text-center">
                Terminez tous les exercices pour générer un récapitulatif de révision, basé sur vos réponses.
              </p>
            )}
          </CardContent>
        </Card>
      </main>
      <BottomNav />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action ne peut pas être annulée. Cela supprimera définitivement votre cours et toutes les données associées (exercices, réponses).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button onClick={confirmDelete} variant="destructive" className="bg-red-500 text-white">Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CourseDetail;
