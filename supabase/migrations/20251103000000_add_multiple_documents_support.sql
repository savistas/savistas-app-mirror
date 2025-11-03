-- Migration: Add support for multiple course documents in error_single_revision
-- Change document_id from single UUID to array of UUIDs

-- Step 1: Add new column for multiple document IDs
ALTER TABLE error_single_revision
ADD COLUMN document_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Step 2: Migrate existing data (convert single document_id to array)
UPDATE error_single_revision
SET document_ids = ARRAY[document_id]
WHERE document_id IS NOT NULL;

-- Step 3: Make document_ids NOT NULL now that data is migrated
ALTER TABLE error_single_revision
ALTER COLUMN document_ids SET NOT NULL;

-- Step 4: Drop the old document_id column
ALTER TABLE error_single_revision
DROP COLUMN document_id;

-- Step 5: Update index to use the new column
DROP INDEX IF EXISTS idx_error_single_revision_document;
CREATE INDEX idx_error_single_revision_documents ON error_single_revision USING GIN(document_ids);

-- Note: The foreign key constraint is removed since we're using an array
-- The application layer will need to ensure document IDs are valid
