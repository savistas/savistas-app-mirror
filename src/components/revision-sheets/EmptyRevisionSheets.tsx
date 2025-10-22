import { BookMarked } from 'lucide-react';

export const EmptyRevisionSheets = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="mb-4 p-6 bg-purple-50 rounded-full">
        <BookMarked className="w-16 h-16 text-purple-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-center">
        Aucune fiche de révision pour l'instant
      </h3>
      <p className="text-muted-foreground text-center max-w-md">
        Générez des fiches de révision depuis vos cours en complétant tous les exercices. Elles apparaîtront ici pour faciliter vos révisions.
      </p>
    </div>
  );
};
