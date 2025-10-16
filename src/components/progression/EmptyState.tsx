/**
 * Empty state component for progression page
 * Shown when user has no quiz data yet
 */

import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
        <BookOpen className="w-12 h-12 text-purple-600" />
      </div>

      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
        Aucune donnée disponible
      </h3>

      <p className="text-gray-600 text-center max-w-md mb-6">
        Commencez un quiz pour voir votre progression et analyser vos erreurs par catégorie méthodologique.
      </p>

      <Button
        onClick={() => navigate('/dashboard')}
        className="bg-purple-600 hover:bg-purple-700"
      >
        Commencer un quiz
      </Button>
    </div>
  );
}
