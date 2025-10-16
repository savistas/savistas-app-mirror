/**
 * Custom hook for generating PDF error reports
 * Uses jsPDF for client-side PDF generation
 */

import { useMutation } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import { ErrorCategory } from '@/types/progression';
import { toast } from 'sonner';

interface GenerateReportParams {
  subjectName: string;
  errors: Record<ErrorCategory, number>;
  period: string;
}

/**
 * Generate a PDF report of errors for a subject
 *
 * @returns TanStack Query mutation for PDF generation
 */
export function useGenerateErrorReport() {
  return useMutation({
    mutationFn: async ({ subjectName, errors, period }: GenerateReportParams) => {
      try {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.text(`Rapport d'erreurs - ${subjectName}`, 20, 20);

        // Period
        doc.setFontSize(12);
        doc.text(`Période: ${period}`, 20, 35);

        // Add line separator
        doc.setLineWidth(0.5);
        doc.line(20, 40, 190, 40);

        // Error categories
        doc.setFontSize(14);
        doc.text('Répartition des erreurs par catégorie:', 20, 50);

        doc.setFontSize(12);
        let y = 60;

        const totalErrors = Object.values(errors).reduce((sum, count) => sum + count, 0);

        // List each category
        Object.entries(errors).forEach(([category, count]) => {
          const percentage = totalErrors > 0 ? ((count / totalErrors) * 100).toFixed(1) : '0.0';
          doc.text(`${category}: ${count} erreurs (${percentage}%)`, 30, y);
          y += 10;
        });

        // Total
        y += 5;
        doc.setFontSize(14);
        doc.text(`Total: ${totalErrors} erreurs`, 20, y);

        // Recommendations section
        y += 20;
        doc.setFontSize(14);
        doc.text('Recommandations:', 20, y);

        doc.setFontSize(11);
        y += 10;

        // Find highest error category
        const maxCategory = Object.entries(errors).reduce((max, [cat, count]) =>
          count > max.count ? { category: cat, count } : max,
          { category: '', count: 0 }
        );

        if (maxCategory.count > 0) {
          const recommendations: Record<string, string> = {
            'Compréhension': 'Prenez le temps de relire les énoncés et de reformuler les concepts avec vos propres mots.',
            'Concentration': 'Essayez de travailler dans un environnement calme et sans distractions.',
            'Analyse': 'Pratiquez la décomposition des problèmes complexes en étapes simples.',
            'Mémorisation': 'Utilisez des techniques de mémorisation comme les flashcards ou la répétition espacée.',
            'Synthèse': 'Entraînez-vous à résumer les informations principales après chaque leçon.',
          };

          const recommendation = recommendations[maxCategory.category as ErrorCategory];
          if (recommendation) {
            const lines = doc.splitTextToSize(`• Point d'amélioration principal: ${maxCategory.category}`, 170);
            lines.forEach((line: string) => {
              doc.text(line, 25, y);
              y += 7;
            });

            y += 5;
            const recLines = doc.splitTextToSize(`  ${recommendation}`, 165);
            recLines.forEach((line: string) => {
              doc.text(line, 25, y);
              y += 7;
            });
          }
        }

        // Footer
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFontSize(9);
        doc.setTextColor(128);
        doc.text('Généré par Savistas AI-Cademy', 20, pageHeight - 10);
        doc.text(new Date().toLocaleDateString('fr-FR'), 170, pageHeight - 10);

        // Save the PDF
        doc.save(`rapport-progression-${subjectName.toLowerCase().replace(/\s+/g, '-')}.pdf`);

        return true;
      } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Échec de la génération du PDF');
      }
    },
    onSuccess: () => {
      toast.success('PDF généré avec succès !', {
        description: 'Le rapport a été téléchargé.',
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur lors de la génération du PDF', {
        description: error.message,
      });
    },
  });
}
