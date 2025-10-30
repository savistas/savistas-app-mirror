import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteRevisionSheet } from '@/services/revisionSheetService';
import { toast } from 'sonner';

export function useDeleteRevisionSheet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => deleteRevisionSheet(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revisionSheets'] });
      queryClient.invalidateQueries({ queryKey: ['coursesWithoutSheet'] });
      toast.success('Fiche de révision supprimée');
    },
    onError: (error: any) => {
      console.error('Error deleting revision sheet:', error);
      toast.error('Erreur lors de la suppression de la fiche');
    },
  });
}
