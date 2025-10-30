import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, FolderOpen, Search, FileText } from 'lucide-react';
import { useRevisionSheets } from '@/hooks/revision-sheets/useRevisionSheets';
import { RevisionSheetCard } from '@/components/revision-sheets/RevisionSheetCard';
import { EmptyState } from '@/components/revision-sheets/EmptyState';
import { CreateSheetModal } from '@/components/revision-sheets/CreateSheetModal';
import { useNavigate } from 'react-router-dom';
import BurgerMenu from '@/components/BurgerMenu';
import BottomNav from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function RevisionSheets() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: sheets, isLoading, error } = useRevisionSheets();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [displayName, setDisplayName] = useState<string>('');

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

  const handleReviseWithAI = (courseId: string) => {
    // Redirect to virtual teacher with course conversation type
    navigate(`/student/professeur-particulier-virtuel?type=course&courseId=${courseId}`);
  };

  const handleCreateQuiz = async (courseId: string) => {
    // Check if the course has exercises
    const { data: exercises } = await supabase
      .from('exercises')
      .select('id')
      .eq('course_id', courseId)
      .limit(1);

    if (exercises && exercises.length > 0) {
      // Course has exercises, redirect to course detail page
      navigate(`/student/courses/${courseId}`);
    } else {
      // No exercises yet, redirect to upload-course to generate them
      navigate(`/student/upload-course`, {
        state: {
          prefilledCourse: {
            course_id: courseId,
          },
          step: 'configuration',
        },
      });
    }
  };

  // Filter sheets based on search query
  const filteredSheets = useMemo(() => {
    if (!sheets) return [];

    if (!searchQuery) return sheets;

    const query = searchQuery.toLowerCase();
    return sheets.filter((sheet) =>
      sheet.course.title.toLowerCase().includes(query) ||
      sheet.course.subject.toLowerCase().includes(query) ||
      (sheet.file_name && sheet.file_name.toLowerCase().includes(query))
    );
  }, [sheets, searchQuery]);

  // Group sheets by subject
  const sheetsBySubject = useMemo(() => {
    const grouped: Record<string, typeof filteredSheets> = {};

    filteredSheets.forEach((sheet) => {
      const subject = sheet.course.subject;
      if (!grouped[subject]) {
        grouped[subject] = [];
      }
      grouped[subject].push(sheet);
    });

    return grouped;
  }, [filteredSheets]);

  const subjects = Object.keys(sheetsBySubject).sort();

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
    <div className="min-h-screen bg-background">
      {/* Fixed Header avec logo et BurgerMenu */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{displayName || 'Mon profil'}</span>
        </div>
        <BurgerMenu />
      </header>

      {/* Main Content avec padding pour le header fixe et bottom nav */}
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl pt-24 md:pt-28 pb-20 md:pb-0">
        {/* Page Title with Create Button */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold">Mes Fiches de Révision</h1>
          </div>
          {sheets && sheets.length > 0 && (
            <Button onClick={() => setCreateModalOpen(true)} size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Créer une fiche
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une fiche ou matière..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Content */}
        {error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-red-600 mb-4">Erreur lors du chargement des fiches</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Réessayer
            </Button>
          </div>
        ) : subjects.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-12">
              <div className="mb-4 p-6 bg-gray-50 rounded-full inline-block">
                <Search className="w-16 h-16 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground">
                Aucune fiche ne correspond à votre recherche "{searchQuery}"
              </p>
            </div>
          ) : (
            <EmptyState onCreateSheet={() => setCreateModalOpen(true)} />
          )
        ) : (
          <Accordion type="multiple" className="w-full space-y-4">
            {subjects.map((subject) => {
              const subjectSheets = sheetsBySubject[subject];
              const totalSheets = subjectSheets.length;

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
                            {totalSheets} fiche{totalSheets > 1 ? 's' : ''} de révision
                          </p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="flex overflow-x-auto gap-4 pb-2">
                      {subjectSheets.map((sheet) => (
                        <RevisionSheetCard
                          key={sheet.course_id}
                          sheet={sheet}
                          onReviseWithAI={() => handleReviseWithAI(sheet.course_id)}
                          onCreateQuiz={() => handleCreateQuiz(sheet.course_id)}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}

        {/* Modals */}
        <CreateSheetModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      </div>

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>
    </div>
  );
}
