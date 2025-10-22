import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RevisionSheetsByCourse as RevisionSheetsByCourseType } from '@/types/revisionSheet';
import { RevisionSheetCard } from './RevisionSheetCard';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  groupedSheets: RevisionSheetsByCourseType[];
  onPreview: (url: string, fileName: string) => void;
  onDownload: (url: string, fileName: string) => void;
}

export const RevisionSheetsByCourse = ({
  groupedSheets,
  onPreview,
  onDownload,
}: Props) => {
  const isMobile = useIsMobile();

  return (
    <Accordion type="multiple" defaultValue={groupedSheets.map(g => g.courseId)} className="space-y-4">
      {groupedSheets.map((group) => (
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
              </div>
            )}
          </AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 pb-2">
              <RevisionSheetCard
                courseTitle={group.courseName}
                subject={group.subject}
                ficheUrl={group.ficheUrl}
                createdAt={group.createdAt}
                onPreview={onPreview}
                onDownload={onDownload}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};
