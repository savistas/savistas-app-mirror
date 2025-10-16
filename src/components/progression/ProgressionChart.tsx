/**
 * Progression chart component
 * Displays line chart with 5 error category curves using Recharts
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ChartDataPoint, ErrorCategory } from '@/types/progression';
import { getCategoryColor } from '@/lib/progressionUtils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ProgressionChartProps {
  subjectName: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  onClose: () => void;
  height?: number;
}

const errorCategories: ErrorCategory[] = [
  'Compréhension',
  'Concentration',
  'Analyse',
  'Mémorisation',
  'Synthèse',
];

/**
 * Custom tooltip for chart hover
 */
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
      <p className="font-semibold mb-2">
        {format(new Date(label), 'dd MMMM yyyy', { locale: fr })}
      </p>
      <div className="space-y-1">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium">{entry.value} erreur(s)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProgressionChart({
  subjectName,
  data,
  isLoading,
  onClose,
  height = 400,
}: ProgressionChartProps) {
  const totalErrors = data.reduce((sum, point) => {
    return sum + errorCategories.reduce((catSum, cat) => catSum + point[cat], 0);
  }, 0);

  // Loading state
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Chargement...</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-[400px] bg-gray-100 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (data.length === 0 || totalErrors === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">Progression - {subjectName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
            <span className="sr-only">Fermer le graphique</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-gray-900 mb-2">
              Aucune erreur enregistrée
            </p>
            <p className="text-gray-600">Continuez comme ça !</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Progression - {subjectName}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Fermer le graphique"
        >
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), 'dd/MM')}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              label={{
                value: "Nombre d'erreurs",
                angle: -90,
                position: 'insideLeft',
                style: { fontSize: '14px', fill: '#6b7280' },
              }}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />

            {errorCategories.map((category) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                name={category}
                stroke={getCategoryColor(category)}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>

        {/* Accessibility: Hidden data table for screen readers */}
        <table className="sr-only" role="table" aria-label="Données du graphique de progression">
          <thead>
            <tr>
              <th>Date</th>
              {errorCategories.map((cat) => (
                <th key={cat}>{cat}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((point, i) => (
              <tr key={i}>
                <td>{format(new Date(point.date), 'dd/MM/yyyy')}</td>
                {errorCategories.map((cat) => (
                  <td key={cat}>{point[cat]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
