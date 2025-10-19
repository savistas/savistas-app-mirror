import { useCallback, useState, useEffect, useRef } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, Phone, BookOpen, FileText, AlertCircle, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { analyzeLearningStyles } from '@/services/learningStylesAnalyzer';
import { generateAgentConfig, ConversationType, PromptContext } from '@/services/systemPromptGenerator';
import BurgerMenu from '@/components/BurgerMenu';
import BottomNav from '@/components/BottomNav';

/**
 * Configuration ElevenLabs - Agent de base
 */
const ELEVENLABS_AGENT_ID = 'agent_5901k7s57ptne94thf6jaf9ngqas';
const ELEVENLABS_API_KEY = 'sk_634179baf28c2e9e6b47f016522d147f7d4aaebcee2000e8';

/**
 * Interfaces
 */
interface Course {
  id: string;
  title: string;
  course_content: string;
  professor_role?: string;
}

interface Exercise {
  id: string;
  exercice_title: string;
  metadata: any;
}

interface ErrorResponse {
  id: string;
  matiere: string;
  categorie: string;
  message: string;
  justification?: string;
  created_at: string;
}

interface ConversationHistory {
  id: string;
  conversation_type: ConversationType;
  context_data: any;
  agent_config: any;
  status: string;
  created_at: string;
  updated_at: string;
  message_count?: number;
}

/**
 * Page du Professeur Virtuel - Version simplifiée avec agent de base
 */
