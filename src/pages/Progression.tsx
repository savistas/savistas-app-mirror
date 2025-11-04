/**
 * Main Progression page component
 * Displays error tracking dashboard with methodology table and charts
 */

import { useState, useEffect } from 'react';
import { TimePeriod } from '@/types/progression';
import { useProgressionData } from '@/hooks/useProgressionData';
import { useErrorsBySubject } from '@/hooks/useErrorsBySubject';
import { ProgressionHeader } from '@/components/progression/ProgressionHeader';
import { MethodologyTable } from '@/components/progression/MethodologyTable';
import { ProgressionChart } from '@/components/progression/ProgressionChart';
import { ErrorResolutionPanel } from '@/components/progression/ErrorResolutionPanel';
import { EmptyState } from '@/components/progression/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import BurgerMenu from '@/components/BurgerMenu';
import { useAuth } from '@/contexts/AuthContext';
import { useDisplayName } from '@/hooks/useDisplayName';
import { supabase } from '@/integrations/supabase/client';

export default function Progression() {
  const { user } = useAuth();
  const displayName = useDisplayName();
  const [period, setPeriod] = useState<TimePeriod>('week');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>('');

  // Fetch progression data
  const { data: subjects = [], isLoading: isLoadingSubjects } = useProgressionData(period);

  // Fetch detailed chart data for selected subject
  const { data: chartData = [], isLoading: isLoadingChart } = useErrorsBySubject(
    selectedSubjectId,
    period
  );

  // Reset selection when period changes
  useEffect(() => {
    setSelectedSubjectId(null);
    setSelectedSubjectName('');
  }, [period]);

  const handleSelectSubject = (subjectId: string, subjectName: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedSubjectName(subjectName);
  };

  const handleCloseChart = () => {
    setSelectedSubjectId(null);
    setSelectedSubjectName('');
  };

  // Get error summary for selected subject
  const selectedSubject = subjects.find((s) => s.subject_id === selectedSubjectId);

  // Empty state: no subjects with data
  if (!isLoadingSubjects && subjects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-4">
            <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{displayName || 'Mon profil'}</span>
          </div>
          <BurgerMenu />
        </header>

        {/* Main Content */}
        <div className="p-4 md:p-8 pt-24 md:pt-28 pb-32">
          <EmptyState />
        </div>

        {/* Bottom Navigation */}
        <div className="relative z-50">
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{displayName || 'Mon profil'}</span>
        </div>
        <BurgerMenu />
      </header>

      {/* Main Content */}
      <div className="p-4 md:p-8 pt-24 md:pt-28 pb-32">
        <div className="max-w-7xl mx-auto">
        {/* Header with stats and period selector */}
        <ProgressionHeader
          period={period}
          onPeriodChange={setPeriod}
          subjects={subjects}
        />

        {/* Methodology Table Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Tableau de Méthodologie</h2>

            {subjects.length > 0 ? (
              <MethodologyTable
                data={subjects}
                onSelectSubject={handleSelectSubject}
                selectedSubjectId={selectedSubjectId || undefined}
                isLoading={isLoadingSubjects}
              />
            ) : (
              <div className="py-8 text-center text-gray-500">
                Chargement des données...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Section - Only visible when subject is selected */}
        {selectedSubjectId ? (
          <>
            <ProgressionChart
              subjectName={selectedSubjectName}
              data={chartData}
              isLoading={isLoadingChart}
              onClose={handleCloseChart}
            />

            {/* Error Resolution Panel */}
            {selectedSubject && (
              <ErrorResolutionPanel
                subjectId={selectedSubject.subject_id}
                subjectName={selectedSubject.subject}
                errorSummary={selectedSubject.errors}
                period={period}
              />
            )}
          </>
        ) : (
          /* Placeholder when no subject is selected */
          <Card>
            <CardContent className="py-16">
              <div className="text-center text-gray-500">
                <p className="text-lg font-medium mb-2">
                  Cliquez sur une matière pour voir votre progression
                </p>
                <p className="text-sm">
                  Le graphique affichera l'évolution de vos erreurs par catégorie méthodologique
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-50">
      </div>
    </div>
  );
}
