/**
 * Custom hook for fetching detailed error data for a specific subject
 * Used for chart visualization
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChartDataPoint, TimePeriod } from '@/types/progression';
import { getDateRange, generateMockChartData, transformToChartData } from '@/lib/progressionUtils';

/**
 * Fetch time-series error data for a specific subject
 * Queries error_responses table for a specific course_id
 *
 * @param subjectId - ID of the subject (course_id) to fetch errors for
 * @param period - Time period to filter data by
 * @returns TanStack Query result with chart data points
 */
export function useErrorsBySubject(subjectId: string | null, period: TimePeriod) {
  return useQuery({
    queryKey: ['errors-by-subject', subjectId, period],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      if (!subjectId) {
        return [];
      }

      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      const startDate = getDateRange(period);

      // Query error_responses table for this specific subject
      const { data, error } = await supabase
        .from('error_responses')
        .select('categorie, created_at, exercice_id')
        .eq('user_id', user.id)
        .eq('course_id', subjectId)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching chart data:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return [];
      }

      // Transform raw data into ErrorDataPoint[]
      const errorDataPoints = data.map(row => ({
        date: new Date(row.created_at),
        category: row.categorie as any,
        count: 1, // Each row represents one error
        quiz_id: row.exercice_id,
      }));

      // Transform to chart format
      return transformToChartData(errorDataPoints);
    },
    enabled: !!subjectId, // Only run query if subjectId is provided
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 2,
  });
}
