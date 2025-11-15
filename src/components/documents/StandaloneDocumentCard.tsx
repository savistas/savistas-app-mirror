import { useState } from 'react';
import { Download, Eye, FileText, Trash2, Loader2 } from 'lucide-react';
import { Document, formatFileSize, getFileTypeLabel } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { documentService } from '@/services/documentService';
import { toast } from 'sonner';
import { DeleteDocumentDialog } from './DeleteDocumentDialog';

interface StandaloneDocumentCardProps {
  document: Document;
  onDelete: (id: string) => Promise<void>;
  onQuiz: (document: Document) => void;
  onFiche: (document: Document) => void;
  onProfIA: (document: Document) => void;
  isProcessing?: boolean;
}

export function StandaloneDocumentCard({
  document,
  onDelete,
  onQuiz,
  onFiche,
  onProfIA,
  isProcessing = false,
}: StandaloneDocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await documentService.downloadDocument(document);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = async () => {
    setIsViewing(true);
    try {
      const url = await documentService.getViewUrl(document);
      window.open(url, '_blank');
    } catch (error) {
      console.error('View failed:', error);
      toast.error('Erreur lors de la visualisation');
    } finally {
      setIsViewing(false);
    }
  };

  const handleDeleteConfirm = async () => {
    await onDelete(document.id);
    setShowDeleteDialog(false);
  };

  const formattedDate = new Date(document.created_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <>
      <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 relative w-[280px] flex-shrink-0">
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg z-10 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-sm font-medium text-gray-900">Chargement IA</p>
            <p className="text-xs text-gray-600 mt-1">Création du cours en cours...</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-3">
          <Badge variant="secondary" className="mb-2">
            {document.subject}
          </Badge>

          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
            <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1 min-w-0">
              {document.name}
            </h3>
          </div>

          <p className="text-sm text-gray-500">
            {getFileTypeLabel(document.file_type)} • {formatFileSize(document.file_size)} • {formattedDate}
          </p>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1" />
            )}
            Télécharger
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleView}
            disabled={isViewing}
            className="w-full"
          >
            {isViewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Eye className="w-4 h-4 mr-1" />
            )}
            Voir
          </Button>
        </div>

        {/* Revision Tools */}
        <div className="border-t pt-3 mb-3">
          <p className="text-xs text-gray-600 mb-2 font-medium">Réviser avec:</p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onQuiz(document)}
              className="text-xs"
            >
              Quiz
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onFiche(document)}
              className="text-xs"
            >
              Fiche
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onProfIA(document)}
              className="text-xs"
            >
              Prof IA
            </Button>
          </div>
        </div>

        {/* Delete Action */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="w-full"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Supprimer
        </Button>
      </div>

      <DeleteDocumentDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        documentName={document.name}
      />
    </>
  );
}
