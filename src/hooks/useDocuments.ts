import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '@/services/documentService';
import { DocumentFormData } from '@/types/document';
import { toast } from 'sonner';

/**
 * Hook to fetch all documents for the current user
 */
export function useDocuments() {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentService.getDocuments,
  });
}

/**
 * Hook to upload a new document
 */
export function useDocumentUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: DocumentFormData) =>
      documentService.uploadDocument(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      queryClient.invalidateQueries({ queryKey: ['user-courses'] });
      // Don't show toast here - it's handled in AddDocumentDialog
    },
    onError: (error: Error) => {
      console.error('Upload error:', error);
      // Don't show toast here - it's handled in AddDocumentDialog
    },
  });
}

/**
 * Hook to delete a document
 */
export function useDocumentDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) =>
      documentService.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document supprimé');
    },
    onError: (error: Error) => {
      console.error('Delete error:', error);
      toast.error('Erreur lors de la suppression');
    },
  });
}

/**
 * Hook to get unique subjects from courses and documents
 */
export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: documentService.getSubjects,
  });
}
