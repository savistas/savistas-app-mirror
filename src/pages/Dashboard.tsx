import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import BottomNav from "@/components/BottomNav";
import { Badge } from "@/components/ui/badge"; // Importation ajoutée
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
  Menu,
  BookOpen,
  Book,
  Calendar,
  Edit3
} from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import InformationSurveyDialog from "@/components/InformationSurveyDialog";
import SurveyConfirmationDialog from "@/components/SurveyConfirmationDialog";
import TroublesDetectionDialog from "@/components/TroublesDetectionDialog";

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
  const [topLearningStyles, setTopLearningStyles] = useState<string[]>([]);
  const [showTroublesDialog, setShowTroublesDialog] = useState(false);
  const [showLearningStyleDialog, setShowLearningStyleDialog] = useState(false);
  const [detectedTroubles, setDetectedTroubles] = useState<string[]>([]);
  const [troublesData, setTroublesData] = useState<any>(null);
  const [troublesLastUpdate, setTroublesLastUpdate] = useState<string | null>(null);
  const [showRetakeTestConfirmation, setShowRetakeTestConfirmation] = useState(false);

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

  useEffect(() => {
    let isMounted = true;
    const loadProfileAndCheckSurvey = async () => {
      if (!user) return;

      // Fetch troubles detection scores
      const { data: troublesData } = await supabase
        .from('troubles_detection_scores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('🔍 Debug troubles data:', troublesData); // Debug log

      if (troublesData) {
        setTroublesData(troublesData);
        setTroublesLastUpdate(troublesData.updated_at);
        
        const troubles = [];
        
        // Map des noms de troubles pour l'affichage
        const troubleNames: Record<string, string> = {
          tdah_score: 'TDAH',
          dyslexie_score: 'Dyslexie',
          dyscalculie_score: 'Dyscalculie',
          dyspraxie_score: 'Dyspraxie',
          tsa_score: 'TSA',
          trouble_langage_score: 'Trouble du langage',
          tdi_score: 'TDI',
          tics_tourette_score: 'Tics/Tourette',
          begaiement_score: 'Bégaiement',
          trouble_sensoriel_isole_score: 'Trouble sensoriel',
        };

        console.log('🔍 Medical diagnosis check:', {
          has_medical_diagnosis: troublesData.has_medical_diagnosis,
          medical_diagnosis_details: troublesData.medical_diagnosis_details
        }); // Debug log

        // Si diagnostic médical, afficher uniquement celui-ci
        if (troublesData.has_medical_diagnosis && troublesData.medical_diagnosis_details) {
          troubles.push(`Diagnostic: ${troublesData.medical_diagnosis_details}`);
        } else {
          // Sinon, afficher les troubles détectés (Modéré ou plus)
          Object.entries(troublesData).forEach(([key, value]) => {
            if (key.endsWith('_score') && ['Modéré', 'Élevé', 'Très élevé'].includes(value as string)) {
              troubles.push(`${troubleNames[key]}: ${value}`);
            }
          });
        }
        
        console.log('🔍 Detected troubles:', troubles); // Debug log
        setDetectedTroubles(troubles);
      } else {
        console.log('🔍 No troubles data found'); // Debug log
      }

      // Fetch learning styles
      const { data: learningStylesData, error: learningStylesError } = await supabase
        .from('styles_apprentissage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (learningStylesData && !learningStylesError) {
        const scores = Object.entries(learningStylesData)
          .filter(([key]) => key.startsWith('score_'))
          .map(([key, value]) => ({
            name: learningStyleNames[key] || key.replace('score_', ''),
            score: value as number,
          }))
          .sort((a, b) => b.score - a.score);
        
        setTopLearningStyles(scores.slice(0, 3).map(style => style.name));
      } else if (learningStylesError && learningStylesError.code !== 'PGRST116') {
        console.error('Error fetching learning styles:', learningStylesError);
      }

      // Check which surveys need to be completed
      const { data: profileData } = await supabase
        .from('profiles')
        .select('troubles_detection_completed, learning_styles_completed, survey_completed')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        if (!profileData.troubles_detection_completed) {
          setShowTroublesDialog(true);
        } else if (!profileData.learning_styles_completed || !profileData.survey_completed) {
          setShowLearningStyleDialog(true);
        }
      } else {
        // New user - create profile and show troubles detection first
        await supabase.from('profiles').insert({
          user_id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          survey_completed: false,
          troubles_detection_completed: false,
          learning_styles_completed: false
        });
        if (isMounted) {
          setDisplayName(user.user_metadata?.full_name || user.email || 'Mon profil');
          setShowTroublesDialog(true);
        }
      }

      if (profileData) {
        if (isMounted) {
          setDisplayName(profileData.full_name || user.user_metadata?.full_name || profileData.email || user.email || 'Mon profil');
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
        .update({ survey_completed: true, learning_styles_completed: true })
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating survey_completed status:', error);
      } else {
        setShowSurveyDialog(false);
        setShowLearningStyleDialog(false);
        window.location.reload(); // Refresh pour voir les nouveaux badges
      }
    }
  };

  // Handlers pour les dialogs
  const handleTroublesComplete = async () => {
    setShowTroublesDialog(false);
    
    // Vérifier si le questionnaire de styles d'apprentissage a déjà été complété
    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('learning_styles_completed, survey_completed')
        .eq('user_id', user.id)
        .single();
      
      // N'afficher le questionnaire de styles que s'il n'a pas été complété
      if (profileData && !profileData.learning_styles_completed && !profileData.survey_completed) {
        setShowLearningStyleDialog(true);
      } else {
        // Si aucun autre questionnaire à faire, recharger la page pour afficher les résultats
        console.log('🔄 Rechargement de la page pour afficher les nouveaux résultats...');
        window.location.reload();
      }
    } else {
      // Si pas d'utilisateur, recharger quand même
      console.log('🔄 Rechargement de la page...');
      window.location.reload();
    }
  };

  const handleLearningStyleComplete = async () => {
    if (user) {
      await supabase
        .from('profiles')
        .update({ learning_styles_completed: true, survey_completed: true })
        .eq('user_id', user.id);
      
      setShowLearningStyleDialog(false);
      window.location.reload(); // Refresh pour voir les nouveaux badges
    }
  };

  const handleModifyTroublesTest = async () => {
    setShowRetakeTestConfirmation(true);
  };

  const handleConfirmRetakeTest = async () => {
    if (user) {
      try {
        console.log('🔄 Début de la réinitialisation des données troubles pour user:', user.id);

        // 1. Remettre le flag troubles_detection_completed à false dans profiles
        console.log('1️⃣ Mise à jour du profil...');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ troubles_detection_completed: false })
          .eq('user_id', user.id);
        
        if (profileError) {
          console.error('❌ Erreur mise à jour profil:', profileError);
          throw profileError;
        }
        console.log('✅ Profil mis à jour');

        // 2. Supprimer les réponses du questionnaire
        console.log('2️⃣ Suppression des réponses du questionnaire...');
        const { error: questionsError } = await supabase
          .from('troubles_questionnaire_reponses')
          .delete()
          .eq('user_id', user.id);
        
        if (questionsError) {
          console.error('❌ Erreur suppression questions:', questionsError);
          throw questionsError;
        }
        console.log('✅ Réponses du questionnaire supprimées');

        // 3. Supprimer les scores de détection
        console.log('3️⃣ Suppression des scores de détection...');
        const { error: scoresError } = await supabase
          .from('troubles_detection_scores')
          .delete()
          .eq('user_id', user.id);
        
        if (scoresError) {
          console.error('❌ Erreur suppression scores:', scoresError);
          throw scoresError;
        }
        console.log('✅ Scores de détection supprimés');

        // 4. Réinitialiser les états locaux
        console.log('4️⃣ Réinitialisation des états locaux...');
        setTroublesData(null);
        setDetectedTroubles([]);
        setTroublesLastUpdate(null);
        console.log('✅ États locaux réinitialisés');

        // 5. Fermer la confirmation et ouvrir le dialog de test
        console.log('5️⃣ Ouverture du nouveau test...');
        setShowRetakeTestConfirmation(false);
        setShowTroublesDialog(true);

        console.log('🎉 Réinitialisation complète terminée avec succès !');
      } catch (error) {
        console.error('❌ Erreur lors de la suppression des données:', error);
        // Fermer quand même la modal en cas d'erreur
        setShowRetakeTestConfirmation(false);
        // Optionnel: ajouter une notification d'erreur pour l'utilisateur
        alert('Une erreur est survenue lors de la réinitialisation. Veuillez réessayer.');
      }
    } else {
      console.error('❌ Aucun utilisateur connecté');
    }
  };

  // Fonction pour obtenir la couleur selon le niveau de risque
  const getTroubleColor = (level: string) => {
    switch (level) {
      case 'Faible':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Modéré':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Élevé':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Très élevé':
        return 'bg-red-200 text-red-900 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-10 h-10 object-contain" />
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

        {/* Top Learning Styles Section */}
        {topLearningStyles.length > 0 && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8 text-center">
            <h2 className="text-xl font-bold text-black mb-4">Vos styles d'apprentissage dominants</h2>
            <div className="flex flex-wrap justify-center gap-2">
              {topLearningStyles.map((style, index) => {
                const pastelColors = [
                  "bg-pink-100 text-pink-800",
                  "bg-green-100 text-green-800",
                  "bg-purple-100 text-purple-800",
                  "bg-yellow-100 text-yellow-800",
                  "bg-blue-100 text-blue-800",
                  "bg-indigo-100 text-indigo-800",
                ];
                const colorClass = pastelColors[index % pastelColors.length];
                return (
                  <Badge key={index} variant="secondary" className={`px-4 py-2 text-md font-semibold ${colorClass}`}>
                    {style}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

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
                              <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-sky-600 transition-colors duration-200 h-[2.5rem] overflow-hidden">
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

        {/* Pré-détection de trouble Section - EN BAS APRÈS LES COURS */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/60 shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-black">🧠 Pré-détection de trouble</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleModifyTroublesTest}
              className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Modifier / Refaire le test
            </Button>
          </div>

          {!troublesData ? (
            // Aucun test n'a été fait
            <div className="text-center py-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-600 mb-4">Aucun test renseigné pour l'instant.</p>
                <Button
                  onClick={() => setShowTroublesDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Faire le test
                </Button>
              </div>
            </div>
          ) : (
            // Résultats disponibles
            <div className="space-y-4">
              {troublesData.has_medical_diagnosis && troublesData.medical_diagnosis_details && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Diagnostic médical déclaré :</h3>
                  <p className="text-blue-800">{troublesData.medical_diagnosis_details}</p>
                </div>
              )}

              {/* Affichage des scores du QCM si disponibles */}
              {Object.entries(troublesData).some(([key, value]) => 
                key.endsWith('_score') && value && value !== 'Faible'
              ) && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-800">
                    {troublesData.has_medical_diagnosis ? 'QCM complémentaire réalisé' : 'Résultats de la prédétection'}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {Object.entries(troublesData).map(([key, value]) => {
                      if (!key.endsWith('_score') || !value || value === 'Faible') return null;
                      
                      const troubleNames: Record<string, string> = {
                        tdah_score: 'TDAH',
                        dyslexie_score: 'Dyslexie',
                        dyscalculie_score: 'Dyscalculie',
                        dyspraxie_score: 'Dyspraxie',
                        tsa_score: 'TSA',
                        trouble_langage_score: 'Trouble du langage',
                        tdi_score: 'TDI',
                        tics_tourette_score: 'Tics/Tourette',
                        begaiement_score: 'Bégaiement',
                        trouble_sensoriel_isole_score: 'Trouble sensoriel',
                      };

                      return (
                        <div
                          key={key}
                          className={`px-3 py-2 rounded-lg border text-sm font-medium ${getTroubleColor(value as string)}`}
                        >
                          <span className="font-semibold">{troubleNames[key]}:</span> {value as string}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Affichage de la date de dernière mise à jour */}
              {troublesLastUpdate && (
                <div className="flex items-center text-xs text-gray-500 pt-2 border-t border-gray-200">
                  <Calendar className="h-3 w-3 mr-1" />
                  Dernière mise à jour : {new Date(troublesLastUpdate).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </div>
              )}

              {/* Message d'avertissement */}
              <p className="text-xs text-gray-500 italic border-t border-gray-200 pt-3">
                Ces résultats sont indicatifs et ne remplacent pas un diagnostic médical professionnel.
              </p>
            </div>
          )}
        </div>


      </main>

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>

      <TroublesDetectionDialog
        isOpen={showTroublesDialog}
        onClose={() => setShowTroublesDialog(false)}
        onComplete={handleTroublesComplete}
      />

      <InformationSurveyDialog
        isOpen={showLearningStyleDialog || showSurveyDialog}
        onClose={handleCloseSurveyDialog}
        onSurveyComplete={handleLearningStyleComplete}
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

      {/* Dialogue de confirmation pour refaire le test des troubles */}
      <AlertDialog open={showRetakeTestConfirmation} onOpenChange={setShowRetakeTestConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr de vouloir refaire le test ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela écrasera vos anciennes réponses et vous devrez refaire intégralement le test de pré-détection des troubles. 
              Tous vos résultats précédents seront définitivement supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowRetakeTestConfirmation(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRetakeTest} className="bg-red-600 hover:bg-red-700">
              Oui, refaire le test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
