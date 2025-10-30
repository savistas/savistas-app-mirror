/**
 * Page du Professeur Virtuel Equos
 * Avec système de conversation contextualisée
 */

import { useCallback, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mic, Phone, MessageSquare, History, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeLearningStyles } from '@/services/learningStylesAnalyzer';
import BurgerMenu from '@/components/BurgerMenu';
import BottomNav from '@/components/BottomNav';
import { EquosLiveKitContainer } from '@/components/equos/EquosLiveKitContainer';
import {
  createEquosAgent,
  createEquosSession,
  getDefaultAvatarId
} from '@/services/equosAgentService';
import {
  generateEquosInstructions,
  type UserProfile,
  type ConversationContext
} from '@/services/equosInstructionsGenerator';
import type { CreateSessionResponse } from '@/services/equosAgentService';
import { ConversationTypeSelector } from '@/components/virtual-teacher/ConversationTypeSelector';
import { ContentReferenceSelector } from '@/components/virtual-teacher/ContentReferenceSelector';
import { ConversationHistoryList } from '@/components/virtual-teacher/ConversationHistoryList';
import { TimeUpDialog } from '@/components/virtual-teacher/TimeUpDialog';
import { useUserCourses } from '@/hooks/useUserCourses';
import { useUserExercises } from '@/hooks/useUserExercises';
import { useAllErrors } from '@/hooks/useAllErrors';
import { useConversationTimeLimit, formatTime } from '@/hooks/useConversationTimeLimit';
import type { ConversationType } from '@/components/virtual-teacher/types';

