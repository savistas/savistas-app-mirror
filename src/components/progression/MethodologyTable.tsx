/**
 * Methodology table component
 * Displays error summary by subject with color-coded badges
 */

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { SubjectErrorSummary, ErrorCategory } from '@/types/progression';
import { getErrorColorClass, getMaxErrorCount } from '@/lib/progressionUtils';
import { cn } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import { useState } from 'react';

interface MethodologyTableProps {
  data: SubjectErrorSummary[];
  onSelectSubject: (subjectId: string, subjectName: string) => void;
  selectedSubjectId?: string;
  isLoading?: boolean;
}

const errorCategories: ErrorCategory[] = [
  'Compréhension',
  'Concentration',
  'Analyse',
  'Mémorisation',
  'Synthèse',
];

export function MethodologyTable({
  data,
  onSelectSubject,
  selectedSubjectId,
  isLoading,
}: MethodologyTableProps) {
  const [sortBy, setSortBy] = useState<'subject' | 'total_errors'>('subject');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const maxErrorCount = getMaxErrorCount(data);

  const handleSort = (column: 'subject' | 'total_errors') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (sortBy === 'subject') {
      return sortOrder === 'asc'
        ? a.subject.localeCompare(b.subject)
        : b.subject.localeCompare(a.subject);
    }
    return sortOrder === 'asc'
      ? a.total_errors - b.total_errors
      : b.total_errors - a.total_errors;
  });

  // Desktop view: Table
  const DesktopView = () => (
    <div className="hidden md:block overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('subject')}
            >
              <div className="flex items-center gap-1">
                Matière
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </TableHead>
            {errorCategories.map((category) => (
              <TableHead key={category} className="text-center">
                {category}
              </TableHead>
            ))}
            <TableHead
              className="text-center cursor-pointer hover:bg-gray-50"
              onClick={() => handleSort('total_errors')}
            >
              <div className="flex items-center justify-center gap-1">
                Total erreurs
                <ArrowUpDown className="w-4 h-4" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={7}>
                  <div className="h-10 bg-gray-100 animate-pulse rounded" />
                </TableCell>
              </TableRow>
            ))
          ) : (
            sortedData.map((subject) => (
              <TableRow
                key={subject.subject_id}
                onClick={() => onSelectSubject(subject.subject_id, subject.subject)}
                className={cn(
                  'cursor-pointer hover:bg-gray-50 transition-colors',
                  selectedSubjectId === subject.subject_id && 'bg-purple-50 border-l-4 border-l-purple-600'
                )}
                role="button"
                tabIndex={0}
                aria-pressed={selectedSubjectId === subject.subject_id}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectSubject(subject.subject_id, subject.subject);
                  }
                }}
              >
                <TableCell className="font-medium">{subject.subject}</TableCell>
                {errorCategories.map((category) => {
                  const count = subject.errors[category];
                  return (
                    <TableCell key={category} className="text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium border',
                          getErrorColorClass(count, maxErrorCount)
                        )}
                      >
                        {count}
                      </span>
                    </TableCell>
                  );
                })}
                <TableCell className="text-center">
                  <span className="font-bold text-gray-900">{subject.total_errors}</span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );

  // Mobile view: Cards
  const MobileView = () => (
    <div className="md:hidden space-y-4">
      {isLoading ? (
        // Loading skeleton
        Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <div className="h-24 bg-gray-100 animate-pulse rounded" />
          </Card>
        ))
      ) : (
        sortedData.map((subject) => (
          <Card
            key={subject.subject_id}
            onClick={() => onSelectSubject(subject.subject_id, subject.subject)}
            className={cn(
              'p-4 cursor-pointer hover:shadow-md transition-shadow',
              selectedSubjectId === subject.subject_id && 'ring-2 ring-purple-600'
            )}
            role="button"
            tabIndex={0}
            aria-pressed={selectedSubjectId === subject.subject_id}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">{subject.subject}</h3>
              <span className="text-2xl font-bold text-purple-600">{subject.total_errors}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {errorCategories.map((category) => {
                const count = subject.errors[category];
                return (
                  <div key={category} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{category}:</span>
                    <span
                      className={cn(
                        'inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border',
                        getErrorColorClass(count, maxErrorCount)
                      )}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <>
      <DesktopView />
      <MobileView />
    </>
  );
}
