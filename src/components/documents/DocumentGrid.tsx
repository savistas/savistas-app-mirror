import { Document } from '@/types/document';
import { StandaloneDocumentCard } from './StandaloneDocumentCard';

interface DocumentGridProps {
  documents: Document[];
  onDelete: (id: string) => Promise<void>;
  onQuiz: (document: Document) => void;
  onFiche: (document: Document) => void;
  onProfIA: (document: Document) => void;
}

export function DocumentGrid({
  documents,
  onDelete,
  onQuiz,
  onFiche,
  onProfIA,
}: DocumentGridProps) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      role="region"
      aria-label="Grille de documents"
    >
      {documents.map((document) => (
        <StandaloneDocumentCard
          key={document.id}
          document={document}
          onDelete={onDelete}
          onQuiz={onQuiz}
          onFiche={onFiche}
          onProfIA={onProfIA}
        />
      ))}
    </div>
  );
}
