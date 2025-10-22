import { FolderOpen } from 'lucide-react';

export const EmptyDocuments = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 p-6 bg-gray-50 rounded-full">
        <FolderOpen className="w-16 h-16 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-center">
        Aucun document pour l'instant
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Uploadez des documents depuis vos cours pour les retrouver ici. Tous vos fichiers seront organisés par cours pour un accès facile.
      </p>
    </div>
  );
};
