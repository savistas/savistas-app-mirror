/**
 * TypeScript types for the Progression feature
 * Defines error tracking, methodology dashboard, and chart data structures
 */

/**
 * Error categories for learning methodology
 * Maps to the 5 key areas of learning difficulties
 */
export type ErrorCategory =
  | 'Compréhension'
  | 'Concentration'
  | 'Analyse'
  | 'Mémorisation'
  | 'Synthèse';

/**
 * Time period for filtering progression data
 */
export type TimePeriod = 'week' | 'month' | 'quarter' | 'all';

/**
 * Summary of errors by category for a specific subject
 */
export interface SubjectErrorSummary {
  /** Subject name (e.g., "Mathématiques") */
  subject: string;
  /** Unique identifier for the subject */
  subject_id: string;
  /** Error counts by category */
  errors: Record<ErrorCategory, number>;
  /** Total number of errors across all categories */
  total_errors: number;
  /** Date of last quiz activity for this subject */
  last_activity: Date;
}

/**
 * Individual error data point for chart visualization
 */
export interface ErrorDataPoint {
  /** Date when the error occurred */
  date: Date;
  /** Category of the error */
  category: ErrorCategory;
  /** Number of errors of this category on this date */
  count: number;
  /** Optional: ID of the quiz where the error occurred */
  quiz_id?: string;
}

/**
 * Complete progression data for a user
 */
export interface ProgressionData {
  /** List of subjects with error summaries */
  subjects: SubjectErrorSummary[];
  /** Time period for the data */
  period: TimePeriod;
}

/**
 * Chart data point with all error categories
 * Used for Recharts LineChart component
 */
export interface ChartDataPoint {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string;
  /** Number of comprehension errors */
  Compréhension: number;
  /** Number of concentration errors */
  Concentration: number;
  /** Number of analysis errors */
  Analyse: number;
  /** Number of memorization errors */
  Mémorisation: number;
  /** Number of synthesis errors */
  Synthèse: number;
}

/**
 * Error level classification based on count
 */
export type ErrorLevel = 'Faible' | 'Modéré' | 'Élevé' | 'Très élevé';

/**
 * Sort configuration for the methodology table
 */
export interface SortConfig {
  /** Column to sort by */
  sortBy: 'subject' | 'total_errors';
  /** Sort direction */
  sortOrder: 'asc' | 'desc';
}

/**
 * Overall statistics for the progression page header
 */
export interface ProgressionStats {
  /** Total number of errors across all subjects */
  total_errors: number;
  /** Number of active subjects (with at least one quiz attempt) */
  active_subjects: number;
  /** Average errors per subject */
  average_errors: number;
  /** Trend compared to previous period (positive = more errors, negative = fewer errors) */
  trend_percentage?: number;
}
