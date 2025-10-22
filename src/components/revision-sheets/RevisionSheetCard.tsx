import { Download, Eye, FileText, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface RevisionSheetCardProps {
  courseTitle: string;
  subject: string;
  ficheUrl: string;
  createdAt: string;
  onPreview: (url: string, fileName: string) => void;
  onDownload: (url: string, fileName: string) => void;
}

export const RevisionSheetCard = ({
  courseTitle,
  subject,
  ficheUrl,
  createdAt,
  onPreview,
  onDownload,
}: RevisionSheetCardProps) => {
  const fileName = `Fiche_Revision_${courseTitle}.pdf`;

  return (
    <Card className="group hover:shadow-md hover:border-primary/50 transition-all duration-200 overflow-hidden">
      {/* Header avec icône */}
      <div className="flex items-center justify-center h-32 bg-gradient-to-br from-purple-50 to-purple-100">
        <GraduationCap className="w-16 h-16 text-purple-500" />
      </div>

      <div className="p-4 flex flex-col">
        {/* Type Badge */}
        <div className="mb-2">
          <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
            FICHE DE RÉVISION
          </Badge>
        </div>

        {/* Course Title */}
        <h3 className="font-semibold text-sm line-clamp-2 mb-1 min-h-[2.5rem]">
          {courseTitle}
        </h3>

        {/* Subject Badge */}
        <Badge variant="outline" className="w-fit mb-3 text-xs">
          {subject}
        </Badge>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground mb-4">
          <p>
            Générée {formatDistanceToNow(new Date(createdAt), {
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
            onClick={() => onPreview(ficheUrl, fileName)}
          >
            <Eye className="w-4 h-4 mr-1" />
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDownload(ficheUrl, fileName)}
          >
            <Download className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
