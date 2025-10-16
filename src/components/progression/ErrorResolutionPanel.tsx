/**
 * Error resolution panel component
 * Provides actions for PDF generation and chat with virtual teacher
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageCircle, Loader2 } from 'lucide-react';
import { ErrorCategory, TimePeriod } from '@/types/progression';
import { useGenerateErrorReport } from '@/hooks/useGenerateErrorReport';
import { useNavigate } from 'react-router-dom';
import { formatPeriodLabel } from '@/lib/progressionUtils';

interface ErrorResolutionPanelProps {
  subjectId: string;
  subjectName: string;
  errorSummary: Record<ErrorCategory, number>;
  period: TimePeriod;
}

export function ErrorResolutionPanel({
  subjectId,
  subjectName,
  errorSummary,
  period,
}: ErrorResolutionPanelProps) {
  const navigate = useNavigate();
  const { mutate: generatePDF, isPending } = useGenerateErrorReport();

  const handleGeneratePDF = () => {
    generatePDF({
      subjectName,
      errors: errorSummary,
      period: formatPeriodLabel(period),
    });
  };

  const handleChatWithTeacher = () => {
    // Find the category with the most errors
    const maxCategory = Object.entries(errorSummary).reduce(
      (max, [cat, count]) => (count > max.count ? { category: cat, count } : max),
      { category: '', count: 0 }
    );

    // Navigate to messaging with context
    // TODO: Pass context to messaging page when that feature is available
    navigate('/messaging', {
      state: {
        context: `J'ai des difficultés en ${subjectName}, particulièrement en ${maxCategory.category}`,
      },
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg">Résolution d'erreurs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={handleGeneratePDF}
            disabled={isPending}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileText className="w-4 h-4 mr-2" />
            )}
            Générer le rapport PDF
          </Button>

          <Button
            onClick={handleChatWithTeacher}
            variant="outline"
            className="flex-1"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Discuter avec le professeur virtuel
          </Button>
        </div>

        <p className="text-sm text-gray-500 mt-3">
          Le rapport PDF contient une analyse détaillée de vos erreurs et des recommandations
          personnalisées pour vous améliorer.
        </p>
      </CardContent>
    </Card>
  );
}
