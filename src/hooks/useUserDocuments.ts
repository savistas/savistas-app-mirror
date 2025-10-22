import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserDocument } from '@/types/document';
import { useAuth } from '@/contexts/AuthContext';

interface CourseWithFiles {
  id: string;
  title: string;
  subject: string;
  file_url: string; // JSON array of URLs
  created_at: string;
}

export const useUserDocuments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-documents', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('courses')
        .select('id, title, subject, file_url, created_at')
        .eq('user_id', user.id)
        .not('file_url', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform courses with multiple files into individual documents
      const documents: UserDocument[] = [];

      (data as CourseWithFiles[]).forEach((course) => {
        try {
          // Parse the JSON array of file URLs
          const fileUrls: string[] = JSON.parse(course.file_url);

          fileUrls.forEach((fileUrl, index) => {
            // Extract filename from URL
            const urlParts = fileUrl.split('/');
            const fileNameWithUUID = urlParts[urlParts.length - 1];
            // Remove UUID prefix (format: "uuid-filename.ext")
            const fileName = fileNameWithUUID.includes('-')
              ? fileNameWithUUID.split('-').slice(1).join('-')
              : fileNameWithUUID;

            // Detect file type from extension
            const fileType = fileName.split('.').pop()?.toLowerCase() || null;

            documents.push({
              id: `${course.id}-${index}`, // Unique ID combining course ID and file index
              course_id: course.id,
              course_title: course.title,
              course_subject: course.subject,
              file_name: decodeURIComponent(fileName),
              file_url: fileUrl,
              file_type: fileType,
              uploaded_at: course.created_at,
              created_at: course.created_at,
            });
          });
        } catch (e) {
          console.error('Error parsing file_url for course:', course.id, e);
        }
      });

      return documents;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
