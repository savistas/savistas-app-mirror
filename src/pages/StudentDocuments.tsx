import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUserDocuments } from '@/hooks/useUserDocuments';
import { useDownloadFile } from '@/hooks/useDownloadFile';
import { DocumentsByCourse } from '@/components/documents/DocumentsByCourse';
import { EmptyDocuments } from '@/components/documents/EmptyDocuments';
import { PDFPreviewDialog } from '@/components/shared/PDFPreviewDialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, ArrowLeft, FolderOpen } from 'lucide-react';
import { DocumentsByCourse as GroupedDocs } from '@/types/document';
import { toast } from 'sonner';
import BurgerMenu from '@/components/BurgerMenu';
import BottomNav from '@/components/BottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export default function StudentDocuments() {
  const { role } = useParams<{ role: string }>();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { data: documents, isLoading } = useUserDocuments();
  const { downloadFile, getSignedUrl } = useDownloadFile();
  const [displayName, setDisplayName] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string } | null>(null);

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

  // Group documents by course
  const groupedDocuments = useMemo((): GroupedDocs[] => {
    if (!documents) return [];

    const filtered = documents.filter((doc) => {
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
  }, [documents, searchQuery]);

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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-3 md:p-4 bg-white/80 backdrop-blur-sm border-b border-slate-200/60 shadow-sm">
        <div className="flex items-center space-x-2 md:space-x-4">
          <img src="/logo-savistas.png" alt="Savistas Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain" />
          <span className="font-semibold text-slate-800 text-base md:text-lg tracking-tight">{displayName || 'Mon profil'}</span>
        </div>
        <BurgerMenu />
      </header>

      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-7xl pt-24 md:pt-28 pb-20 md:pb-0">
        {/* Page Title */}
        <div className="flex items-center gap-3">
          <FolderOpen className="h-8 w-8 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Mes Documents</h1>
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

        {/* Documents List */}
        {groupedDocuments.length === 0 ? (
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
            <EmptyDocuments />
          )
        ) : (
          <DocumentsByCourse
            groupedDocuments={groupedDocuments}
            onPreview={handlePreview}
            onDownload={handleDownload}
          />
        )}
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

      {/* Bottom Navigation */}
      <div className="relative z-50">
        <BottomNav />
      </div>
    </div>
  );
}