export default function ProfesseurParticulierVirtuel() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  // Fetch des données
  const { data: courses = [], isLoading: isLoadingCourses, error: coursesError } = useUserCourses(user?.id);
  const { data: exercises = [], isLoading: isLoadingExercises, error: exercisesError } = useUserExercises(user?.id);
  const { data: errors = [], isLoading: isLoadingErrors, error: errorsError } = useAllErrors();

  // Limitation de temps pour les utilisateurs gratuits (plan "basic")
  const { timeRemainingSeconds, isLimitReached, subscription, isLoading: isLoadingTimeLimit } = useConversationTimeLimit(user?.id);

  // États
  const [conversationType, setConversationType] = useState<ConversationType>('general');
  const [selectedReferenceId, setSelectedReferenceId] = useState<string | undefined>();
  const [selectedCourseIdForExercise, setSelectedCourseIdForExercise] = useState<string | undefined>();
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [sessionData, setSessionData] = useState<CreateSessionResponse | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [urlParamsProcessed, setUrlParamsProcessed] = useState(false);
  const [preventReset, setPreventReset] = useState(false);
  const [pendingReferenceId, setPendingReferenceId] = useState<string | null>(null);
  const [showTimeUpDialog, setShowTimeUpDialog] = useState(false);
  const [isPrefilledFromUrl, setIsPrefilledFromUrl] = useState(false);

  // Traiter les paramètres URL au chargement
  useEffect(() => {
    if (!urlParamsProcessed && !isLoadingErrors && !isLoadingCourses && !isLoadingExercises) {
      const typeParam = searchParams.get('type');
      const errorIdParam = searchParams.get('errorId');
      const courseIdParam = searchParams.get('courseId');
      const exerciseIdParam = searchParams.get('exerciseId');

      // ÉTAPE 1 : Pré-sélectionner le TYPE de conversation depuis l'URL (sans encore sélectionner l'élément)
      if (typeParam === 'error' && errorIdParam && errors.length > 0) {
        // Vérifier que l'erreur existe dans la liste
        const errorExists = errors.some(e => e.id === errorIdParam);
        if (errorExists) {
          console.log('🔗 Paramètres URL détectés - Type: error, ID en attente:', errorIdParam);
          setPreventReset(true); // Empêcher la réinitialisation automatique
          setConversationType('error'); // D'ABORD changer le type pour que le dropdown apparaisse
          setPendingReferenceId(errorIdParam); // Stocker l'ID pour sélection ultérieure
          setUrlParamsProcessed(true);
        } else {
          console.warn('⚠️ Erreur non trouvée dans la liste:', errorIdParam);
          setUrlParamsProcessed(true);
        }
      } else if (typeParam === 'course' && courseIdParam && courses.length > 0) {
        const courseExists = courses.some(c => c.id === courseIdParam);
        if (courseExists) {
          console.log('🔗 Paramètres URL détectés - Type: course, ID en attente:', courseIdParam);
          setPreventReset(true);
          setConversationType('course');
          setPendingReferenceId(courseIdParam);
          setIsPrefilledFromUrl(true); // Mark as prefilled from URL
          setUrlParamsProcessed(true);
        }
      } else if (typeParam === 'exercise' && exerciseIdParam && exercises.length > 0) {
        const exerciseExists = exercises.some(e => e.id === exerciseIdParam);
        if (exerciseExists) {
          console.log('🔗 Paramètres URL détectés - Type: exercise, ID en attente:', exerciseIdParam);
          setPreventReset(true);
          setConversationType('exercise');
          setPendingReferenceId(exerciseIdParam);
          setUrlParamsProcessed(true);
        }
      } else if (!typeParam && !errorIdParam && !courseIdParam && !exerciseIdParam) {
        // Aucun paramètre URL, marquer comme traité
        setUrlParamsProcessed(true);
      }
    }
  }, [searchParams, urlParamsProcessed, isLoadingErrors, isLoadingCourses, isLoadingExercises, errors, courses, exercises, toast]);

  // ÉTAPE 2 : Appliquer la sélection de l'élément APRÈS que le dropdown soit rendu
  useEffect(() => {
    if (pendingReferenceId && conversationType !== 'general' && urlParamsProcessed) {
      console.log('✅ Application de la sélection en attente:', pendingReferenceId);
      setSelectedReferenceId(pendingReferenceId);
      setPendingReferenceId(null); // Nettoyer l'ID en attente

      // Toast pour confirmer la pré-sélection
      toast({
        title: `${conversationType === 'error' ? 'Erreur' : conversationType === 'course' ? 'Cours' : 'Exercice'} sélectionné(e)`,
        description: 'L\'élément a été automatiquement sélectionné pour vous',
      });

      // Réactiver la réinitialisation après un délai
      setTimeout(() => setPreventReset(false), 200);
    }
  }, [conversationType, pendingReferenceId, urlParamsProcessed, toast]);

  // Réinitialiser la sélection quand le type change (sauf si changé par URL)
  useEffect(() => {
    if (urlParamsProcessed && !preventReset && !pendingReferenceId) {
      setSelectedReferenceId(undefined);
      setSelectedCourseIdForExercise(undefined);
    }
  }, [conversationType, urlParamsProcessed, preventReset, pendingReferenceId]);

  // Réinitialiser l'exercice sélectionné quand le cours change
  useEffect(() => {
    if (conversationType === 'exercise' && urlParamsProcessed && !preventReset && !pendingReferenceId) {
      setSelectedReferenceId(undefined);
    }
  }, [selectedCourseIdForExercise, conversationType, urlParamsProcessed, preventReset, pendingReferenceId]);

  /**
   * Démarrer la conversation avec Equos
   */
  const startConversation = useCallback(async () => {
    try {
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive',
        });
        return;
      }

      // Validation : si type != général, vérifier qu'une référence est sélectionnée
      if (conversationType !== 'general' && !selectedReferenceId) {
        toast({
          title: 'Sélection requise',
          description: 'Veuillez sélectionner un élément pour continuer',
          variant: 'destructive',
        });
        return;
      }

      setIsCreatingSession(true);

      toast({
        title: 'Préparation...',
        description: 'Analyse de votre profil d\'apprentissage',
      });

      // ========================================
      // ÉTAPE 1 : RÉCUPÉRER PROFIL COMPLET
      // ========================================
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email, education_level, classes, subjects')
        .eq('user_id', user.id)
        .single();

      // ========================================
      // ÉTAPE 2 : RÉCUPÉRER STYLES D'APPRENTISSAGE
      // ========================================
      const { data: stylesData } = await supabase
        .from('styles_apprentissage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const learningStyles = stylesData
        ? analyzeLearningStyles(stylesData)
        : { top3: [], formatted: '' };

      console.log('📊 Styles d\'apprentissage:', learningStyles.top3.map(s => s?.name));

      // ========================================
      // ÉTAPE 3 : RÉCUPÉRER TROUBLES DÉTECTÉS
      // ========================================
      const { data: troublesData } = await supabase
        .from('troubles_detection_scores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Formater les troubles
      let troublesText = 'Aucun trouble détecté';
      if (troublesData) {
        const troublesList: string[] = [];

        const troubleMapping = {
          tdah_score: 'TDAH',
          dyslexie_score: 'Dyslexie',
          dyscalculie_score: 'Dyscalculie',
          dyspraxie_score: 'Dyspraxie',
          tsa_score: 'TSA (Autisme)',
          trouble_langage_score: 'Trouble du langage',
          tdi_score: 'TDI',
          tics_tourette_score: 'Tics/Tourette',
          begaiement_score: 'Bégaiement',
          trouble_sensoriel_isole_score: 'Trouble sensoriel isolé'
        };

        for (const [key, label] of Object.entries(troubleMapping)) {
          const score = (troublesData as any)[key];
          if (score && score !== 'Faible') {
            troublesList.push(`${label} (niveau: ${score})`);
          }
        }

        if (troublesData.has_medical_diagnosis && troublesData.medical_diagnosis_details) {
          troublesList.push(`Diagnostic médical: ${troublesData.medical_diagnosis_details}`);
        }

        if (troublesList.length > 0) {
          troublesText = troublesList.join(', ');
        }
      }

      console.log('🏥 Troubles:', troublesText);

      // ========================================
      // ÉTAPE 4 : CRÉER PROFIL UTILISATEUR
      // ========================================
      const userProfile: UserProfile = {
        username: profileData?.full_name || user.email?.split('@')[0] || 'étudiant',
        education_level: profileData?.education_level,
        classes: profileData?.classes,
        subjects: profileData?.subjects,
        learning_styles: learningStyles.top3.map(s => s?.name).join(', ') || 'Non défini',
        learning_styles_scores: stylesData || undefined, // Scores bruts pour directives détaillées
        troubles: troublesText,
        custom_message: additionalInstructions.trim() || undefined
      };

      console.log('👤 Profil utilisateur:', userProfile);

      // ========================================
      // ÉTAPE 5 : CONSTRUIRE LE CONTEXTE DE CONVERSATION
      // ========================================
      const conversationContext: ConversationContext = {
        type: conversationType
      };

      // Ajouter les détails selon le type de conversation
      if (conversationType === 'course' && selectedReferenceId) {
        const selectedCourse = courses.find(c => c.id === selectedReferenceId);
        if (selectedCourse) {
          conversationContext.courseName = selectedCourse.title;
          conversationContext.courseContent = selectedCourse.course_content;
        }
      } else if (conversationType === 'exercise' && selectedReferenceId) {
        const selectedExercise = exercises.find(e => e.id === selectedReferenceId);
        // Utiliser selectedCourseIdForExercise car on a maintenant une sélection en 2 étapes
        const selectedCourse = selectedCourseIdForExercise
          ? courses.find(c => c.id === selectedCourseIdForExercise)
          : null;
        if (selectedExercise) {
          conversationContext.exerciseTitle = selectedExercise.exercice_title || `Exercice ${selectedExercise.id.slice(0, 8)}`;
          conversationContext.exerciseContent = JSON.stringify(selectedExercise.metadata, null, 2);
          conversationContext.courseName = selectedCourse?.title || 'Cours non identifié';
        }
      } else if (conversationType === 'error' && selectedReferenceId) {
        const selectedError = errors.find(e => e.id === selectedReferenceId);
        if (selectedError) {
          // Construire une description détaillée de l'erreur
          let errorDescription = `Matière: ${selectedError.matiere}\n`;
          errorDescription += `Catégorie: ${selectedError.categorie}\n`;
          errorDescription += `Message: ${selectedError.message}\n`;
          if (selectedError.justification) {
            errorDescription += `Justification: ${selectedError.justification}\n`;
          }

          // Ajouter le contexte du cours et de l'exercice
          if (selectedError.course_title) {
            errorDescription += `\nCours: ${selectedError.course_title}\n`;
          }
          if (selectedError.exercice_title) {
            errorDescription += `Exercice: ${selectedError.exercice_title}\n`;
          }

          // Ajouter les questions et réponses si disponibles
          if (selectedError.questions && selectedError.questions.length > 0) {
            errorDescription += `\n--- QUESTION(S) CONCERNÉE(S) ---\n`;

            selectedError.questions.forEach((question, index) => {
              errorDescription += `\nQuestion ${index + 1}: ${question.question_titre}\n`;

              // Ajouter les options de réponse
              if (question.reponses && question.reponses.length > 0) {
                errorDescription += `Options:\n`;
                question.reponses.forEach(reponse => {
                  const isCorrect = reponse.correcte === 'true' || reponse.correcte === true;
                  errorDescription += `  ${reponse.lettre}. ${reponse.texte}${isCorrect ? ' ✓ (correcte)' : ''}\n`;
                });
              }

              // Ajouter la réponse de l'utilisateur si disponible
              if (selectedError.user_responses && selectedError.user_responses.length > 0) {
                const userResponse = selectedError.user_responses.find(
                  r => r.question_index === question.question_index
                );
                if (userResponse) {
                  const userAnswerText = question.reponses?.find(
                    r => r.lettre === userResponse.user_answer
                  )?.texte || userResponse.user_answer;
                  errorDescription += `Réponse de l'élève: ${userResponse.user_answer}. ${userAnswerText} ✗\n`;
                }
              }

              // Ajouter l'explication si disponible
              if (question.explication_reponse_correcte) {
                errorDescription += `Explication: ${question.explication_reponse_correcte}\n`;
              }
            });
          }

          conversationContext.errorCategory = selectedError.categorie;
          conversationContext.errorDescription = errorDescription;
        }
      }

      console.log('🎯 Contexte de conversation:', conversationContext);

      // ========================================
      // ÉTAPE 6 : GÉNÉRER INSTRUCTIONS EQUOS
      // ========================================
      toast({
        title: 'Génération des instructions...',
        description: 'Création du professeur personnalisé',
      });

      const instructions = generateEquosInstructions(userProfile, conversationContext);

      console.log('📝 Instructions générées:', instructions.length, 'caractères');

      // ========================================
      // ÉTAPE 6 : CRÉER AGENT EQUOS
      // ========================================
      toast({
        title: 'Création de l\'agent IA...',
        description: 'Configuration du professeur virtuel',
      });

      const agent = await createEquosAgent(
        instructions,
        userProfile.username
      );

      console.log('✅ Agent Equos créé:', agent.id);

      // ========================================
      // ÉTAPE 7 : CRÉER SESSION AVEC AVATAR
      // ========================================
      toast({
        title: 'Démarrage de l\'avatar...',
        description: 'Initialisation de la session vidéo',
      });

      // Utiliser l'avatar Alexis par défaut (ou celui configuré dans .env)
      const envAvatarId = getDefaultAvatarId();
      console.log('🔍 [DEBUG] getDefaultAvatarId() retourne:', envAvatarId);
      const avatarId = envAvatarId || 'cmgqp4w610019ji0jgkzypkyo';
      console.log('🔍 [DEBUG] Avatar ID final:', avatarId);

      const session = await createEquosSession(
        agent.id,
        avatarId,
        userProfile.username,
        {
          identity: `student_${user.id}`,
          name: userProfile.username
        },
        // Pour les utilisateurs "basic", limiter la durée à leur temps restant
        subscription === 'basic' ? timeRemainingSeconds : undefined
      );

      console.log('✅ Session créée:', session.session.id);
      console.log('🔗 LiveKit URL:', session.session.host.serverUrl);

      setSessionData(session);

      // ========================================
      // ÉTAPE 8 : SAUVEGARDER EN BASE DE DONNÉES
      // ========================================
      console.log('💾 Sauvegarde de la conversation:', {
        conversation_type: conversationType,
        context_id: selectedReferenceId,
        has_context: !!conversationContext
      });

      const { data: newConversation, error: insertError } = await supabase
        .from('ai_teacher_conversations')
        .insert({
          user_id: user.id,
          conversation_type: conversationType,
          context_id: selectedReferenceId || null,
          context_data: {
            additionalInstructions: additionalInstructions || null,
            conversationContext
          },
          agent_config: {
            equos_agent_id: agent.id,
            equos_session_id: session.session.id,
            learning_styles: learningStyles.top3.map(s => s?.name),
            instructions: instructions,
            avatar_id: avatarId
          },
          status: 'active'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur lors de la sauvegarde de la conversation:', insertError);
        throw insertError;
      }

      if (newConversation) {
        setConversationId(newConversation.id);
        console.log('✅ Conversation sauvegardée avec succès:', newConversation.id);
        console.log('📊 Détails:', {
          type: newConversation.conversation_type,
          context_id: newConversation.context_id,
          status: newConversation.status
        });
      } else {
        console.warn('⚠️ Conversation sauvegardée mais pas de données retournées');
      }

      toast({
        title: '🎉 Prêt !',
        description: 'Votre professeur virtuel vous attend',
      });

      setIsCreatingSession(false);

    } catch (error) {
      console.error('❌ Erreur démarrage conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';

      toast({
        title: 'Erreur',
        description: `Impossible de démarrer: ${errorMessage}`,
        variant: 'destructive',
      });

      setIsCreatingSession(false);
    }
  }, [user, additionalInstructions, conversationType, selectedReferenceId, selectedCourseIdForExercise, courses, exercises, errors, toast]);

  /**
   * Arrêter la conversation
   */
  const stopConversation = useCallback(async () => {
    try {
      if (conversationId) {
        await supabase
          .from('ai_teacher_conversations')
          .update({ status: 'ended' })
          .eq('id', conversationId);

        console.log('✅ Conversation marquée comme terminée');
      }

      setSessionData(null);
      setConversationId(null);

      toast({
        title: 'Conversation terminée',
        description: 'Session sauvegardée avec succès',
      });

    } catch (error) {
      console.error('❌ Erreur arrêt conversation:', error);
    }
  }, [conversationId, toast]);

  const isConnected = sessionData !== null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-[4.5rem]">
          <div className="flex items-center space-x-2 md:space-x-4">
            <img
              src="/logo-savistas.png"
              alt="Savistas Logo"
              className="h-10 md:h-12 w-auto"
            />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-slate-900">Professeur Particulier Virtuel</h1>
              <p className="text-xs text-slate-500">Avatar IA personnalisé</p>
            </div>
          </div>
          <BurgerMenu />
        </div>
      </header>

      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-24 max-w-7xl">
        {/* Layout responsive : Instructions en haut, Avatar en dessous (mobile) */}
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
          {/* Tabs Discuter / Historique */}
          <Tabs defaultValue="chat" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Discuter
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique
              </TabsTrigger>
            </TabsList>

            {/* TAB: Discuter */}
            <TabsContent value="chat" className="mt-6">
              {/* Section de configuration - Toujours visible */}
              <Card className={sessionData ? "border" : "border-2"}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">🎭 Professeur Particulier Virtuel</CardTitle>
                  <CardDescription className="mt-1">
                    Avatar IA personnalisé selon votre profil
                  </CardDescription>
                </div>
                {isConnected && <Badge className="bg-green-500">✅ Connecté</Badge>}
                {isCreatingSession && <Badge variant="secondary" className="animate-pulse">⏳ Création...</Badge>}
                {!isConnected && !isCreatingSession && <Badge variant="outline">⏸️ Prêt</Badge>}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {!sessionData && (
                <>
                  {/* Type de conversation - Hidden if prefilled from URL */}
                  {!isPrefilledFromUrl && (
                    <ConversationTypeSelector
                      value={conversationType}
                      onChange={setConversationType}
                      disabled={isCreatingSession}
                    />
                  )}

                  {/* Sélection de contenu (cours/exercice/erreur) - Hidden if prefilled from URL */}
                  {!isPrefilledFromUrl && (
                    <ContentReferenceSelector
                      conversationType={conversationType}
                      value={selectedReferenceId}
                      onChange={setSelectedReferenceId}
                      courses={courses}
                      exercises={exercises}
                      errors={errors}
                      isLoading={isLoadingCourses || isLoadingExercises || isLoadingErrors}
                      error={coursesError || exercisesError || errorsError}
                      disabled={isCreatingSession}
                      selectedCourseId={selectedCourseIdForExercise}
                      onCourseChange={setSelectedCourseIdForExercise}
                    />
                  )}

                  {/* Display selected course info when prefilled from URL */}
                  {isPrefilledFromUrl && selectedReferenceId && (
                    <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary" className="text-sm">
                          📚 Cours sélectionné
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-primary">
                        {courses.find(c => c.id === selectedReferenceId)?.title || 'Chargement...'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Le cours a été automatiquement sélectionné depuis vos documents
                      </p>
                    </div>
                  )}

                  {/* Instructions supplémentaires */}
                  <div className="space-y-2">
                    <Label htmlFor="instructions" className="text-sm font-medium">
                      💬 Instructions supplémentaires (optionnel)
                    </Label>
                    <Textarea
                      id="instructions"
                      className="min-h-[80px] resize-none"
                      placeholder={
                        conversationType === 'general'
                          ? "Ex: 'Explique-moi de manière très simple' ou 'Sois encourageant et positif'"
                          : conversationType === 'course'
                          ? "Questions sur ce cours ou points à approfondir..."
                          : conversationType === 'exercise'
                          ? "Décrivez où vous bloquez..."
                          : "Expliquez ce que vous ne comprenez pas..."
                      }
                      value={additionalInstructions}
                      onChange={(e) => setAdditionalInstructions(e.target.value)}
                      disabled={isCreatingSession}
                    />
                  </div>

                  {/* Afficher le compteur de temps pour les utilisateurs gratuits */}
                  {subscription === 'basic' && !isLoadingTimeLimit && (
                    <Alert className={isLimitReached ? 'border-red-200 bg-red-50/50' : 'border-orange-200 bg-orange-50/50'}>
                      {isLimitReached ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-orange-600" />
                      )}
                      <AlertDescription className={isLimitReached ? 'text-sm text-red-900' : 'text-sm text-orange-900'}>
                        {isLimitReached ? (
                          <>
                            <strong>Limite atteinte :</strong> Vous avez utilisé vos 3 minutes gratuites.
                            Passez au plan Premium pour des conversations illimitées.
                          </>
                        ) : (
                          <>
                            <strong>Temps restant :</strong> {formatTime(timeRemainingSeconds)} sur 3 minutes (Plan Gratuit)
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    onClick={startConversation}
                    disabled={isCreatingSession || isLimitReached}
                    size="lg"
                    className="w-full text-base font-semibold h-12"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    {isCreatingSession
                      ? 'Création de votre professeur...'
                      : isLimitReached
                      ? 'Limite atteinte - Passez au plan supérieur'
                      : 'Démarrer la conversation'}
                  </Button>
                </>
              )}

              {sessionData && (
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Conversation en cours avec votre professeur virtuel
                  </p>
                  <Button
                    onClick={stopConversation}
                    variant="destructive"
                    size="lg"
                    className="w-full"
                  >
                    <Phone className="h-5 w-5 mr-2" />
                    Terminer la conversation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Avatar container - En dessous sur mobile */}
          {sessionData && (
            <div className="flex justify-center">
              <EquosLiveKitContainer
                serverUrl={sessionData.session.host.serverUrl}
                token={sessionData.consumerAccessToken}
                avatarIdentity={sessionData.session.avatar.id}
                avatarName={sessionData.session.avatar.name}
                maxDurationSeconds={subscription === 'basic' ? timeRemainingSeconds : undefined}
                onConnected={() => toast({ title: '✅ Connecté au professeur virtuel' })}
                onDisconnected={() => stopConversation()}
                onError={(error) => toast({
                  title: 'Erreur',
                  description: error.message,
                  variant: 'destructive'
                })}
                onTimeLimit={() => {
                  console.log('⏱️ [TIME LIMIT] Limite de temps atteinte - Affichage du dialog');
                  // Afficher le dialog après un court délai (pour que la déconnexion soit bien visible)
                  setTimeout(() => {
                    setShowTimeUpDialog(true);
                  }, 500);
                }}
              />
            </div>
          )}
            </TabsContent>

            {/* TAB: Historique */}
            <TabsContent value="history" className="mt-6">
              {user && <ConversationHistoryList userId={user.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialog de limite de temps atteinte */}
      <TimeUpDialog
        open={showTimeUpDialog}
        onClose={() => setShowTimeUpDialog(false)}
      />

      <BottomNav />
    </>
  );
}
