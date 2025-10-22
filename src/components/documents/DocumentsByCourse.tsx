import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { DocumentsByCourse as DocumentsByCourseType } from '@/types/document';
import { DocumentCard } from './DocumentCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  groupedDocuments: DocumentsByCourseType[];
  onPreview: (url: string, fileName: string) => void;
  onDownload: (url: string, fileName: string) => void;
}

export const DocumentsByCourse = ({
  groupedDocuments,
  onPreview,
  onDownload,
}: Props) => {
  const isMobile = useIsMobile();

  return (
    <Accordion type="multiple" defaultValue={groupedDocuments.map(g => g.courseId)} className="space-y-4">
      {groupedDocuments.map((group) => (
        <AccordionItem key={group.courseId} value={group.courseId} className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline py-4">
            {isMobile ? (
              <div className="flex flex-col gap-1 text-left w-full">
                <span className="font-semibold text-primary">{group.subject}</span>
                <span className="font-medium text-sm">{group.courseName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-left">
                <span className="font-semibold text-primary">{group.subject}</span>
                <span className="text-muted-foreground">—</span>
                <span className="font-medium">{group.courseName}</span>
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                  {group.documents.length} document{group.documents.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-2">
              {group.documents.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  onPreview={onPreview}
                  onDownload={onDownload}
                />
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
