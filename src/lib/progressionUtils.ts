/**
 * Utility functions for the Progression feature
 * Handles data transformation, color scales, and calculations
 */

import { format, subDays, subMonths, startOfDay } from 'date-fns';
import {
  ErrorDataPoint,
  ChartDataPoint,
  ErrorLevel,
  TimePeriod,
  SubjectErrorSummary,
  ErrorCategory
} from '@/types/progression';

/**
 * Transform error data points into chart-ready format
 * Groups errors by date and aggregates counts per category
 *
 * @param errors - Array of individual error data points
 * @returns Array of chart data points sorted by date
 */
export function transformToChartData(errors: ErrorDataPoint[]): ChartDataPoint[] {
  const grouped = errors.reduce((acc, error) => {
    const dateKey = format(startOfDay(error.date), 'yyyy-MM-dd');

    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        Compréhension: 0,
        Concentration: 0,
        Analyse: 0,
        Mémorisation: 0,
        Synthèse: 0,
      };
    }

    acc[dateKey][error.category] += error.count;
    return acc;
  }, {} as Record<string, ChartDataPoint>);

  return Object.values(grouped).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

/**
 * Get Tailwind CSS class for error count badge based on ratio
 * Uses color scale: gray (0) → green (low) → yellow (medium) → orange (high) → red (very high)
 *
 * @param count - Number of errors
 * @param max - Maximum number of errors across all subjects/categories
 * @returns Tailwind CSS class string for badge styling
 */
export function getErrorColorClass(count: number, max: number): string {
  if (max === 0 || count === 0) {
    return 'bg-gray-50 text-gray-600 border-gray-200';
  }

  const ratio = count / max;

  if (ratio < 0.25) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  if (ratio < 0.5) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
  if (ratio < 0.75) {
    return 'bg-orange-100 text-orange-800 border-orange-200';
  }
  return 'bg-red-100 text-red-800 border-red-200';
}

/**
 * Classify error count into descriptive level
 *
 * @param count - Number of errors
 * @param max - Maximum number of errors for context
 * @returns Error level classification
 */
export function getErrorLevel(count: number, max: number): ErrorLevel {
  if (max === 0 || count === 0) {
    return 'Faible';
  }

  const ratio = count / max;

  if (ratio < 0.25) return 'Faible';
  if (ratio < 0.5) return 'Modéré';
  if (ratio < 0.75) return 'Élevé';
  return 'Très élevé';
}

/**
 * Get date range based on time period
 * Returns the start date for filtering data
 *
 * @param period - Time period to calculate from
 * @returns Date object representing the start of the period
 */
export function getDateRange(period: TimePeriod): Date {
  const now = new Date();

  switch (period) {
    case 'week':
      return subDays(now, 7);
    case 'month':
      return subMonths(now, 1);
    case 'quarter':
      return subMonths(now, 3);
    case 'all':
      return new Date(0); // Unix epoch start
    default:
      return subDays(now, 7);
  }
}

/**
 * Format time period for display in French
 *
 * @param period - Time period enum value
 * @returns Localized period label
 */
export function formatPeriodLabel(period: TimePeriod): string {
  const labels: Record<TimePeriod, string> = {
    week: 'Dernière semaine',
    month: 'Dernier mois',
    quarter: '3 derniers mois',
    all: 'Tout',
  };

  return labels[period];
}

/**
 * Sort subjects by specified criteria
 *
 * @param subjects - Array of subject error summaries
 * @param sortBy - Column to sort by
 * @param sortOrder - Sort direction
 * @returns Sorted array of subjects
 */
export function sortSubjects(
  subjects: SubjectErrorSummary[],
  sortBy: 'subject' | 'total_errors',
  sortOrder: 'asc' | 'desc'
): SubjectErrorSummary[] {
  const sorted = [...subjects].sort((a, b) => {
    if (sortBy === 'subject') {
      return a.subject.localeCompare(b.subject);
    }
    return a.total_errors - b.total_errors;
  });

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
}

/**
 * Calculate overall statistics from subject summaries
 *
 * @param subjects - Array of subject error summaries
 * @returns Aggregated statistics
 */
export function calculateStats(subjects: SubjectErrorSummary[]) {
  const total_errors = subjects.reduce((sum, s) => sum + s.total_errors, 0);
  const active_subjects = subjects.filter(s => s.total_errors > 0).length;
  const average_errors = active_subjects > 0 ? total_errors / active_subjects : 0;

  return {
    total_errors,
    active_subjects,
    average_errors: Math.round(average_errors * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Find the maximum error count across all categories for a set of subjects
 * Used for normalizing color scales
 *
 * @param subjects - Array of subject error summaries
 * @returns Maximum error count found
 */
export function getMaxErrorCount(subjects: SubjectErrorSummary[]): number {
  let max = 0;

  subjects.forEach(subject => {
    Object.values(subject.errors).forEach(count => {
      if (count > max) max = count;
    });
  });

  return max;
}

/**
 * Get chart curve color for each error category
 * Consistent color mapping for Recharts visualization
 *
 * @param category - Error category
 * @returns Hex color code
 */
export function getCategoryColor(category: ErrorCategory): string {
  const colors: Record<ErrorCategory, string> = {
    'Compréhension': '#c4b5fd',  // Light Purple (pastel)
    'Concentration': '#93c5fd',  // Light Blue (pastel)
    'Analyse': '#86efac',         // Light Green (pastel)
    'Mémorisation': '#fcd34d',    // Light Orange (pastel)
    'Synthèse': '#fca5a5',        // Light Red (pastel)
  };

  return colors[category];
}

/**
 * Generate mock data for development/testing
 * Creates realistic error data for multiple subjects
 *
 * @param numSubjects - Number of subjects to generate
 * @param numDays - Number of days of historical data
 * @returns Array of subject error summaries
 */
export function generateMockData(
  numSubjects: number = 5,
  numDays: number = 30
): SubjectErrorSummary[] {
  const subjects = [
    'Mathématiques',
    'Français',
    'Histoire',
    'Sciences',
    'Anglais',
    'Physique',
    'Chimie',
    'Biologie',
  ].slice(0, numSubjects);

  return subjects.map((subject, index) => {
    const errors: Record<ErrorCategory, number> = {
      Compréhension: Math.floor(Math.random() * 20),
      Concentration: Math.floor(Math.random() * 15),
      Analyse: Math.floor(Math.random() * 18),
      Mémorisation: Math.floor(Math.random() * 22),
      Synthèse: Math.floor(Math.random() * 16),
    };

    const total_errors = Object.values(errors).reduce((sum, val) => sum + val, 0);

    return {
      subject,
      subject_id: `subject-${index + 1}`,
      errors,
      total_errors,
      last_activity: subDays(new Date(), Math.floor(Math.random() * numDays)),
    };
  });
}

/**
 * Generate mock chart data for a subject
 * Creates time series data for visualization testing
 *
 * @param numDays - Number of days of data to generate
 * @returns Array of chart data points
 */
export function generateMockChartData(numDays: number = 30): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];

  for (let i = numDays; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    data.push({
      date,
      Compréhension: Math.floor(Math.random() * 5),
      Concentration: Math.floor(Math.random() * 4),
      Analyse: Math.floor(Math.random() * 6),
      Mémorisation: Math.floor(Math.random() * 5),
      Synthèse: Math.floor(Math.random() * 4),
    });
  }

  return data;
}
