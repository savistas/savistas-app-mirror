import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BottomNav from "@/components/BottomNav";
import { 
  User as UserIcon, 
  Menu, 
  BookOpen
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import InformationSurveyDialog from "@/components/InformationSurveyDialog";
import SurveyConfirmationDialog from "@/components/SurveyConfirmationDialog";

interface Course {
  id: string;
  title: string;
  subject: string | null;
  // level: string | null; // Supprimé car la colonne a été supprimée
  cover_url: string | null;
  file_url: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState<boolean>(false);
  const [progressByCourse, setProgressByCourse] = useState<any>({});
  const [showSurveyDialog, setShowSurveyDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [surveyCurrentQuestionIndex, setSurveyCurrentQuestionIndex] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string | string[]>>({});

  useEffect(() => {
    let isMounted = true;
    const loadProfileAndCheckSurvey = async () => {
      if (!user) return;
      // Try fetch current user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name,email,survey_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        // Fallback to auth user metadata
        if (isMounted) setDisplayName(user.user_metadata?.full_name || user.email || 'Mon profil');
        return;
      }

      if (!data) {
        // Create minimal profile row if missing
        await supabase.from('profiles').insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          survey_completed: false // Default to false for new profiles
        });
        if (isMounted) {
          setDisplayName(user.user_metadata?.full_name || user.email || 'Mon profil');
          setShowSurveyDialog(true); // Show survey for new profiles
        }
      } else {
        if (isMounted) {
          setDisplayName(data.full_name || user.user_metadata?.full_name || data.email || user.email || 'Mon profil');
          if (!data.survey_completed) {
            setShowSurveyDialog(true); // Show survey if not completed
          }
        }
      }
    };

    loadProfileAndCheckSurvey();
    return () => { isMounted = false; };
  }, [user]);

  const handleSurveyComplete = async () => {
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ survey_completed: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating survey_completed status:', error);
      } else {
        setShowSurveyDialog(false); // Hide dialog after survey is completed and status updated
      }
    }
  };

  useEffect(() => {
    const loadCourses = async () => {
      if (!user) return;
      setLoadingCourses(true);
      const { data, error } = await supabase
        .from('courses')
        .select('id,title,subject,cover_url,file_url,created_at') // Supprimé 'level'
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) setCourses(data as Course[]);
      setLoadingCourses(false);
    };
    loadCourses();
  }, [user]);

  useEffect(() => {
    if (!user || courses.length === 0) return;
    let cancelled = false;
    const fetchProgress = async () => {
      const entries = await Promise.all(
        courses.map(async (course) => {
          const { count: totalExercises } = await supabase
            .from('exercises')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id);
          const { count: completedExercises } = await supabase
            .from('exercises')
            .select('id', { count: 'exact', head: true })
            .eq('course_id', course.id)
            .eq('user_id', user.id)
            .eq('statut', 'Terminé');
          return [course.id, { total: totalExercises || 0, answered: completedExercises || 0 }] as const;
        })
      );
      if (!cancelled) {
        const newProgress = entries.reduce((acc, [courseId, progress]) => {
          acc[courseId] = progress;
          return acc;
        }, {} as Record<string, { total: number; answered: number }>);
        setProgressByCourse(newProgress);
      }
    };
    fetchProgress();
    return () => { cancelled = true; };
  }, [user, courses]);

  const handleCloseSurveyDialog = async () => {
    setShowSurveyDialog(false);
    // Check if the survey was completed before showing confirmation dialog
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('survey_completed')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data && !data.survey_completed) {
        setShowConfirmationDialog(true); // Only show confirmation if survey is not completed
      }
    }
  };

  const handleConfirmSurvey = () => {
    setShowConfirmationDialog(false);
    setShowSurveyDialog(true); // Reopen survey dialog
  };

  const handleCancelSurvey = () => {
    setShowConfirmationDialog(false);
    // User chose not to answer, do nothing further
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <UserIcon className="w-8 h-8 text-primary" strokeWidth={1.5} />
          <span className="font-medium text-foreground">{displayName || 'Mon profil'}</span>
        </div>
        <Button variant="ghost" size="sm">
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </Button>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6 animate-fade-in pb-24">
        {/* My Courses Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Mes cours</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(!loadingCourses && courses.length === 0) && (
              <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center w-full col-span-full">
                <BookOpen className="w-16 h-16 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-700">Aucun cours disponible</h3>
                <p className="text-gray-500">Commencez par créer votre premier cours pour explorer de nouvelles connaissances.</p>
                <Link to="/upload-course">
                  <Button className="mt-4 px-6 py-3 text-lg">Créer un cours</Button>
                </Link>
              </div>
            )}
            {courses.map((course) => (
              <Link key={course.id} to={`/courses/${course.id}`}>
                <Card className="border-border hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-primary/10 rounded-lg flex items-center justify-center w-12 h-12 overflow-hidden">
                        {course.cover_url ? (
                          <img src={course.cover_url} alt={`Couverture ${course.title}`} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <BookOpen className="w-6 h-6 text-primary" strokeWidth={1.5} />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{course.title}</h3>
                          <p className="text-sm text-muted-foreground">{course.subject || '—'}</p> {/* Supprimé course.level */}
                        </div>
                        <p className="text-xs text-muted-foreground">Ajouté le {new Date(course.created_at).toLocaleDateString('fr-FR')}</p>
                        {progressByCourse[course.id] && (
                          <div className="space-y-1">
                            <Progress value={progressByCourse[course.id].total ? (progressByCourse[course.id].answered / progressByCourse[course.id].total) * 100 : 0} />
                            <p className="text-xs text-muted-foreground">
                              {progressByCourse[course.id].answered} / {progressByCourse[course.id].total} exercices
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

      </main>

      {/* Bottom Navigation */}
      <BottomNav />

      <InformationSurveyDialog
        isOpen={showSurveyDialog}
        onClose={handleCloseSurveyDialog}
        onSurveyComplete={handleSurveyComplete}
        initialQuestionIndex={surveyCurrentQuestionIndex}
        initialAnswers={surveyAnswers}
        onQuestionIndexChange={setSurveyCurrentQuestionIndex}
        onAnswersChange={setSurveyAnswers}
      />

      <SurveyConfirmationDialog
        isOpen={showConfirmationDialog}
        onConfirm={handleConfirmSurvey}
        onCancel={handleCancelSurvey}
      />
    </div>
  );
};

export default Dashboard;
