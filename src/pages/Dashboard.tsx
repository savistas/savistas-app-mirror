import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BottomNav from "@/components/BottomNav";
import {
  User as UserIcon,
  Menu,
  BookOpen,
  Book
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
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Logo Savistas en arrière-plan */}
      <div
        className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/logo-savistas.png)',
          backgroundSize: '200px 200px',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          opacity: 0.5,
          filter: 'blur(0.5px)'
        }}
      />
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-6 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-[#3d84f6] rounded-xl shadow-lg">
            <UserIcon className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <span className="font-semibold text-slate-800 text-lg tracking-tight">{displayName || 'Mon profil'}</span>
        </div>
        <Button variant="ghost" size="sm" className="hover:bg-slate-100/80 transition-colors duration-200">
          <Menu className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
        </Button>
      </header>

      {/* Main Content */}
      <main className="relative z-10 p-8 space-y-8 animate-fade-in pb-32 pt-32">
        {/* Slogan au-dessus du container des cours */}
        <div className="text-center py-4">
          <p className="text-sm text-slate-600 font-medium">
            L'excellence éducative à portée de main
          </p>
        </div>

        {/* My Courses Section */}
        <div className="space-y-6">
          {/* Container blanc permanent pour les cours */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
            <div className="text-center space-y-6 mb-8">
              <h2 className="text-3xl font-bold text-black">
                Mes cours
              </h2>
            </div>
            {(!loadingCourses && courses.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-6 text-center">
                <div className="p-6 bg-[#3d84f6] rounded-full">
                  <BookOpen className="w-12 h-12 text-white" strokeWidth={1.5} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-800">Aucun cours disponible</h3>
                  <p className="text-slate-600 max-w-md leading-relaxed">
                    Commencez par créer votre premier cours pour explorer de nouvelles connaissances et développer vos compétences.
                  </p>
                </div>
                <Link to="/upload-course">
                  <Button className="mt-6 px-8 py-3 text-lg font-semibold bg-[#3d84f6] hover:bg-[#3d84f6]/90 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Créer un cours
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Link key={course.id} to={`/courses/${course.id}`} className="group">
                    <Card className="bg-white/60 backdrop-blur-sm border-slate-200/60 hover:bg-white hover:shadow-2xl hover:shadow-sky-500/10 transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-1 cursor-pointer overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-5">
                          <div className="p-4 bg-[#3d84f6] rounded-xl shadow-lg group-hover:shadow-xl transition-shadow duration-300 flex items-center justify-center w-16 h-16">
                            <Book className="w-8 h-8 text-white" strokeWidth={2} />
                          </div>
                          
                          <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-sky-600 transition-colors duration-200">
                                {course.title}
                              </h3>
                              <p className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full inline-block">
                                {course.subject || 'Matière non spécifiée'}
                              </p>
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                              Ajouté le {new Date(course.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                            {progressByCourse[course.id] && (
                              <div className="space-y-2">
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full transition-all duration-500 ease-out"
                                    style={{
                                      width: `${progressByCourse[course.id].total ? (progressByCourse[course.id].answered / progressByCourse[course.id].total) * 100 : 0}%`
                                    }}
                                  />
                                </div>
                                <p className="text-xs font-semibold text-slate-600">
                                  {progressByCourse[course.id].answered} / {progressByCourse[course.id].total} exercices complétés
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
            )}
          </div>
        </div>


      </main>

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>

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
