import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, FileText, Clock } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  onDownload: () => void;
}

export const PDFPreviewDialog = ({
  open,
  onClose,
  fileUrl,
  fileName,
  onDownload,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl md:max-w-2xl w-[90vw] md:w-full rounded-2xl md:rounded-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex-1 truncate text-sm md:text-base">{fileName}</DialogTitle>
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-8 md:py-12 px-4 md:px-6 text-center space-y-4 md:space-y-6">
          {/* Icon */}
          <div className="relative">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 rounded-full bg-orange-100 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" />
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <h3 className="text-lg md:text-xl font-semibold text-slate-900">
              Aperçu PDF - Bientôt disponible
            </h3>
            <p className="text-sm md:text-base text-muted-foreground max-w-md">
              La fonctionnalité d'aperçu des fichiers PDF directement dans l'application sera bientôt disponible.
            </p>
            <p className="text-xs md:text-sm text-muted-foreground">
              En attendant, vous pouvez télécharger le fichier pour le consulter.
            </p>
          </div>

          {/* File info */}
          <div className="w-full max-w-md p-3 md:p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 md:w-5 md:h-5 text-slate-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-slate-900 truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">Document PDF</p>
              </div>
            </div>
          </div>

          {/* Download button */}
          <Button
            onClick={onDownload}
            size="lg"
            className="w-full max-w-xs"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le fichier
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
