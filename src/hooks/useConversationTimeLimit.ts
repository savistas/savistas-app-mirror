import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const FREE_PLAN_TIME_LIMIT_SECONDS = 180; // 3 minutes pour le plan "basic"

interface ConversationTimeLimitResult {
  timeRemainingSeconds: number;
  totalTimeUsedSeconds: number;
  isLimitReached: boolean;
  subscription: string | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook pour calculer le temps de conversation restant pour les utilisateurs gratuits
 *
 * - Plan "basic" : 3 minutes maximum cumulées
 * - Plans "premium" et "pro" : illimité
 *
 * @param userId - ID de l'utilisateur
 * @returns Temps restant, temps utilisé, limite atteinte, plan, etc.
 */
export function useConversationTimeLimit(userId: string | undefined): ConversationTimeLimitResult {
  const { data, isLoading, error } = useQuery({
    queryKey: ['conversation-time-limit', userId],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // 1. Récupérer le plan de l'utilisateur
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('subscription')
        .eq('user_id', userId)
        .single();

      if (profileError) throw profileError;

      const subscription = profileData?.subscription || 'basic';

      // Si l'utilisateur n'est pas en plan gratuit, pas de limite
      if (subscription !== 'basic') {
        return {
          subscription,
          totalTimeUsedSeconds: 0,
          timeRemainingSeconds: Infinity,
          isLimitReached: false
        };
      }

      // 2. Récupérer toutes les conversations de l'utilisateur
      // IMPORTANT: On compte TOUTES les conversations, même celles supprimées (soft delete)
      // car le temps a bien été consommé même si l'utilisateur a supprimé la conversation de son historique
      const { data: conversations, error: conversationsError } = await supabase
        .from('ai_teacher_conversations')
        .select('created_at, updated_at')
        .eq('user_id', userId);
        // PAS de filtre .is('deleted_at', null) ici !

      if (conversationsError) throw conversationsError;

      // 3. Calculer le temps total utilisé (somme de updated_at - created_at)
      const totalTimeUsedSeconds = (conversations || []).reduce((total, conversation) => {
        const createdAt = new Date(conversation.created_at).getTime();
        const updatedAt = new Date(conversation.updated_at).getTime();
        const durationMs = updatedAt - createdAt;
        const durationSeconds = Math.floor(durationMs / 1000);
        return total + durationSeconds;
      }, 0);

      // 4. Calculer le temps restant
      const timeRemainingSeconds = Math.max(0, FREE_PLAN_TIME_LIMIT_SECONDS - totalTimeUsedSeconds);
      const isLimitReached = timeRemainingSeconds <= 0;

      return {
        subscription,
        totalTimeUsedSeconds,
        timeRemainingSeconds,
        isLimitReached
      };
    },
    enabled: !!userId,
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes pendant une conversation
  });

  return {
    timeRemainingSeconds: data?.timeRemainingSeconds ?? 0,
    totalTimeUsedSeconds: data?.totalTimeUsedSeconds ?? 0,
    isLimitReached: data?.isLimitReached ?? false,
    subscription: data?.subscription ?? null,
    isLoading,
    error: error as Error | null
  };
}

/**
 * Formater un temps en secondes en format MM:SS
 * @param seconds - Temps en secondes
 * @returns Temps formaté (ex: "2:30")
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}
