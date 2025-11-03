/**
 * Hook for creating error revisions
 * Handles the mutation logic for submitting manual error uploads
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { errorRevisionService } from '@/services/errorRevisionService';
import { ErrorRevisionFormData } from '@/types/errorRevision';
import { toast } from 'sonner';

export const useErrorRevision = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (formData: ErrorRevisionFormData) => {
      if (!user) throw new Error('User not authenticated');
      return errorRevisionService.submitErrorRevision(user.id, formData);
    },
    onSuccess: () => {
      // Invalider les queries pour rafraîchir les listes
      queryClient.invalidateQueries({ queryKey: ['error-revisions'] });
      toast.success('Erreur envoyée pour analyse !');
    },
    onError: (error) => {
      console.error('Error submitting revision:', error);
      toast.error("Erreur lors de l'envoi. Veuillez réessayer.");
    },
  });

  return {
    submitErrorRevision: mutation.mutate,
    submitErrorRevisionAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isSuccess: mutation.isSuccess,
    error: mutation.error,
  };
};
