import { useEffect, useState } from 'react';
import { Document } from '@/types/document';
import { StandaloneDocumentCard } from './StandaloneDocumentCard';
import { useCoursePoll } from '@/hooks/useCoursePoll';
import { getProcessingDocumentInfo, removeProcessingDocument } from '@/utils/documentProcessing';

interface ProcessingDocumentWrapperProps {
  document: Document;
  onDelete: (id: string) => Promise<void>;
  onQuiz: (document: Document) => void;
  onFiche: (document: Document) => void;
  onProfIA: (document: Document) => void;
}

/**
 * Wrapper component that handles polling for document processing
 * and displays loading state while N8N is creating course content
 */
export function ProcessingDocumentWrapper({
  document,
  onDelete,
  onQuiz,
  onFiche,
  onProfIA,
}: ProcessingDocumentWrapperProps) {
  const [processingInfo, setProcessingInfo] = useState(() => getProcessingDocumentInfo(document.id));

  // Re-check processing status on mount and when document changes
  useEffect(() => {
    const info = getProcessingDocumentInfo(document.id);
    setProcessingInfo(info);
  }, [document.id]);

  // Poll for course content
  const { contentReady } = useCoursePoll({
    courseId: processingInfo?.courseId ?? null,
    documentId: document.id,
    enabled: !!(processingInfo && processingInfo.courseId),
  });

  // Remove from processing list when ready
  useEffect(() => {
    if (contentReady && processingInfo) {
      removeProcessingDocument(document.id);
      setProcessingInfo(null);
    }
  }, [contentReady, processingInfo, document.id]);

  // Periodically check if document is still in processing list
  // (in case it was removed elsewhere)
  useEffect(() => {
    if (!processingInfo) return;

    const interval = setInterval(() => {
      const info = getProcessingDocumentInfo(document.id);
      if (!info) {
        setProcessingInfo(null);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [processingInfo, document.id]);

  return (
    <StandaloneDocumentCard
      document={document}
      onDelete={onDelete}
      onQuiz={onQuiz}
      onFiche={onFiche}
      onProfIA={onProfIA}
      isProcessing={!!processingInfo}
    />
  );
}
