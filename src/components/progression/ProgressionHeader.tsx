/**
 * Header component for progression page
 * Displays stats summary and period selector
 */

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { TimePeriod } from '@/types/progression';
import { formatPeriodLabel, calculateStats } from '@/lib/progressionUtils';
import { SubjectErrorSummary } from '@/types/progression';
import { TrendingDown, TrendingUp } from 'lucide-react';

interface ProgressionHeaderProps {
  period: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  subjects: SubjectErrorSummary[];
}

const periods: TimePeriod[] = ['week', 'month', 'quarter', 'all'];

export function ProgressionHeader({ period, onPeriodChange, subjects }: ProgressionHeaderProps) {
  const stats = calculateStats(subjects);

  return (
    <div className="space-y-6 mb-6">
      {/* Title and Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Ma Progression</h1>

        <Select value={period} onValueChange={(value) => onPeriodChange(value as TimePeriod)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>
                {formatPeriodLabel(p)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Total d'erreurs</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-3xl font-bold text-gray-900">{stats.total_errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Matières actives</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-3xl font-bold text-gray-900">{stats.active_subjects}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-600">Moyenne par matière</span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-3xl font-bold text-gray-900">{stats.average_errors}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
