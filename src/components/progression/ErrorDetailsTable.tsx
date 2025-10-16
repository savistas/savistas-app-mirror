/**
 * Error details table component
 * Displays individual errors with categories, justifications, and messages
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { ErrorCategory, TimePeriod } from '@/types/progression';
import { getDateRange } from '@/lib/progressionUtils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ErrorDetail {
  id: string;
  categorie: ErrorCategory;
  justification: string | null;
  message: string;
  created_at: string;
  exercice_id: string;
}

interface ErrorDetailsTableProps {
  subjectId: string;
  subjectName: string;
  period: TimePeriod;
}

export function ErrorDetailsTable({ subjectId, subjectName, period }: ErrorDetailsTableProps) {
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);

  // Fetch detailed errors for this subject
  const { data: errors = [], isLoading } = useQuery({
    queryKey: ['error-details', subjectId, period],
    queryFn: async (): Promise<ErrorDetail[]> => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const startDate = getDateRange(period);

      const { data, error } = await supabase
        .from('error_responses')
        .select('id, categorie, justification, message, created_at, exercice_id')
        .eq('user_id', user.id)
        .eq('course_id', subjectId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching error details:', error);
        throw error;
      }

      return data || [];
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const toggleExpand = (errorId: string) => {
    setExpandedErrorId(expandedErrorId === errorId ? null : errorId);
  };

  const getCategoryColor = (category: ErrorCategory): string => {
    const colors: Record<ErrorCategory, string> = {
      'Compréhension': 'bg-purple-100 text-purple-800 border-purple-200',
      'Concentration': 'bg-blue-100 text-blue-800 border-blue-200',
      'Analyse': 'bg-green-100 text-green-800 border-green-200',
      'Mémorisation': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Synthèse': 'bg-red-100 text-red-800 border-red-200',
    };

    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardContent className="py-8">
          <div className="text-center text-gray-500">
            Chargement des détails des erreurs...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (errors.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Détails des erreurs - {subjectName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Aucune erreur trouvée pour cette période.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          Détails des erreurs - {subjectName}
          <Badge variant="secondary" className="ml-auto">
            {errors.length} erreur{errors.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {errors.map((error) => (
            <div
              key={error.id}
              className="border rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md"
            >
              {/* Error header - always visible */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(error.id)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Badge className={`${getCategoryColor(error.categorie)} border`}>
                    {error.categorie}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    {format(new Date(error.created_at), 'PPP', { locale: fr })}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2"
                >
                  {expandedErrorId === error.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Error details - expandable */}
              {expandedErrorId === error.id && (
                <div className="p-4 bg-white border-t space-y-4">
                  {/* Message */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      Message :
                    </h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md border border-blue-100">
                      {error.message}
                    </p>
                  </div>

                  {/* Justification */}
                  {error.justification && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Justification pédagogique :
                      </h4>
                      <p className="text-sm text-gray-600 bg-amber-50 p-3 rounded-md border border-amber-100">
                        {error.justification}
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t">
                    <span>
                      Date: {format(new Date(error.created_at), 'PPPp', { locale: fr })}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
