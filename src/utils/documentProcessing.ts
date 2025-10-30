/**
 * Utility functions to track documents being processed by N8N
 */

export interface ProcessingDocumentInfo {
  documentId: string;
  documentName: string;
  courseId: string; // Always have a courseId now (created before upload)
  timestamp: number;
}

const STORAGE_KEY = 'processing_documents';
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get all currently processing documents
 */
export function getProcessingDocuments(): ProcessingDocumentInfo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const docs: ProcessingDocumentInfo[] = JSON.parse(stored);

    // Filter out old entries (older than MAX_AGE_MS)
    const now = Date.now();
    const recent = docs.filter(doc => (now - doc.timestamp) < MAX_AGE_MS);

    // Update storage with cleaned list
    if (recent.length !== docs.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
    }

    return recent;
  } catch (error) {
    console.error('Error getting processing documents:', error);
    return [];
  }
}

/**
 * Add a document to the processing list
 */
export function addProcessingDocument(info: Omit<ProcessingDocumentInfo, 'timestamp'>): void {
  try {
    const existing = getProcessingDocuments();
    const newDoc: ProcessingDocumentInfo = {
      ...info,
      timestamp: Date.now(),
    };

    // Add new document (avoid duplicates by ID)
    const filtered = existing.filter(d => d.documentId !== info.documentId);
    filtered.push(newDoc);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error adding processing document:', error);
  }
}

/**
 * Remove a document from the processing list
 */
export function removeProcessingDocument(documentId: string): void {
  try {
    const existing = getProcessingDocuments();
    const filtered = existing.filter(d => d.documentId !== documentId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing processing document:', error);
  }
}

/**
 * Check if a document is currently being processed
 */
export function isDocumentProcessing(documentId: string): boolean {
  const processing = getProcessingDocuments();
  return processing.some(d => d.documentId === documentId);
}

/**
 * Get processing info for a specific document
 */
export function getProcessingDocumentInfo(documentId: string): ProcessingDocumentInfo | null {
  const processing = getProcessingDocuments();
  return processing.find(d => d.documentId === documentId) || null;
}
