import { supabase } from '@/integrations/supabase/client';
import { RevisionSheet, Course } from '@/types/revisionSheet';

/**
 * Fetch all revision sheets for a user
 */
export async function fetchRevisionSheets(userId: string): Promise<RevisionSheet[]> {
  console.log('📚 [fetchRevisionSheets] Fetching sheets for user:', userId);

  const { data, error } = await supabase
    .from('fiche_revision')
    .select(`
      course_id,
      file_name,
      file_url,
      created_at,
      user_id,
      courses(
        id,
        title,
        subject,
        user_id
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('❌ [fetchRevisionSheets] Error:', error);
    throw error;
  }

  console.log('✅ [fetchRevisionSheets] Found', data?.length || 0, 'revision sheets');
  console.log('📊 [fetchRevisionSheets] Data:', data);

  // Transform the data to match our interface
  return (data || []).map((item: any) => ({
    course_id: item.course_id,
    file_name: item.file_name,
    file_url: item.file_url,
    created_at: item.created_at,
    user_id: item.user_id,
    course: {
      id: item.courses.id,
      title: item.courses.title,
      subject: item.courses.subject,
      user_id: item.courses.user_id,
    }
  }));
}

/**
 * Fetch courses that don't have a revision sheet yet
 */
export async function fetchCoursesWithoutRevisionSheet(userId: string): Promise<Course[]> {
  // First, get courses with their fiche_revision status
  const { data, error } = await supabase
    .from('courses')
    .select('id, title, subject, course_content, fiche_revision_url, fiche_revision_status')
    .eq('user_id', userId)
    .is('fiche_revision_url', null)
    .order('title');

  if (error) {
    console.error('Error fetching courses without revision sheets:', error);
    throw error;
  }

  return data || [];
}

/**
 * Get a single revision sheet by course ID
 */
export async function fetchRevisionSheetByCourseId(courseId: string): Promise<RevisionSheet | null> {
  const { data, error } = await supabase
    .from('fiche_revision')
    .select(`
      course_id,
      file_name,
      file_url,
      created_at,
      user_id,
      courses(
        id,
        title,
        subject,
        user_id
      )
    `)
    .eq('course_id', courseId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null;
    }
    console.error('Error fetching revision sheet:', error);
    throw error;
  }

  if (!data) return null;

  return {
    course_id: data.course_id,
    file_name: data.file_name,
    file_url: data.file_url,
    created_at: data.created_at,
    user_id: data.user_id,
    course: {
      id: data.courses.id,
      title: data.courses.title,
      subject: data.courses.subject,
      user_id: data.courses.user_id,
    }
  };
}

/**
 * Delete a revision sheet
 */
export async function deleteRevisionSheet(courseId: string): Promise<void> {
  // Delete from fiche_revision table
  const { error: deleteError } = await supabase
    .from('fiche_revision')
    .delete()
    .eq('course_id', courseId);

  if (deleteError) {
    console.error('Error deleting revision sheet:', deleteError);
    throw deleteError;
  }

  // Update course status
  const { error: updateError } = await supabase
    .from('courses')
    .update({
      fiche_revision_url: null,
      fiche_revision_status: 'not_requested'
    })
    .eq('id', courseId);

  if (updateError) {
    console.error('Error updating course status:', updateError);
    throw updateError;
  }
}

/**
 * Get download URL for a revision sheet
 */
export async function getRevisionSheetDownloadUrl(filePathOrUrl: string): Promise<string> {
  // If it's already a full URL, return it directly
  if (filePathOrUrl.startsWith('http')) {
    return filePathOrUrl;
  }

  // Otherwise, create a signed URL from the path
  const { data, error } = await supabase.storage
    .from('pdf_revision')
    .createSignedUrl(filePathOrUrl, 3600); // 1 hour expiry

  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }

  return data.signedUrl;
}

/**
 * Update course fiche_revision_status
 */
export async function updateCourseRevisionStatus(
  courseId: string,
  status: 'not_requested' | 'generating' | 'completed' | 'failed'
): Promise<void> {
  const { error } = await supabase
    .from('courses')
    .update({ fiche_revision_status: status })
    .eq('id', courseId);

  if (error) {
    console.error('Error updating course revision status:', error);
    throw error;
  }
}

/**
 * Upload document and send to n8n webhook for revision sheet generation
 * n8n will handle course creation, document linking, and fiche generation
 */
export async function createCourseWithRevisionSheet({
  file,
  courseName,
  subject,
  options,
}: {
  file: File;
  courseName: string;
  subject: string;
  options: {
    includeConcepts: boolean;
    includeDefinitions: boolean;
    includeExamples: boolean;
    includeExercises: boolean;
  };
}): Promise<{ success: boolean }> {
  console.log('📚 [createCourseWithRevisionSheet] Starting file upload for revision sheet...');

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  try {
    // 1. Upload file to storage (bucket: documents_for_revision)
    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}_${file.name}`;
    const filePath = `${user.id}/fiche-revision/${fileName}`;

    console.log('📤 [createCourseWithRevisionSheet] Uploading file to storage (bucket: documents_for_revision):', filePath);

    const { error: uploadError } = await supabase.storage
      .from('documents_for_revision')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ [createCourseWithRevisionSheet] Upload error:', uploadError);
      throw uploadError;
    }

    console.log('✅ [createCourseWithRevisionSheet] File uploaded successfully to bucket "documents_for_revision"');

    // 2. Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('documents_for_revision')
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      throw new Error('Failed to get public URL for uploaded file');
    }

    console.log('🔗 [createCourseWithRevisionSheet] File public URL:', urlData.publicUrl);

    // 3. Call webhook for revision sheet generation
    console.log('🤖 [createCourseWithRevisionSheet] Calling fiche-revision-upload webhook...');

    const webhookUrl = 'https://n8n.srv932562.hstgr.cloud/webhook/fiche-revision-upload';

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user.id,
        user_file_upload: urlData.publicUrl, // L'URL publique du fichier uploadé
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        course_name: courseName,
        subject: subject,
        options: options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.statusText}`);
    }

    const webhookResponse = await response.json();
    console.log('✅ [createCourseWithRevisionSheet] Webhook response:', webhookResponse);

    return { success: true };
  } catch (error) {
    console.error('❌ [createCourseWithRevisionSheet] Error:', error);
    throw error;
  }
}
