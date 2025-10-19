import { useEffect, useRef } from 'react';
import { UserCircle, Bot } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/hooks/useVirtualTeacher';

export interface ConversationHistoryProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

/**
 * Affiche l'historique de conversation avec le professeur virtuel
 */
export function ConversationHistory({
  messages,
  isLoading = false,
  className = '',
}: ConversationHistoryProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Auto-scroll vers le bas quand nouveaux messages
   */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0 && !isLoading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center text-muted-foreground">
          <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">
            Aucun message pour le moment.
            <br />
            Commencez une conversation avec votre professeur virtuel !
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <ScrollArea className="h-[500px] p-4">
        <div ref={scrollRef} className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  <Bot className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-muted rounded-lg p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  );
}

/**
 * Bulle de message individuelle
 */
function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-8 w-8">
        <AvatarFallback className={isUser ? 'bg-secondary' : 'bg-primary text-primary-foreground'}>
          {isUser ? <UserCircle className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>

      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-lg p-3 ${
            isUser
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>

          {message.audio_url && (
            <audio
              controls
              src={message.audio_url}
              className="mt-2 w-full"
              preload="none"
            />
          )}
        </div>

        <p className={`text-xs text-muted-foreground mt-1 ${isUser ? 'text-right' : ''}`}>
          {new Date(message.created_at).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
