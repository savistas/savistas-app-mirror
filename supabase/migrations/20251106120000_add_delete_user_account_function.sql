-- Create function to delete all user data (called before deleting auth user)
-- This function deletes all user-related data in the correct order to respect foreign key constraints

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_id uuid;
  deleted_count json;
BEGIN
  -- Get the current user ID from auth context
  current_user_id := auth.uid();

  -- Security check: ensure user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Start building the result
  deleted_count := json_build_object();

  -- Delete in order to respect foreign key constraints
  -- Start with the most dependent tables (leaves) and work up to roots

  -- Delete error tracking data
  DELETE FROM public.error_single_revision WHERE user_id = current_user_id;
  DELETE FROM public.error_responses WHERE user_id = current_user_id;

  -- Delete exercise and quiz data (exercise_responses depends on exercises)
  DELETE FROM public.exercise_responses WHERE user_id = current_user_id;
  DELETE FROM public.exercises WHERE user_id = current_user_id;

  -- Delete documents and revision sheets
  DELETE FROM public.user_documents WHERE user_id = current_user_id;
  DELETE FROM public.documents WHERE user_id = current_user_id;
  DELETE FROM public.fiche_revision WHERE user_id = current_user_id;

  -- Delete courses (this will cascade to related data)
  DELETE FROM public.courses WHERE user_id = current_user_id;

  -- Delete AI teacher data
  DELETE FROM public.ai_teacher_conversations WHERE user_id = current_user_id;
  DELETE FROM public.ai_teacher_agent_configs WHERE user_id = current_user_id;

  -- Delete conversations and messages
  DELETE FROM public.conversations WHERE user_id = current_user_id;

  -- Delete learning styles and questionnaire responses
  DELETE FROM public.styles_apprentissage WHERE user_id = current_user_id;
  DELETE FROM public.troubles_detection_scores WHERE user_id = current_user_id;
  DELETE FROM public.troubles_questionnaire_reponses WHERE user_id = current_user_id;
  DELETE FROM public.profiles_infos WHERE user_id = current_user_id;

  -- Delete user activity tracking
  DELETE FROM public.user_activities WHERE user_id = current_user_id;
  DELETE FROM public.user_progress_snapshots WHERE user_id = current_user_id;

  -- Delete organization-related data
  DELETE FROM public.organization_monthly_usage WHERE user_id = current_user_id;
  DELETE FROM public.organization_members WHERE user_id = current_user_id;

  -- Delete organizations where user is the creator (this will cascade to related data)
  DELETE FROM public.organizations WHERE created_by = current_user_id;

  -- Delete organization requests
  DELETE FROM public.organization_requests WHERE created_by = current_user_id;

  -- Delete monthly usage data
  DELETE FROM public.monthly_usage WHERE user_id = current_user_id;

  -- Delete subscription data
  DELETE FROM public.user_subscriptions WHERE user_id = current_user_id;

  -- Delete emails registry (by email, not user_id directly)
  DELETE FROM public.emails_registry
  WHERE email IN (SELECT email FROM public.profiles WHERE user_id = current_user_id);

  -- Finally, delete the profile (this should be last as other tables may reference it)
  DELETE FROM public.profiles WHERE user_id = current_user_id;

  -- Return success with user ID
  RETURN json_build_object(
    'success', true,
    'user_id', current_user_id,
    'message', 'All user data deleted successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Log the error and re-raise
    RAISE EXCEPTION 'Error deleting user data: %', SQLERRM;
END;
$$;

-- Grant execute permission to authenticated users (they can only delete their own data due to auth.uid() check)
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.delete_user_account() IS 'Deletes all data associated with the currently authenticated user. This function is called before deleting the auth user via the delete-account Edge Function.';
