-- Migration: Refactor error_single_revision to store one error per row
-- This allows separating multiple error images into individual entries

-- Step 1: Add upload_session_id column to group errors from the same upload
ALTER TABLE error_single_revision
ADD COLUMN upload_session_id UUID;

-- Step 2: Add new error_image_url column (singular) for one error per row
ALTER TABLE error_single_revision
ADD COLUMN error_image_url TEXT;

-- Step 3: Migrate existing data
-- For rows with multiple images, we'll keep the first image and set a session ID
UPDATE error_single_revision
SET
  upload_session_id = id,  -- Use the revision ID as session ID for existing data
  error_image_url = error_image_urls[1]  -- Take the first image
WHERE error_image_urls IS NOT NULL AND array_length(error_image_urls, 1) > 0;

-- Step 4: Make new columns NOT NULL now that data is migrated
ALTER TABLE error_single_revision
ALTER COLUMN upload_session_id SET NOT NULL;

ALTER TABLE error_single_revision
ALTER COLUMN error_image_url SET NOT NULL;

-- Step 5: Drop the old error_image_urls array column
ALTER TABLE error_single_revision
DROP COLUMN error_image_urls;

-- Step 6: Add index on upload_session_id for grouping queries
CREATE INDEX idx_upload_session ON error_single_revision(upload_session_id);

-- Step 7: Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_error_revision_created_at ON error_single_revision(created_at DESC);

-- Note: The new architecture allows:
-- - One row per error image
-- - Multiple rows can share the same upload_session_id
-- - Multiple rows can share the same document_ids array
-- - Each row has its own status (generating/completed/error)
