import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RevisionSheetGenerationOptions } from '@/types/revisionSheet';
import { updateCourseRevisionStatus } from '@/services/revisionSheetService';
import { incrementUsage } from '@/services/usageService';
import { toast } from 'sonner';

interface CreateRevisionSheetParams {
  courseId: string;
  options: RevisionSheetGenerationOptions;
}

export function useCreateRevisionSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, options }: CreateRevisionSheetParams) => {
      // Set status to generating
      await updateCourseRevisionStatus(courseId, 'generating');

      // Call Edge Function to generate revision sheet
      const { data, error } = await supabase.functions.invoke('generate-revision-sheet', {
        body: {
          courseId,
          options: {
            includeConcepts: options.includeConcepts,
            includeDefinitions: options.includeDefinitions,
            includeExamples: options.includeExamples,
            includeExercises: options.includeExercises,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Increment usage counter for fiches
      if (user?.id) {
        try {
          await incrementUsage(user.id, 'fiche', 1);
          console.log('✅ Fiche de révision comptabilisée dans l\'usage mensuel');
        } catch (error) {
          console.error('❌ Erreur lors de l\'incrémentation du compteur de fiches:', error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['revisionSheets'] });
      queryClient.invalidateQueries({ queryKey: ['coursesWithoutSheet'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-usage'] });
      toast.success('Fiche de révision créée avec succès !');
    },
    onError: (error: any) => {
      console.error('Error creating revision sheet:', error);
      toast.error('Erreur lors de la génération de la fiche de révision');
    },
  });
}
