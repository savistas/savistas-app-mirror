import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader } from '@/components/ui/card';
import { Loader2, MessageCircle, BookOpen, PenTool, AlertCircle, Trash2, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ConversationType } from './types';

interface ConversationHistoryListProps {
  userId: string;
}

interface ConversationRecord {
  id: string;
  conversation_type: ConversationType;
  context_id: string | null;
  context_data: {
    additionalInstructions?: string;
    conversationContext?: {
      courseName?: string;
      exerciseTitle?: string;
      errorCategory?: string;
    };
  };
  status: 'active' | 'ended';
  created_at: string;
  updated_at: string;
}

const CONVERSATION_TYPE_CONFIG = {
  general: {
    label: 'Conversation générale',
    icon: MessageCircle,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    bgColor: 'bg-blue-50/50',
    borderColor: 'border-blue-200'
  },
  course: {
    label: 'Étude de cours',
    icon: BookOpen,
    badgeColor: 'bg-green-100 text-green-800 border-green-200',
    bgColor: 'bg-green-50/50',
    borderColor: 'border-green-200'
  },
  exercise: {
    label: 'Résolution d\'exercice',
    icon: PenTool,
    badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
    bgColor: 'bg-orange-50/50',
    borderColor: 'border-orange-200'
  },
  error: {
    label: 'Analyse d\'erreur',
    icon: AlertCircle,
    badgeColor: 'bg-red-100 text-red-800 border-red-200',
    bgColor: 'bg-red-50/50',
    borderColor: 'border-red-200'
  }
};

export function ConversationHistoryList({ userId }: ConversationHistoryListProps) {
  const { data: conversations = [], isLoading, error, refetch } = useQuery({
    queryKey: ['conversation-history', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_teacher_conversations')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null) // Seulement les conversations non supprimées
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as ConversationRecord[];
    },
    enabled: !!userId,
  });

  const handleDelete = async (conversationId: string) => {
    try {
      // Soft delete : marquer comme supprimée au lieu de vraiment supprimer
      const { error } = await supabase
        .from('ai_teacher_conversations')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;
      refetch();
    } catch (err) {
      console.error('Erreur suppression conversation:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center">
        <p className="text-destructive">Erreur de chargement de l'historique</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="py-12 text-center">
        <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="text-muted-foreground text-lg mb-2">Aucune conversation</p>
        <p className="text-sm text-muted-foreground">
          Vos conversations passées apparaîtront ici
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message informatif */}
      <Alert className="border-blue-200 bg-blue-50/50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-900">
          <strong>Bientôt disponible :</strong> Consultez l'historique complet des messages de chaque conversation avec votre professeur virtuel.
        </AlertDescription>
      </Alert>

      {/* Liste des conversations */}
      <div className="space-y-3">
        {conversations.map((conversation) => {
          const typeConfig = CONVERSATION_TYPE_CONFIG[conversation.conversation_type];
          const Icon = typeConfig.icon;
          const contextData = conversation.context_data?.conversationContext;

          // Générer un titre descriptif
          let contextTitle = typeConfig.label;
          if (conversation.conversation_type === 'course' && contextData?.courseName) {
            contextTitle = contextData.courseName;
          } else if (conversation.conversation_type === 'exercise' && contextData?.exerciseTitle) {
            contextTitle = contextData.exerciseTitle;
          } else if (conversation.conversation_type === 'error' && contextData?.errorCategory) {
            contextTitle = contextData.errorCategory;
          }

          return (
            <Card
              key={conversation.id}
              className={`${typeConfig.bgColor} border ${typeConfig.borderColor} shadow-none`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className={typeConfig.badgeColor}>
                        <Icon className="h-3 w-3 mr-1" />
                        {typeConfig.label}
                      </Badge>
                      {conversation.status === 'active' && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          En cours
                        </Badge>
                      )}
                    </div>

                    <p className="font-medium text-base mb-1">{contextTitle}</p>

                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(conversation.created_at), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>

                    {conversation.context_data?.additionalInstructions && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {conversation.context_data.additionalInstructions}
                      </p>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(conversation.id)}
                    className="text-muted-foreground hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
