import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onCreateSheet: () => void;
}

export function EmptyState({ onCreateSheet }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-purple-100 p-6 mb-4">
        <FileText className="h-12 w-12 text-purple-600" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Aucune fiche de révision</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Créez votre première fiche de révision à partir de vos cours pour réviser efficacement avec l'IA
      </p>
      <Button onClick={onCreateSheet}>
        <Plus className="mr-2 h-4 w-4" />
        Créer ma première fiche
      </Button>
    </div>
  );
}
