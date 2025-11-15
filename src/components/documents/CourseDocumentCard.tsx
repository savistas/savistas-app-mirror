import { useState } from 'react';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';
import { UserDocument } from '@/types/document';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface CourseDocumentCardProps {
  document: UserDocument;
  onPreview: (url: string, fileName: string) => void;
  onDownload: (url: string, fileName: string) => void;
  onQuiz: (document: UserDocument) => void;
  onFiche: (document: UserDocument) => void;
  onProfIA: (document: UserDocument) => void;
}

export function CourseDocumentCard({
  document,
  onPreview,
  onDownload,
  onQuiz,
  onFiche,
  onProfIA,
}: CourseDocumentCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await onDownload(document.file_url, document.file_name);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Erreur lors du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = () => {
    onPreview(document.file_url, document.file_name);
  };

  const formattedDate = new Date(document.uploaded_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Get file type from file_name extension
  const getFileType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'ppt': 'PowerPoint',
      'pptx': 'PowerPoint',
      'jpg': 'Image',
      'jpeg': 'Image',
      'png': 'Image',
      'gif': 'Image',
      'txt': 'Texte',
    };
    return typeMap[ext || ''] || 'Fichier';
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return ' • ' + Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow duration-200 w-[280px] flex-shrink-0">
      {/* Header */}
      <div className="mb-3">
        <Badge variant="secondary" className="mb-2">
          {document.course_subject}
        </Badge>

        <div className="flex items-start gap-2 mb-2">
          <FileText className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {document.course_title}
            </h3>
            <p className="text-xs text-gray-600 truncate">
              {document.file_name}
            </p>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          {getFileType(document.file_name)}{formatFileSize(document.file_size)} • {formattedDate}
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
          className="w-full"
        >
          <Eye className="w-4 h-4 mr-1" />
          Voir
        </Button>
      </div>

      {/* Revision Tools */}
      <div className="border-t pt-3">
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
    </div>
  );
}
