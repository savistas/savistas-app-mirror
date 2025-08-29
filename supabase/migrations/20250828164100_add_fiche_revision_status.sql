-- Add column to track revision sheet generation status
ALTER TABLE courses 
ADD COLUMN fiche_revision_status VARCHAR(20) DEFAULT 'not_requested' CHECK (fiche_revision_status IN ('not_requested', 'generating', 'completed', 'failed'));

-- Add comment to explain the column
COMMENT ON COLUMN courses.fiche_revision_status IS 'Status of revision sheet generation: not_requested, generating, completed, failed';