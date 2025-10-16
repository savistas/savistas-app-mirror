/**
 * Custom hook for fetching progression data
 * Handles data fetching with TanStack Query for caching and optimistic updates
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SubjectErrorSummary, TimePeriod } from '@/types/progression';
import { getDateRange, generateMockData } from '@/lib/progressionUtils';

/**
 * Fetch progression data for the authenticated user
 * Queries error_responses table and aggregates by subject
 *
 * @param period - Time period to filter data by
 * @returns TanStack Query result with subject error summaries
 */
export function useProgressionData(period: TimePeriod) {
  return useQuery({
    queryKey: ['progression', period],
    queryFn: async (): Promise<SubjectErrorSummary[]> => {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const startDate = getDateRange(period);

      // Query error_responses table
      const { data, error } = await supabase
        .from('error_responses')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching progression data:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform raw data into SubjectErrorSummary[]
      return aggregateErrorsBySubject(data);
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}

/**
 * Helper function to aggregate raw error data by subject
 * Groups errors from error_responses table by matiere (subject)
 *
 * @param rawData - Raw error data from database
 * @returns Aggregated subject error summaries
 */
function aggregateErrorsBySubject(rawData: any[]): SubjectErrorSummary[] {
  const subjectMap = new Map<string, SubjectErrorSummary>();

  rawData.forEach(row => {
    const subjectName = row.matiere || 'Matière inconnue';
    const subjectId = row.course_id || 'unknown';

    if (!subjectMap.has(subjectId)) {
      subjectMap.set(subjectId, {
        subject: subjectName,
        subject_id: subjectId,
        errors: {
          Compréhension: 0,
          Concentration: 0,
          Analyse: 0,
          Mémorisation: 0,
          Synthèse: 0,
        },
        total_errors: 0,
        last_activity: new Date(row.created_at),
      });
    }

    const subject = subjectMap.get(subjectId)!;
    const category = row.categorie as any;

    // Only count if it's a valid category
    if (category && subject.errors[category as keyof typeof subject.errors] !== undefined) {
      subject.errors[category as keyof typeof subject.errors] += 1;
      subject.total_errors += 1;
    }

    // Update last activity if this is more recent
    const rowDate = new Date(row.created_at);
    if (rowDate > subject.last_activity) {
      subject.last_activity = rowDate;
    }
  });

  return Array.from(subjectMap.values());
}
