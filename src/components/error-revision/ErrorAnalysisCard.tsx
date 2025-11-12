/**
 * ErrorAnalysisCard - Carte cliquable minimaliste avec popup pour le détail
 * Design responsive et cohérent avec l'application
 */

import { ErrorRevision } from '@/types/errorRevision';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Calendar,
  Lightbulb,
  Image as ImageIcon,
  ExternalLink,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configuration de pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface ErrorAnalysisCardProps {
  revision: ErrorRevision;
}

interface AnalysisItem {
  question: string;
  justification: string;
  correct_answer: string;
  student_answer: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
      return {
        icon: CheckCircle2,
        label: 'Terminé',
        color: 'bg-green-50 text-green-700 border-green-200',
        badgeColor: 'bg-green-100 text-green-800',
        iconColor: 'text-green-600'
      };
    case 'error':
      return {
        icon: XCircle,
        label: 'Erreur',
        color: 'bg-red-50 text-red-700 border-red-200',
        badgeColor: 'bg-red-100 text-red-800',
        iconColor: 'text-red-600'
      };
    default: // generating
      return {
        icon: Loader2,
        label: 'En cours',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        badgeColor: 'bg-blue-100 text-blue-800',
        iconColor: 'text-blue-600'
      };
  }
};

export const ErrorAnalysisCard = ({ revision }: ErrorAnalysisCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);

  const statusConfig = getStatusConfig(revision.status);
  const StatusIcon = statusConfig.icon;

  // Détecter si le fichier est un PDF
  const isPDF = revision.error_image_url?.toLowerCase().endsWith('.pdf') || false;

  // Parse analysis_response si présent
  // Support des deux formats: array direct ou objet avec items
  const analysisItems: AnalysisItem[] = Array.isArray(revision.analysis_response)
    ? revision.analysis_response
    : (revision.analysis_response?.items || []);
  const hasAnalysis = analysisItems.length > 0;
  const hasRecommendation = !!revision.global_recommandation;

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <>
      {/* Carte cliquable compacte */}
      <Card
        className="overflow-hidden hover:shadow-lg hover:border-purple-300 transition-all duration-200 border cursor-pointer"
        onClick={() => setIsDialogOpen(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            {/* Infos principales */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={`${statusConfig.badgeColor} text-xs px-2 py-0.5`}>
                  <StatusIcon className={`w-3 h-3 mr-1 ${revision.status === 'generating' ? 'animate-spin' : ''}`} />
                  {statusConfig.label}
                </Badge>
                <span className="text-xs text-gray-500">
                  {format(new Date(revision.created_at), 'dd/MM/yy', { locale: fr })}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 truncate">
                {revision.subject}
              </p>
              {revision.user_message && (
                <p className="text-xs text-gray-500 truncate mt-1">
                  {revision.user_message}
                </p>
              )}
            </div>

            {/* Thumbnail */}
            <div
              className="relative w-14 h-14 rounded border hover:border-purple-400 transition-colors overflow-hidden flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(true);
              }}
            >
              {isPDF ? (
                <div className="w-full h-full flex items-center justify-center bg-red-50">
                  <FileText className="w-8 h-8 text-red-600" />
                </div>
              ) : (
                <img
                  src={revision.error_image_url}
                  alt="Erreur"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          </div>

          {/* Indicateur si analyse disponible */}
          {revision.status === 'completed' && (hasAnalysis || hasRecommendation) && (
            <div className="mt-2 flex items-center gap-1 text-xs text-purple-600">
              <ExternalLink className="w-3 h-3" />
              <span>Cliquer pour voir l'analyse</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog avec le détail complet */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={statusConfig.badgeColor}>
                <StatusIcon className={`w-4 h-4 mr-1 ${revision.status === 'generating' ? 'animate-spin' : ''}`} />
                {statusConfig.label}
              </Badge>
              <span>{revision.subject} - {revision.course_name}</span>
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4" />
              {format(new Date(revision.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Image de l'erreur */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">
                {isPDF ? 'Document de l\'erreur' : 'Image de l\'erreur'}
              </h3>
              <div className="relative rounded-lg overflow-hidden border">
                {isPDF ? (
                  <div className="bg-gray-50">
                    <Document
                      file={revision.error_image_url}
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="flex items-center justify-center p-8">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                      }
                      error={
                        <div className="flex items-center justify-center p-8 text-red-600">
                          <AlertCircle className="w-6 h-6 mr-2" />
                          Erreur lors du chargement du PDF
                        </div>
                      }
                    >
                      <Page
                        pageNumber={1}
                        width={700}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>
                    {numPages && numPages > 1 && (
                      <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 text-center">
                        Page 1 sur {numPages} - Cliquez sur "Agrandir" pour voir toutes les pages
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={revision.error_image_url}
                    alt="Erreur complète"
                    className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setIsImageModalOpen(true)}
                  />
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute bottom-2 right-2"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  {isPDF ? <FileText className="w-4 h-4 mr-2" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                  Agrandir
                </Button>
              </div>
            </div>

            {/* Message utilisateur */}
            {revision.user_message && (
              <div className="bg-gray-50 border rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Ton message</h3>
                <p className="text-sm text-gray-700">{revision.user_message}</p>
              </div>
            )}

            {/* Statut generating */}
            {revision.status === 'generating' && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Analyse en cours...
                  </p>
                  <p className="text-xs text-blue-700">
                    L'analyse de ton erreur est en cours de traitement. Reviens dans quelques instants!
                  </p>
                </div>
              </div>
            )}

            {/* Statut erreur */}
            {revision.status === 'error' && (
              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">
                    Erreur lors de l'analyse
                  </p>
                  <p className="text-xs text-red-700">
                    Une erreur s'est produite. Contacte ton professeur si le problème persiste.
                  </p>
                </div>
              </div>
            )}

            {/* Analyse détaillée */}
            {revision.status === 'completed' && hasAnalysis && (
              <div className="space-y-3">
                <Separator />
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-purple-600" />
                  Détail des erreurs ({analysisItems.length})
                </h3>

                <div className="space-y-3">
                  {analysisItems.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg border p-4 space-y-3"
                    >
                      {/* Question */}
                      <div className="font-medium text-gray-900 flex items-start gap-2">
                        <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-sm">{item.question}</span>
                      </div>

                      <div className="space-y-2 pl-8">
                        {/* Réponse élève */}
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            Ta réponse:
                          </p>
                          <p className="text-sm text-red-900">{item.student_answer}</p>
                        </div>

                        {/* Réponse correcte */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-green-700 mb-1">
                            Réponse correcte:
                          </p>
                          <p className="text-sm text-green-900">{item.correct_answer}</p>
                        </div>

                        {/* Justification */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs font-semibold text-blue-700 mb-1">
                            Explication:
                          </p>
                          <div className="text-sm text-blue-900 prose prose-sm prose-blue max-w-none">
                            <ReactMarkdown>{item.justification}</ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommandation globale */}
            {revision.status === 'completed' && hasRecommendation && (
              <div className="space-y-2">
                <Separator />
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold mb-3">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                    Recommandation globale
                  </div>
                  <div className="text-sm text-amber-900 prose prose-sm prose-amber max-w-none">
                    <ReactMarkdown>{revision.global_recommandation}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal image/PDF fullscreen */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative w-full max-w-6xl max-h-[95vh] overflow-auto">
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="sticky top-0 left-full z-10 mb-2 text-white hover:text-gray-300 text-sm flex items-center gap-2 bg-black/50 px-3 py-2 rounded"
            >
              <XCircle className="w-5 h-5" />
              Fermer (Echap)
            </button>
            {isPDF ? (
              <div
                className="bg-white rounded-lg p-4"
                onClick={(e) => e.stopPropagation()}
              >
                <Document
                  file={revision.error_image_url}
                  onLoadSuccess={onDocumentLoadSuccess}
                  loading={
                    <div className="flex items-center justify-center p-12">
                      <Loader2 className="w-12 h-12 animate-spin text-gray-400" />
                    </div>
                  }
                  error={
                    <div className="flex items-center justify-center p-12 text-red-600">
                      <AlertCircle className="w-8 h-8 mr-2" />
                      Erreur lors du chargement du PDF
                    </div>
                  }
                >
                  {numPages && Array.from(new Array(numPages), (_, index) => (
                    <div key={`page_${index + 1}`} className="mb-4">
                      <Page
                        pageNumber={index + 1}
                        width={Math.min(window.innerWidth * 0.8, 1000)}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                      {numPages > 1 && (
                        <div className="text-center text-gray-600 text-sm mt-2 mb-4">
                          Page {index + 1} sur {numPages}
                        </div>
                      )}
                    </div>
                  ))}
                </Document>
              </div>
            ) : (
              <img
                src={revision.error_image_url}
                alt="Erreur complète"
                className="w-full h-auto max-h-[95vh] rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
};
