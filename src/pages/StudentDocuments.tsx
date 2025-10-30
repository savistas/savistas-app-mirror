import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { useDownloadFile } from '@/hooks/useDownloadFile';
import { DocumentsByCourse } from '@/components/documents/DocumentsByCourse';
import { EmptyDocuments } from '@/components/documents/EmptyDocuments';
import { PDFPreviewDialog } from '@/components/shared/PDFPreviewDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Search, FolderOpen, Plus, FileText, ChevronRight } from 'lucide-react';
import { DocumentsByCourse as GroupedDocs, Document, UserDocument } from '@/types/document';
import { toast } from 'sonner';
import BurgerMenu from '@/components/BurgerMenu';
import BottomNav from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useDocuments, useDocumentDelete } from '@/hooks/useDocuments';
import { DocumentGrid } from '@/components/documents/DocumentGrid';
import { AddDocumentDialog } from '@/components/documents/AddDocumentDialog';
import { EmptyDocumentsState } from '@/components/documents/EmptyDocumentsState';
import { CourseDocumentCard } from '@/components/documents/CourseDocumentCard';
import { ProcessingDocumentWrapper } from '@/components/documents/ProcessingDocumentWrapper';

export default function StudentDocuments() {
  const { role } = useParams<{ role: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: courseDocuments, isLoading: loadingCourseDocuments } = useUserDocuments();
  const { data: standaloneDocuments, isLoading: loadingStandaloneDocuments } = useDocuments();
  const { mutateAsync: deleteDocument } = useDocumentDelete();
  const { downloadFile, getSignedUrl } = useDownloadFile();
  const [displayName, setDisplayName] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setDisplayName(profileData.full_name || user.user_metadata?.full_name || profileData.email || user.email || 'Mon profil');
      }
    };

    loadProfile();
  }, [user]);

  // Group course documents by course
  const groupedDocuments = useMemo((): GroupedDocs[] => {
    if (!courseDocuments) return [];

    const filtered = courseDocuments.filter((doc) => {
      const query = searchQuery.toLowerCase();
      return (
        doc.file_name.toLowerCase().includes(query) ||
        doc.course_title.toLowerCase().includes(query) ||
        doc.course_subject.toLowerCase().includes(query)
      );
    });

    const grouped = filtered.reduce((acc, doc) => {
      const courseId = doc.course_id;
      if (!acc[courseId]) {
        acc[courseId] = {
          courseId,
          courseName: doc.course_title,
          subject: doc.course_subject,
          documents: [],
        };
      }
      acc[courseId].documents.push(doc);
      return acc;
    }, {} as Record<string, GroupedDocs>);

    return Object.values(grouped);
  }, [courseDocuments, searchQuery]);

  // Filter standalone documents
  const filteredStandaloneDocuments = useMemo(() => {
    if (!standaloneDocuments) return [];

    if (!searchQuery) return standaloneDocuments;

    const query = searchQuery.toLowerCase();
    return standaloneDocuments.filter((doc) =>
      doc.name.toLowerCase().includes(query) ||
      doc.subject.toLowerCase().includes(query)
    );
  }, [standaloneDocuments, searchQuery]);

  // Filter course documents (flattened for grid display)
  const filteredCourseDocuments = useMemo(() => {
    if (!courseDocuments) return [];

    if (!searchQuery) return courseDocuments;

    const query = searchQuery.toLowerCase();
    return courseDocuments.filter((doc) =>
      doc.file_name.toLowerCase().includes(query) ||
      doc.course_title.toLowerCase().includes(query) ||
      doc.course_subject.toLowerCase().includes(query)
    );
  }, [courseDocuments, searchQuery]);

  // Group all documents by subject (matière)
  const documentsBySubject = useMemo(() => {
    const grouped: Record<string, {
      standalone: Document[];
      courses: UserDocument[];
    }> = {};

    // Add standalone documents
    filteredStandaloneDocuments.forEach((doc) => {
      if (!grouped[doc.subject]) {
        grouped[doc.subject] = { standalone: [], courses: [] };
      }
      grouped[doc.subject].standalone.push(doc);
    });

    // Add course documents
    filteredCourseDocuments.forEach((doc) => {
      if (!grouped[doc.course_subject]) {
        grouped[doc.course_subject] = { standalone: [], courses: [] };
      }
      grouped[doc.course_subject].courses.push(doc);
    });

    return grouped;
  }, [filteredStandaloneDocuments, filteredCourseDocuments]);

  const subjects = Object.keys(documentsBySubject).sort();

  // Handlers for standalone documents
  const handleDelete = async (id: string) => {
    try {
      await deleteDocument(id);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleQuiz = (document: Document) => {
    navigate(`/${role || 'student'}/upload-course`, {
      state: {
        prefilledDocument: {
          file_path: document.file_path,
          file_name: document.name,
          subject: document.subject,
          document_id: document.id,
        },
        step: 'configuration',
      },
    });
  };

  const handleFiche = (document: Document) => {
    toast.info('La fonctionnalité Fiche de révision sera bientôt disponible');
  };

  const handleProfIA = (document: Document) => {
    toast.info('La fonctionnalité Professeur IA sera bientôt disponible');
  };

  // Handlers for course documents
  const handleCourseQuiz = async (document: UserDocument) => {
    // Check if the course has exercises
    const { data: exercises } = await supabase
      .from('exercises')
      .select('id')
      .eq('course_id', document.course_id)
      .limit(1);

    if (exercises && exercises.length > 0) {
      // Course has exercises, redirect to course detail page
      navigate(`/${role || 'student'}/courses/${document.course_id}`);
    } else {
      // No exercises yet, redirect to upload-course to generate them
      navigate(`/${role || 'student'}/upload-course`, {
        state: {
          prefilledDocument: {
            file_path: document.file_url,
            file_name: document.file_name,
            subject: document.course_subject,
            course_id: document.course_id,
          },
          step: 'configuration',
        },
      });
    }
  };

  const handleCourseFiche = (document: UserDocument) => {
    toast.info('La fonctionnalité Fiche de révision sera bientôt disponible');
  };

  const handleCourseProfIA = (document: UserDocument) => {
    // Redirect to virtual teacher with course conversation type
    // Using URL parameters as expected by ProfesseurParticulierVirtuel
    navigate(`/${role || 'student'}/professeur-particulier-virtuel?type=course&courseId=${document.course_id}`);
  };

  const handlePreview = async (url: string, fileName: string) => {
    // Check if URL is already a full URL (starts with http)
    if (url.startsWith('http')) {
      setPreviewFile({ url, name: fileName });
    } else {
      // If it's a storage path, get signed URL
      const signedUrl = await getSignedUrl(url, 'user-documents');
      if (signedUrl) {
        setPreviewFile({ url: signedUrl, name: fileName });
      } else {
        toast.error('Impossible d\'ouvrir le fichier');
      }
    }
  };

  const handleDownload = async (url: string, fileName: string) => {
    // Check if URL is already a full URL
    if (url.startsWith('http')) {
      // Direct download for full URLs
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
        toast.success('Téléchargement réussi');
      } catch (error) {
        console.error('Download error:', error);
        toast.error('Erreur lors du téléchargement');
      }
    } else {
      downloadFile(url, fileName, 'user-documents');
    }
  };

  const isLoading = loadingCourseDocuments || loadingStandaloneDocuments;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
          <div className="flex items-center space-x-2 md:space-x-4">
            <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
            <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{displayName || 'Mon profil'}</span>
          </div>
          <BurgerMenu />
        </header>

        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl pt-24 md:pt-28 pb-20 md:pb-0">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-full max-w-md" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        {isMobile && <BottomNav />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{displayName || 'Mon profil'}</span>
        </div>
        <BurgerMenu />
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl pt-24 md:pt-28 pb-20 md:pb-0">
        {/* Page Title with Upload Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <FolderOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Mes Documents</h1>
          </div>
          <Button onClick={() => setUploadDialogOpen(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document, cours ou matière..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Documents grouped by subject (matière) */}
        {subjects.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-12">
              <div className="mb-4 p-6 bg-gray-50 rounded-full inline-block">
                <Search className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Aucun document ne correspond à votre recherche "{searchQuery}"
              </p>
            </div>
          ) : (
            <EmptyDocumentsState onAdd={() => setUploadDialogOpen(true)} />
          )
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {subjects.map((subject) => {
              const { standalone, courses } = documentsBySubject[subject];
              const totalDocs = standalone.length + courses.length;

              return (
                <AccordionItem
                  key={subject}
                  value={subject}
                  className="border rounded-lg bg-white shadow-sm"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <FolderOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">{subject}</h3>
                          <p className="text-sm text-muted-foreground">
                            {totalDocs} document{totalDocs > 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="flex overflow-x-auto gap-4 pb-2">
                      {/* Standalone Documents */}
                      {standalone.map((document) => (
                        <ProcessingDocumentWrapper
                          key={document.id}
                          document={document}
                          onDelete={handleDelete}
                          onQuiz={handleQuiz}
                          onFiche={handleFiche}
                          onProfIA={handleProfIA}
                        />
                      ))}

                      {/* Course Documents */}
                      {courses.map((document) => (
                        <CourseDocumentCard
                          key={document.id}
                          document={document}
                          onPreview={handlePreview}
                          onDownload={handleDownload}
                          onQuiz={handleCourseQuiz}
                          onFiche={handleCourseFiche}
                          onProfIA={handleCourseProfIA}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
        </div>
      </div>

      {/* PDF Preview Dialog */}
      {previewFile && (
        <PDFPreviewDialog
          open={!!previewFile}
          onClose={() => setPreviewFile(null)}
          fileUrl={previewFile.url}
          fileName={previewFile.name}
          onDownload={() => handleDownload(previewFile.url, previewFile.name)}
        />
      )}

      {/* Add Document Dialog */}
      <AddDocumentDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>
    </div>
  );
}
