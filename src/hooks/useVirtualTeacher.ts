import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  agentConfigService,
  type ConversationType,
  type CourseContext,
  type QuizContext,
  type AgentConfiguration,
} from '@/services/agentConfigService';
import { useToast } from '@/hooks/use-toast';

export interface Conversation {
  id: string;
  conversation_type: ConversationType;
  context_id?: string;
  context_data?: any;
  agent_config: AgentConfiguration;
  status: 'active' | 'ended';
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  audio_url?: string;
  created_at: string;
}

/**
 * Hook principal pour gérer le professeur virtuel
 * Gère la création de conversations, les messages, et la coordination avec les autres hooks
 */
export function useVirtualTeacher() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);

  /**
   * Démarrer une nouvelle conversation
   */
  const startConversation = useCallback(
    async (
      conversationType: ConversationType,
      contextData?: CourseContext | QuizContext | null
    ) => {
      if (!user) {
        toast({
          title: 'Erreur',
          description: 'Vous devez être connecté',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // 1. Générer la configuration de l'agent
        const config = await agentConfigService.generateAgentConfig(
          user.id,
          conversationType,
          contextData
        );

        // 2. Vérifier s'il existe déjà un agent similaire
        const existingConfig = await agentConfigService.getExistingAgentConfig(
          user.id,
          config.learning_style,
          conversationType
        );

        let elevenLabsAgentId: string | null = null;

        if (existingConfig && existingConfig.elevenlabs_agent_id) {
          // Réutiliser l'agent existant
          elevenLabsAgentId = existingConfig.elevenlabs_agent_id;
          await agentConfigService.updateLastUsed(existingConfig.id);
        }

        // 3. Créer la conversation dans la base de données
        const { data: conversationData, error: convError } = await supabase
          .from('ai_teacher_conversations')
          .insert({
            user_id: user.id,
            conversation_type: conversationType,
            context_id: contextData?.course_id || contextData?.quiz_id || null,
            context_data: contextData,
            agent_config: config,
            status: 'active',
          })
          .select()
          .single();

        if (convError) throw convError;

        setConversation(conversationData);
        setMessages([]);
        setAgentId(elevenLabsAgentId);

        toast({
          title: 'Conversation démarrée',
          description: 'Votre professeur virtuel est prêt à vous aider',
        });

        return {
          conversation: conversationData,
          agentId: elevenLabsAgentId,
          config,
        };
      } catch (err) {
        console.error('Erreur démarrage conversation:', err);
        setError(err as Error);
        toast({
          title: 'Erreur',
          description: 'Impossible de démarrer la conversation',
          variant: 'destructive',
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [user, toast]
  );

  /**
   * Ajouter un message à la conversation
   */
  const addMessage = useCallback(
    async (role: 'user' | 'assistant', content: string, audioUrl?: string) => {
      if (!conversation) {
        console.error('Pas de conversation active');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('ai_teacher_messages')
          .insert({
            conversation_id: conversation.id,
            role,
            content,
            audio_url: audioUrl,
          })
          .select()
          .single();

        if (error) throw error;

        setMessages(prev => [...prev, data]);
        return data;
      } catch (err) {
        console.error('Erreur ajout message:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible d\'enregistrer le message',
          variant: 'destructive',
        });
        throw err;
      }
    },
    [conversation, toast]
  );

  /**
   * Charger l'historique des messages
   */
  const loadMessages = useCallback(
    async (conversationId: string) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('ai_teacher_messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });

        if (error) throw error;

        setMessages(data || []);
      } catch (err) {
        console.error('Erreur chargement messages:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Terminer la conversation
   */
  const endConversation = useCallback(async () => {
    if (!conversation) return;

    try {
      const { error } = await supabase
        .from('ai_teacher_conversations')
        .update({ status: 'ended', updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

      if (error) throw error;

      setConversation(prev => prev ? { ...prev, status: 'ended' } : null);

      toast({
        title: 'Conversation terminée',
        description: 'Vous pouvez en démarrer une nouvelle à tout moment',
      });
    } catch (err) {
      console.error('Erreur fin conversation:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de terminer la conversation',
        variant: 'destructive',
      });
    }
  }, [conversation, toast]);

  /**
   * Récupérer la liste des conversations passées
   */
  const loadConversationHistory = useCallback(async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('ai_teacher_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error('Erreur chargement historique:', err);
      return [];
    }
  }, [user]);

  /**
   * Reprendre une conversation existante
   */
  const resumeConversation = useCallback(
    async (conversationId: string) => {
      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('ai_teacher_conversations')
          .select('*')
          .eq('id', conversationId)
          .single();

        if (error) throw error;

        setConversation(data);
        await loadMessages(conversationId);

        // Récupérer l'agent_id s'il existe
        if (data.agent_config?.elevenlabs_agent_id) {
          setAgentId(data.agent_config.elevenlabs_agent_id);
        }
      } catch (err) {
        console.error('Erreur reprise conversation:', err);
        setError(err as Error);
        toast({
          title: 'Erreur',
          description: 'Impossible de reprendre cette conversation',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [loadMessages, toast]
  );

  /**
   * Nettoyer lors du démontage
   */
  useEffect(() => {
    return () => {
      // Cleanup si nécessaire
    };
  }, []);

  return {
    // État
    conversation,
    messages,
    isLoading,
    error,
    agentId,

    // Actions
    startConversation,
    addMessage,
    endConversation,
    loadMessages,
    loadConversationHistory,
    resumeConversation,
  };
}
