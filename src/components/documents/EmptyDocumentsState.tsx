import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyDocumentsStateProps {
  onAdd: () => void;
}

export function EmptyDocumentsState({ onAdd }: EmptyDocumentsStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-gray-400" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Aucun document pour le moment
      </h3>

      <p className="text-gray-500 text-center mb-6 max-w-md">
        Commencez par ajouter votre premier document pour accéder aux outils de révision
      </p>

      <Button onClick={onAdd} size="lg">
        Ajouter votre premier document
      </Button>
    </div>
  );
}
