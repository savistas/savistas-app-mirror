import { MessageCircle, BookOpen, PenTool, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { ConversationType } from './types';

interface ConversationTypeSelectorProps {
  value: ConversationType;
  onChange: (type: ConversationType) => void;
  disabled?: boolean;
}

const CONVERSATION_TYPES = [
  {
    value: 'general' as const,
    label: 'Conversation générale',
    icon: MessageCircle
  },
  {
    value: 'course' as const,
    label: 'Étude d\'un cours',
    icon: BookOpen
  },
  {
    value: 'exercise' as const,
    label: 'Résolution d\'exercice',
    icon: PenTool
  },
  {
    value: 'error' as const,
    label: 'Analyse d\'erreur',
    icon: AlertCircle
  },
];

export function ConversationTypeSelector({ value, onChange, disabled }: ConversationTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="conversation-type" className="text-sm font-medium">
        Type de conversation
      </Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="conversation-type" className="w-full">
          <SelectValue placeholder="Sélectionnez un type" />
        </SelectTrigger>
        <SelectContent>
          {CONVERSATION_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
