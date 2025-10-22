import { Download, Eye, FileText, FileImage, File, Presentation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserDocument } from '@/types/document';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

interface DocumentCardProps {
  document: UserDocument;
  onPreview: (url: string, fileName: string) => void;
  onDownload: (url: string, fileName: string) => void;
}

export const DocumentCard = ({
  document,
  onPreview,
  onDownload,
}: DocumentCardProps) => {
  const [imageError, setImageError] = useState(false);

  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(document.file_type || '');
  const isPdf = document.file_type === 'pdf';

  const getFileIcon = (type: string | null) => {
    if (type === 'pdf') return <FileText className="w-12 h-12 text-red-500" />;
    if (type === 'doc' || type === 'docx') return <FileText className="w-12 h-12 text-blue-500" />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type || '')) return <FileImage className="w-12 h-12 text-green-500" />;
    if (['ppt', 'pptx'].includes(type || '')) return <Presentation className="w-12 h-12 text-orange-500" />;
    return <File className="w-12 h-12 text-gray-500" />;
  };

  const getFileTypeBadge = (type: string | null) => {
    if (!type) return null;
    const typeUpper = type.toUpperCase();
    const colorClass =
      type === 'pdf' ? 'bg-red-100 text-red-700' :
      ['doc', 'docx'].includes(type) ? 'bg-blue-100 text-blue-700' :
      ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(type) ? 'bg-green-100 text-green-700' :
      'bg-gray-100 text-gray-700';

    return <Badge variant="secondary" className={`${colorClass} text-xs`}>{typeUpper}</Badge>;
  };

  return (
    <Card className="group hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden">
      {/* Image Preview or Icon */}
      {isImage && !imageError ? (
        <div className="relative w-full h-40 bg-gray-100">
          <img
            src={document.file_url}
            alt={document.course_title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 bg-gradient-to-br from-gray-50 to-gray-100">
          {getFileIcon(document.file_type)}
        </div>
      )}

      <div className="p-4 flex flex-col">
        {/* File Type Badge */}
        <div className="mb-2">
          {getFileTypeBadge(document.file_type)}
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 min-h-[2.5rem]">
          {document.course_title}
        </h3>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground mb-4">
          <p>
            Ajouté {formatDistanceToNow(new Date(document.uploaded_at), {
              addSuffix: true,
              locale: fr,
            })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onPreview(document.file_url, document.file_name)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(document.file_url, document.file_name)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
