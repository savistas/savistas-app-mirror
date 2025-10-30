import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CoursePollOptions {
  courseId: string | null;
  documentId?: string;
  enabled: boolean;
}

/**
 * Hook to poll for course_content population
 * Polls until course_content is populated by N8N
 */
export function useCoursePoll(options: CoursePollOptions) {
  const { courseId, documentId, enabled } = options;
  const { user } = useAuth();
  const [contentReady, setContentReady] = useState(false);
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    if (!enabled || !user || contentReady || !courseId) {
      return;
    }

    setIsPolling(true);

    const checkCourse = async () => {
      try {
        // Poll for course_content in the course
        const { data, error } = await supabase
          .from('courses')
          .select('id, title, course_content')
          .eq('id', courseId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking course content:', error);
          return;
        }

        if (data && data.course_content && data.course_content.trim().length > 0) {
          console.log('✅ Course content ready:', data);
          setContentReady(true);
          setIsPolling(false);
        }
      } catch (error) {
        console.error('Error in course polling:', error);
      }
    };

    // Initial check
    checkCourse();

    // Poll every 3 seconds
    const interval = setInterval(checkCourse, 3000);

    // Cleanup - stop after 2 minutes max
    const timeout = setTimeout(() => {
      console.warn('⏱️ Polling timeout reached for document:', documentId);
      setContentReady(true); // Consider it done after timeout
      setIsPolling(false);
      clearInterval(interval);
    }, 120000); // 2 minutes

    // Cleanup
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      setIsPolling(false);
    };
  }, [courseId, documentId, enabled, user, contentReady]);

  return { contentReady, isPolling };
}