export default function VirtualTeacher() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);
  const conversationIdRef = useRef<string | null>(null);

  // États pour le sélecteur de contexte
  const [conversationType, setConversationType] = useState<ConversationType>('general');

  // Cours
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [isLoadingCourses, setIsLoadingCourses] = useState<boolean>(false);

  // Exercices
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
  const [isLoadingExercises, setIsLoadingExercises] = useState<boolean>(false);

  // Erreurs
  const [errors, setErrors] = useState<ErrorResponse[]>([]);
  const [selectedErrorId, setSelectedErrorId] = useState<string>('');
  const [isLoadingErrors, setIsLoadingErrors] = useState<boolean>(false);

  // Instructions supplémentaires
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  // Historique des conversations
  const [conversationHistory, setConversationHistory] = useState<ConversationHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  /**
   * Charger les cours de l'utilisateur
   */
  useEffect(() => {
    const loadCourses = async () => {
      if (!user || (conversationType !== 'course' && conversationType !== 'exercise')) return;

      setIsLoadingCourses(true);
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, course_content, professor_role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Erreur chargement cours:', error);
        } else {
          setCourses(data || []);
          console.log('✅ Cours chargés:', data?.length);
        }
      } catch (error) {
        console.error('❌ Erreur chargement cours:', error);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, [user, conversationType]);

  /**
   * Charger les exercices d'un cours
   */
  useEffect(() => {
    const loadExercises = async () => {
      if (!user || conversationType !== 'exercise' || !selectedCourseId) return;

      setIsLoadingExercises(true);
      setSelectedExerciseId(''); // Reset selection
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('id, exercice_title, metadata')
          .eq('course_id', selectedCourseId)
          .order('order_index', { ascending: true });

        if (error) {
          console.error('❌ Erreur chargement exercices:', error);
        } else {
          setExercises(data || []);
          console.log('✅ Exercices chargés:', data?.length);
        }
      } catch (error) {
        console.error('❌ Erreur chargement exercices:', error);
      } finally {
        setIsLoadingExercises(false);
      }
    };

    loadExercises();
  }, [user, conversationType, selectedCourseId]);

  /**
   * Charger les erreurs de l'utilisateur
   */
  useEffect(() => {
    const loadErrors = async () => {
      if (!user || conversationType !== 'error') return;

      setIsLoadingErrors(true);
      try {
        const { data, error } = await supabase
          .from('error_responses')
          .select('id, matiere, categorie, message, justification, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50); // Limiter à 50 dernières erreurs

        if (error) {
          console.error('❌ Erreur chargement erreurs:', error);
        } else {
          setErrors(data || []);
          console.log('✅ Erreurs chargées:', data?.length);
        }
      } catch (error) {
        console.error('❌ Erreur chargement erreurs:', error);
      } finally {
        setIsLoadingErrors(false);
      }
    };

    loadErrors();
  }, [user, conversationType]);

  /**
   * Charger l'historique des conversations
   */
  const loadConversationHistory = useCallback(async () => {
    if (!user) return;

    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('ai_teacher_conversations')
        .select(`
          id,
          conversation_type,
          context_data,
          agent_config,
          status,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Erreur chargement historique:', error);
      } else {
        // Compter les messages pour chaque conversation
        const conversationsWithCount = await Promise.all(
          (data || []).map(async (conv) => {
            const { count } = await supabase
              .from('ai_teacher_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id);

            return {
              ...conv,
              message_count: count || 0,
            };
          })
        );

        setConversationHistory(conversationsWithCount);
        console.log('✅ Historique chargé:', conversationsWithCount.length, 'conversations');
      }
    } catch (error) {
      console.error('❌ Erreur chargement historique:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [user]);

  /**
   * Sauvegarder un message dans Supabase
   */
  const saveMessage = async (role: 'user' | 'assistant', content: string) => {
    if (!conversationIdRef.current || !user) {
      console.warn('⚠️ Message non sauvegardé - conversationId:', conversationIdRef.current, 'user:', user?.id);
      return;
    }

    try {
      const { error } = await supabase
        .from('ai_teacher_messages')
        .insert({
          conversation_id: conversationIdRef.current,
          role,
          content,
        });

      if (error) {
        console.error('❌ Erreur sauvegarde message:', error);
      } else {
        console.log('✅ Message sauvegardé:', role, content.substring(0, 50));
      }
    } catch (error) {
      console.error('❌ Erreur sauvegarde message:', error);
    }
  };

  // Hook ElevenLabs pour gérer la conversation
  const conversation = useConversation({
    onConnect: async () => {
      console.log('✅ [ELEVENLABS] Connecté à ElevenLabs');
      console.log('✅ [ELEVENLABS] Status:', conversation.status);
      toast({
        title: 'Connecté',
        description: 'Vous êtes connecté au professeur virtuel',
      });
    },
    onDisconnect: async () => {
      console.log('❌ [ELEVENLABS] Déconnecté de ElevenLabs');
      console.log('❌ [ELEVENLABS] Status:', conversation.status);

      // Marquer la conversation comme terminée
      if (conversationIdRef.current) {
        await supabase
          .from('ai_teacher_conversations')
          .update({ status: 'ended' })
          .eq('id', conversationIdRef.current);

        console.log('✅ Conversation marquée comme terminée:', conversationIdRef.current);
      }

      toast({
        title: 'Déconnecté',
        description: 'Conversation terminée et sauvegardée',
      });
    },
    onMessage: async (message) => {
      console.log('📨 [ELEVENLABS] Message reçu:', message);

      if (message.source === 'user') {
        setMessages(prev => [...prev, { role: 'user', content: message.message }]);
        await saveMessage('user', message.message);
      } else if (message.source === 'ai') {
        setMessages(prev => [...prev, { role: 'assistant', content: message.message }]);
        await saveMessage('assistant', message.message);
      }
    },
    onError: (error: any) => {
      console.error('❌ [ELEVENLABS] Erreur ElevenLabs:', error);
      console.error('❌ [ELEVENLABS] Type d\'erreur:', typeof error);
      console.error('❌ [ELEVENLABS] Erreur détaillée:', JSON.stringify(error, null, 2));

      const errorMessage = typeof error === 'string' ? error :
                          error?.message ||
                          'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  /**
   * Construire le contexte de la conversation basé sur la sélection
   */
  const buildPromptContext = async (): Promise<PromptContext | null> => {
    const context: PromptContext = {
      conversationType,
      additionalInstructions: additionalInstructions.trim() || undefined,
    };

    if (conversationType === 'course') {
      if (!selectedCourseId) {
        toast({
          title: 'Sélection requise',
          description: 'Veuillez sélectionner un cours',
          variant: 'destructive',
        });
        return null;
      }

      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      if (!selectedCourse) return null;

      context.courseName = selectedCourse.title;
      context.courseContent = selectedCourse.course_content;
      context.professorRole = selectedCourse.professor_role;
    }

    if (conversationType === 'exercise') {
      if (!selectedCourseId || !selectedExerciseId) {
        toast({
          title: 'Sélection requise',
          description: 'Veuillez sélectionner un cours et un exercice',
          variant: 'destructive',
        });
        return null;
      }

      const selectedCourse = courses.find(c => c.id === selectedCourseId);
      const selectedExercise = exercises.find(e => e.id === selectedExerciseId);

      if (!selectedCourse || !selectedExercise) return null;

      context.courseName = selectedCourse.title;
      context.exerciseTitle = selectedExercise.exercice_title;

      // Extraire le contenu de l'exercice depuis metadata
      if (selectedExercise.metadata) {
        const metadata = selectedExercise.metadata;
        let exerciseContent = '';

        // Si c'est un QCM
        if (metadata.questions && Array.isArray(metadata.questions)) {
          exerciseContent = `Type: QCM (${metadata.questions.length} questions)\n\n`;
          metadata.questions.forEach((q: any, i: number) => {
            exerciseContent += `Question ${i + 1}: ${q.question}\n`;
            if (q.options) {
              q.options.forEach((opt: string, j: number) => {
                exerciseContent += `  ${String.fromCharCode(65 + j)}) ${opt}\n`;
              });
            }
            exerciseContent += '\n';
          });
        } else {
          // Autres types d'exercices
          exerciseContent = JSON.stringify(metadata, null, 2);
        }

        context.exerciseContent = exerciseContent;
      }
    }

    if (conversationType === 'error') {
      if (!selectedErrorId) {
        toast({
          title: 'Sélection requise',
          description: 'Veuillez sélectionner une erreur',
          variant: 'destructive',
        });
        return null;
      }

      const selectedError = errors.find(e => e.id === selectedErrorId);
      if (!selectedError) return null;

      context.errorDescription = selectedError.message;
      context.errorCategory = selectedError.categorie;
      context.errorContext = selectedError.justification || undefined;
    }

    return context;
  };

  /**
   * Récupérer une signed URL depuis l'API ElevenLabs
   */
  const getSignedUrl = async (): Promise<string> => {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${ELEVENLABS_AGENT_ID}`,
      {
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Impossible de récupérer la signed URL');
    }

    const data = await response.json();
    return data.signed_url;
  };

  /**
   * Démarrer la conversation avec system prompt personnalisé
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

      // 1. Construire le contexte
      const promptContext = await buildPromptContext();
      if (!promptContext) return;

      toast({
        title: 'Préparation...',
        description: 'Personnalisation de votre professeur virtuel',
      });

      // 2. Récupérer les styles d'apprentissage de l'utilisateur
      const { data: stylesData, error: stylesError } = await supabase
        .from('styles_apprentissage')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (stylesError) {
        console.warn('⚠️ Pas de styles d\'apprentissage trouvés, utilisation prompt par défaut');
      }

      // 3. Analyser les styles d'apprentissage (ou utiliser valeurs par défaut)
      const learningStyles = stylesData
        ? analyzeLearningStyles(stylesData)
        : { top3: [], formatted: '' };

      console.log('📊 Styles d\'apprentissage analysés:', learningStyles.top3.map(s => s?.name));

      // 4. Générer la configuration de l'agent (VERSION COMPACTE)
      const agentConfig = generateAgentConfig(learningStyles.top3, promptContext);
      console.log('🤖 Configuration agent générée');
      console.log('📝 System prompt (premier 200 chars):', agentConfig.systemPrompt.substring(0, 200) + '...');
      console.log('📏 Longueur totale du prompt:', agentConfig.systemPrompt.length, 'caractères');

      // 5. Demander permission micro
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // 6. Créer la conversation dans Supabase
      const { data: newConversation, error: conversationError } = await supabase
        .from('ai_teacher_conversations')
        .insert({
          user_id: user.id,
          conversation_type: promptContext.conversationType,
          context_id: promptContext.conversationType === 'course' ? selectedCourseId :
                     promptContext.conversationType === 'exercise' ? selectedExerciseId :
                     promptContext.conversationType === 'error' ? selectedErrorId : null,
          context_data: {
            courseName: promptContext.courseName,
            exerciseTitle: promptContext.exerciseTitle,
            errorCategory: promptContext.errorCategory,
            additionalInstructions: promptContext.additionalInstructions,
          },
          agent_config: {
            agent_id: ELEVENLABS_AGENT_ID,
            learning_styles: learningStyles.top3.map(s => s?.name),
            system_prompt: agentConfig.systemPrompt,
            first_message: agentConfig.firstMessage,
          },
          status: 'active',
        })
        .select()
        .single();

      if (conversationError || !newConversation) {
        throw new Error('Erreur création conversation');
      }

      conversationIdRef.current = newConversation.id;
      console.log('💾 Conversation créée dans Supabase:', newConversation.id);

      // 7. Récupérer la signed URL de l'agent de base
      toast({
        title: 'Connexion...',
        description: 'Connexion au professeur virtuel en cours',
      });

      const signedUrl = await getSignedUrl();

      // 8. Démarrer la session ElevenLabs avec overrides
      console.log('🔧 [DEBUG] Préparation des overrides...');
      console.log('🔧 [DEBUG] System prompt length:', agentConfig.systemPrompt.length);
      console.log('🔧 [DEBUG] First message:', agentConfig.firstMessage);

      // Vérifier si le prompt est trop long (limite ElevenLabs ~5000 chars)
      if (agentConfig.systemPrompt.length > 5000) {
        console.error('❌ [DEBUG] System prompt TROP LONG pour API:', agentConfig.systemPrompt.length);
        throw new Error(`System prompt trop long (${agentConfig.systemPrompt.length} caractères). Limite: 5000.`);
      }

      console.log('✅ [DEBUG] Longueur prompt acceptable:', agentConfig.systemPrompt.length, '/ 5000');

      // Note: Les overrides ne fonctionnent PAS avec signed URL dans cette version de l'API
      // Le system prompt doit être configuré directement sur l'agent ElevenLabs
      console.log('🎙️ [DEBUG] Démarrage de la session (sans overrides - limitation API)...');

      await conversation.startSession({
        signedUrl,
      });

      console.log('✅ [DEBUG] Conversation démarrée');
      console.log('⚠️ [INFO] Le system prompt personnalisé est sauvegardé en DB mais non utilisé par l\'agent');
      console.log('💡 [INFO] Pour personnalisation: créer des agents dynamiques ou utiliser Dynamic Variables');

      toast({
        title: 'Prêt !',
        description: 'Vous pouvez commencer à parler avec votre professeur',
      });

    } catch (error) {
      console.error('Erreur démarrage conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      toast({
        title: 'Erreur',
        description: `Impossible de démarrer la conversation: ${errorMessage}`,
        variant: 'destructive',
      });
    }
  }, [conversation, toast, user, conversationType, selectedCourseId, selectedExerciseId, selectedErrorId, courses, exercises, errors, additionalInstructions]);

  /**
   * Arrêter la conversation
   */
  const stopConversation = useCallback(async () => {
    await conversation.endSession();
    console.log('⏹️ Conversation arrêtée');
  }, [conversation]);

  // Status de la conversation
  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status === 'connecting';

  /**
   * Fonction pour obtenir le label du type de conversation
   */
  const getConversationTypeLabel = (type: ConversationType): string => {
    switch (type) {
      case 'general': return 'Conversation générale';
      case 'course': return 'Étude de cours';
      case 'exercise': return 'Exercice';
      case 'error': return 'Analyse d\'erreur';
      default: return type;
    }
  };

  /**
   * Fonction pour obtenir les styles visuels par type de conversation
   */
  const getConversationTypeStyles = (type: ConversationType) => {
    switch (type) {
      case 'general':
        return {
          icon: Mic,
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          borderColor: 'border-purple-200 dark:border-purple-800',
          badgeBaseColor: 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
          badgeHoverColor: 'hover:bg-purple-700 hover:text-white dark:hover:bg-purple-600 hover:border-purple-700 dark:hover:border-purple-600',
          iconBadgeColor: 'bg-purple-100 dark:bg-purple-900/30',
          iconColor: 'text-purple-600 dark:text-purple-400',
          hoverBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
        };
      case 'course':
        return {
          icon: BookOpen,
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          badgeBaseColor: 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
          badgeHoverColor: 'hover:bg-blue-700 hover:text-white dark:hover:bg-blue-600 hover:border-blue-700 dark:hover:border-blue-600',
          iconBadgeColor: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
        };
      case 'exercise':
        return {
          icon: FileText,
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          badgeBaseColor: 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
          badgeHoverColor: 'hover:bg-emerald-700 hover:text-white dark:hover:bg-emerald-600 hover:border-emerald-700 dark:hover:border-emerald-600',
          iconBadgeColor: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
        };
      case 'error':
        return {
          icon: AlertCircle,
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          badgeBaseColor: 'bg-white dark:bg-slate-900 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800',
          badgeHoverColor: 'hover:bg-orange-700 hover:text-white dark:hover:bg-orange-600 hover:border-orange-700 dark:hover:border-orange-600',
          iconBadgeColor: 'bg-orange-100 dark:bg-orange-900/30',
          iconColor: 'text-orange-600 dark:text-orange-400',
          hoverBorder: 'hover:border-orange-300 dark:hover:border-orange-700',
        };
      default:
        return {
          icon: Mic,
          bgColor: 'bg-gray-50 dark:bg-gray-950/20',
          borderColor: 'border-gray-200 dark:border-gray-800',
          badgeBaseColor: 'bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-400 border border-gray-200 dark:border-gray-800',
          badgeHoverColor: 'hover:bg-gray-700 hover:text-white dark:hover:bg-gray-600 hover:border-gray-700',
          iconBadgeColor: 'bg-gray-100 dark:bg-gray-900/30',
          iconColor: 'text-gray-600',
          hoverBorder: 'hover:border-gray-300',
        };
    }
  };

  return (
    <>
      {/* Fixed Header avec logo et BurgerMenu */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between px-4 md:px-6 h-16 md:h-[4.5rem]">
          {/* Logo et titre */}
          <div className="flex items-center space-x-2 md:space-x-4">
            <img
              src="/logo-savistas.png"
              alt="Savistas Logo"
              className="h-10 md:h-12 w-auto"
            />
            <div className="hidden md:block">
              <h1 className="text-lg font-bold text-slate-900">Professeur Particulier</h1>
            </div>
          </div>

          {/* Burger Menu */}
          <BurgerMenu />
        </div>
      </header>

      {/* Main Content avec padding pour le header fixe */}
      <div className="container mx-auto px-4 pt-20 md:pt-24 pb-24 max-w-6xl">
        {/* Tabs pour Conversation / Historique */}
        <Tabs defaultValue="conversation" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="conversation" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="historique" className="flex items-center gap-2" onClick={loadConversationHistory}>
              <History className="h-4 w-4" />
              Historique
            </TabsTrigger>
          </TabsList>

          {/* Tab: Conversation */}
          <TabsContent value="conversation" className="space-y-6">
            {/* Carte principale */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sélecteur de contexte */}
              <Card>
          <CardHeader>
            <CardTitle>Contexte de conversation</CardTitle>
            <CardDescription>
              Choisissez le type et le contexte de votre conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type de conversation */}
            <div className="space-y-2">
              <Label htmlFor="conversation-type">Type de conversation</Label>
              <Select
                value={conversationType}
                onValueChange={(value) => {
                  setConversationType(value as ConversationType);
                  setSelectedCourseId('');
                  setSelectedExerciseId('');
                  setSelectedErrorId('');
                }}
                disabled={isConnected}
              >
                <SelectTrigger id="conversation-type">
                  <SelectValue placeholder="Sélectionnez un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4" />
                      <span>Conversation générale</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="course">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Étude d'un cours</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="exercise">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Résolution d'exercice / QCM</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="error">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Analyse d'erreur</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sélecteur de cours (pour course) */}
            {conversationType === 'course' && (
              <div className="space-y-2">
                <Label htmlFor="course-select">Cours</Label>
                {isLoadingCourses ? (
                  <p className="text-sm text-muted-foreground">Chargement des cours...</p>
                ) : courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun cours disponible. Créez un cours d'abord.
                  </p>
                ) : (
                  <Select
                    value={selectedCourseId}
                    onValueChange={setSelectedCourseId}
                    disabled={isConnected}
                  >
                    <SelectTrigger id="course-select">
                      <SelectValue placeholder="Sélectionnez un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Sélecteur cours + exercice (pour exercise) */}
            {conversationType === 'exercise' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="exercise-course-select">Cours</Label>
                  {isLoadingCourses ? (
                    <p className="text-sm text-muted-foreground">Chargement des cours...</p>
                  ) : courses.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun cours disponible.
                    </p>
                  ) : (
                    <Select
                      value={selectedCourseId}
                      onValueChange={(value) => {
                        setSelectedCourseId(value);
                        setSelectedExerciseId(''); // Reset exercise selection
                      }}
                      disabled={isConnected}
                    >
                      <SelectTrigger id="exercise-course-select">
                        <SelectValue placeholder="Sélectionnez un cours" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                {selectedCourseId && (
                  <div className="space-y-2">
                    <Label htmlFor="exercise-select">Exercice / QCM</Label>
                    {isLoadingExercises ? (
                      <p className="text-sm text-muted-foreground">Chargement des exercices...</p>
                    ) : exercises.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Aucun exercice disponible pour ce cours.
                      </p>
                    ) : (
                      <Select
                        value={selectedExerciseId}
                        onValueChange={setSelectedExerciseId}
                        disabled={isConnected}
                      >
                        <SelectTrigger id="exercise-select">
                          <SelectValue placeholder="Sélectionnez un exercice" />
                        </SelectTrigger>
                        <SelectContent>
                          {exercises.map((exercise) => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.exercice_title || 'Sans titre'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Sélecteur erreur (pour error) */}
            {conversationType === 'error' && (
              <div className="space-y-2">
                <Label htmlFor="error-select">Erreur à analyser</Label>
                {isLoadingErrors ? (
                  <p className="text-sm text-muted-foreground">Chargement des erreurs...</p>
                ) : errors.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucune erreur enregistrée dans votre cahier d'erreurs.
                  </p>
                ) : (
                  <Select
                    value={selectedErrorId}
                    onValueChange={setSelectedErrorId}
                    disabled={isConnected}
                  >
                    <SelectTrigger id="error-select">
                      <SelectValue placeholder="Sélectionnez une erreur" />
                    </SelectTrigger>
                    <SelectContent>
                      {errors.map((error) => (
                        <SelectItem key={error.id} value={error.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{error.categorie}</span>
                            <span className="text-xs text-muted-foreground">
                              {error.matiere} - {new Date(error.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}

            {/* Instructions supplémentaires */}
            <div className="space-y-2">
              <Label htmlFor="additional-instructions">
                Instructions supplémentaires (optionnel)
              </Label>
              <Textarea
                id="additional-instructions"
                className="min-h-[80px]"
                placeholder="Ajoutez des instructions personnalisées pour guider le professeur... Par exemple: 'Explique-moi comme si j'avais 10 ans' ou 'Focus sur les exemples pratiques'"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                disabled={isConnected}
              />
            </div>
          </CardContent>
        </Card>

        {/* Contrôles */}
        <Card>
          <CardHeader>
            <CardTitle>Contrôles</CardTitle>
            <CardDescription>
              Démarrez une conversation vocale avec votre professeur virtuel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              {isConnected && (
                <Badge variant="default" className="bg-green-500">
                  Connecté
                </Badge>
              )}
              {isConnecting && (
                <Badge variant="secondary">
                  Connexion...
                </Badge>
              )}
              {!isConnected && !isConnecting && (
                <Badge variant="outline">
                  Déconnecté
                </Badge>
              )}
            </div>

            {/* État de l'agent */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Agent:</span>
              {conversation.isSpeaking && (
                <Badge variant="default" className="bg-blue-500">
                  Parle
                </Badge>
              )}
              {!conversation.isSpeaking && isConnected && (
                <Badge variant="secondary">
                  Écoute
                </Badge>
              )}
            </div>

            {/* Boutons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button
                onClick={startConversation}
                disabled={isConnected || isConnecting}
                size="lg"
                className="w-full"
              >
                <Mic className="h-5 w-5 mr-2" />
                Démarrer la conversation
              </Button>

              <Button
                onClick={stopConversation}
                disabled={!isConnected}
                variant="destructive"
                size="lg"
                className="w-full"
              >
                <Phone className="h-5 w-5 mr-2" />
                Terminer
              </Button>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">Instructions</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Choisis le type de conversation à gauche</li>
                <li>Sélectionne le contexte (cours, exercice, erreur)</li>
                <li>Ajoute des instructions supplémentaires si besoin</li>
                <li>Clique sur "Démarrer la conversation"</li>
                <li>Autorise l'accès au microphone</li>
                <li>Parle naturellement avec le professeur</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historique des messages */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transcription</CardTitle>
          <CardDescription>
            Historique de la conversation en temps réel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-[500px] overflow-y-auto">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aucun message pour le moment.<br />
                Démarre une conversation pour voir les transcriptions.
              </p>
            )}

            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-xs font-medium mb-1 opacity-70">
                    {msg.role === 'user' ? 'Vous' : 'Professeur'}
                  </p>
                  <p className="text-sm">{msg.content}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card className="mt-6 border-orange-500">
        <CardHeader>
          <CardTitle className="text-orange-500">⚠️ Mode de fonctionnement actuel</CardTitle>
          <CardDescription>
            État de la personnalisation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <strong>Limitation technique identifiée :</strong> L'API ElevenLabs ne supporte pas les overrides de system prompt avec signed URL.
          </p>

          <p className="text-sm text-muted-foreground mt-3">
            <strong>Ce qui fonctionne actuellement :</strong>
          </p>
          <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
            <li>Conversation vocale avec l'agent de base</li>
            <li>Transcription en temps réel</li>
            <li>Sauvegarde des conversations dans la base de données</li>
            <li>Génération et sauvegarde du system prompt personnalisé (pour référence)</li>
          </ul>

          <p className="text-sm text-muted-foreground mt-3">
            <strong>Solutions possibles pour la personnalisation :</strong>
          </p>
          <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside">
            <li><strong>Option 1 :</strong> Créer des agents ElevenLabs dynamiques (1 par conversation)</li>
            <li><strong>Option 2 :</strong> Créer 1 agent par utilisateur et le réutiliser</li>
            <li><strong>Option 3 :</strong> Utiliser Dynamic Variables au lieu d'overrides</li>
            <li><strong>Option 4 :</strong> Appeler l'API ElevenLabs directement (sans SDK)</li>
          </ul>

          <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-3 p-2 bg-yellow-50 dark:bg-yellow-950 rounded">
            💡 <strong>Recommandation :</strong> Créer 1 agent par utilisateur avec son profil d'apprentissage, et le mettre à jour quand nécessaire.
          </p>
        </CardContent>
      </Card>
          </TabsContent>

          {/* Tab: Historique */}
          <TabsContent value="historique" className="space-y-6">
            {isLoadingHistory ? (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
                    <p className="text-muted-foreground">Chargement de l'historique...</p>
                  </div>
                </CardContent>
              </Card>
            ) : conversationHistory.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <History className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-lg">Aucune conversation enregistrée</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Démarrez une conversation dans l'onglet "Conversation" pour commencer.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="single" collapsible className="space-y-4">
                {conversationHistory.map((conv) => {
                  const styles = getConversationTypeStyles(conv.conversation_type);
                  const IconComponent = styles.icon;

                  return (
                    <AccordionItem
                      key={conv.id}
                      value={conv.id}
                      className={`border-2 rounded-lg overflow-hidden transition-all ${styles.borderColor} ${styles.hoverBorder} ${styles.bgColor}`}
                    >
                      <AccordionTrigger className="px-6 py-4 hover:no-underline">
                        <div className="flex items-start gap-4 w-full text-left">
                          {/* Icône du type */}
                          <div className={`mt-1 p-2 rounded-lg ${styles.iconBadgeColor}`}>
                            <IconComponent className={`h-5 w-5 ${styles.iconColor}`} />
                          </div>

                          {/* Contenu principal */}
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* En-tête */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`transition-all duration-200 ${styles.badgeBaseColor} ${styles.badgeHoverColor}`}>
                                {getConversationTypeLabel(conv.conversation_type)}
                              </Badge>
                              {conv.status === 'active' && (
                                <Badge variant="outline" className="bg-white dark:bg-slate-900 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-700 hover:bg-green-700 dark:hover:bg-green-600 hover:text-white hover:border-green-700 transition-all duration-200">
                                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5"></div>
                                  En cours
                                </Badge>
                              )}
                            </div>

                            {/* Détails du contexte */}
                            <div className="space-y-1">
                              {conv.context_data?.courseName && (
                                <p className="text-sm font-medium text-foreground">
                                  {conv.context_data.courseName}
                                </p>
                              )}
                              {conv.context_data?.exerciseTitle && (
                                <p className="text-sm font-medium text-foreground">
                                  {conv.context_data.exerciseTitle}
                                </p>
                              )}
                              {conv.context_data?.errorCategory && (
                                <p className="text-sm font-medium text-foreground">
                                  Erreur: {conv.context_data.errorCategory}
                                </p>
                              )}
                              {conv.context_data?.additionalInstructions && (
                                <p className="text-xs text-muted-foreground italic line-clamp-1">
                                  "{conv.context_data.additionalInstructions}"
                                </p>
                              )}
                            </div>

                            {/* Footer */}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {conv.message_count || 0} message{(conv.message_count || 0) > 1 ? 's' : ''}
                              </span>
                              <span>•</span>
                              <span>
                                {new Date(conv.created_at).toLocaleDateString('fr-FR', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent className="px-6 pb-4 pt-0">
                        <div className="border-t pt-4 mt-2 bg-white dark:bg-slate-950 rounded-lg p-4">
                          <ConversationMessages conversationId={conv.id} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </>
  );
}

/**
 * Composant pour afficher les messages d'une conversation
 */
function ConversationMessages({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string; created_at: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('ai_teacher_messages')
          .select('role, content, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('❌ Erreur chargement messages:', error);
        } else {
          setMessages(data || []);
        }
      } catch (error) {
        console.error('❌ Erreur chargement messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [conversationId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-3 border-solid border-primary border-r-transparent"></div>
          <p className="text-sm text-muted-foreground">Chargement des messages...</p>
        </div>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center text-muted-foreground">
          <Mic className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Aucun message dans cette conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`${msg.role === 'assistant' ? 'w-full' : 'max-w-[95%] md:max-w-[75%]'}`}>
            {/* Header avec logo Savistas pour les messages AI */}
            {msg.role === 'assistant' && (
              <div className="flex items-center space-x-2 mb-1">
                <img
                  src="/logo-savistas.png"
                  alt="Savistas Logo"
                  className="w-5 h-5 object-contain"
                />
                <span className="text-xs text-muted-foreground">AI Assistant</span>
              </div>
            )}

            {/* Bulle de message */}
            <div
              className={`p-3 rounded-lg ${
                msg.role === 'assistant'
                  ? 'bg-muted text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {msg.content}
              </p>
              <p className={`text-xs mt-2 ${
                msg.role === 'user'
                  ? 'text-primary-foreground/70'
                  : 'text-muted-foreground'
              }`}>
                {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
