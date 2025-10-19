import { MessageCircle, BookOpen, AlertCircle, Pencil } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ConversationType } from '@/services/agentConfigService';

export interface ConversationMode {
  type: ConversationType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

export interface ConversationModeSelectorProps {
  onSelectMode: (mode: ConversationType) => void;
  disabled?: boolean;
  className?: string;
}

const MODES: ConversationMode[] = [
  {
    type: 'general',
    title: 'Conversation libre',
    description: 'Discutez librement avec votre professeur sur n\'importe quel sujet',
    icon: <MessageCircle className="h-6 w-6" />,
    color: 'text-blue-500',
  },
  {
    type: 'course',
    title: 'Aide sur un cours',
    description: 'Obtenez de l\'aide sur un cours spécifique',
    icon: <BookOpen className="h-6 w-6" />,
    color: 'text-green-500',
  },
  {
    type: 'quiz',
    title: 'Comprendre mes erreurs',
    description: 'Explications sur vos erreurs de quiz',
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'text-orange-500',
  },
  {
    type: 'exercise',
    title: 'Aide sur un exercice',
    description: 'Guidage pas à pas pour résoudre un exercice',
    icon: <Pencil className="h-6 w-6" />,
    color: 'text-purple-500',
  },
];

/**
 * Sélecteur de mode de conversation
 */
export function ConversationModeSelector({
  onSelectMode,
  disabled = false,
  className = '',
}: ConversationModeSelectorProps) {
  return (
    <div className={className}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Professeur Virtuel</h2>
        <p className="text-muted-foreground">
          Choisissez comment vous souhaitez interagir avec votre professeur IA
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MODES.map((mode) => (
          <ModeCard
            key={mode.type}
            mode={mode}
            onSelect={() => onSelectMode(mode.type)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Carte de mode individuelle
 */
function ModeCard({
  mode,
  onSelect,
  disabled,
}: {
  mode: ConversationMode;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <Card
      className="hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={disabled ? undefined : onSelect}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className={`${mode.color} group-hover:scale-110 transition-transform`}>
            {mode.icon}
          </div>
        </div>
        <CardTitle className="text-lg">{mode.title}</CardTitle>
        <CardDescription>{mode.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          variant="outline"
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          Commencer
        </Button>
      </CardContent>
    </Card>
  );
}
