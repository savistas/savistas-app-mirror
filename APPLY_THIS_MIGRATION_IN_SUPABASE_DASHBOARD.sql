-- ⚠️ IMPORTANT: Exécutez ce script dans le SQL Editor de votre dashboard Supabase
-- Ce script refactorise la table error_single_revision pour supporter une erreur par row

-- Step 1: Add upload_session_id column to group errors from the same upload
ALTER TABLE error_single_revision
ADD COLUMN IF NOT EXISTS upload_session_id UUID;

-- Step 2: Add new error_image_url column (singular) for one error per row
ALTER TABLE error_single_revision
ADD COLUMN IF NOT EXISTS error_image_url TEXT;

-- Step 3: Migrate existing data
-- For rows with multiple images, we'll keep the first image and set a session ID
UPDATE error_single_revision
SET
  upload_session_id = COALESCE(upload_session_id, id),  -- Use the revision ID as session ID for existing data
  error_image_url = COALESCE(error_image_url, error_image_urls[1])  -- Take the first image
WHERE error_image_urls IS NOT NULL AND array_length(error_image_urls, 1) > 0;

-- Step 4: Make new columns NOT NULL now that data is migrated
ALTER TABLE error_single_revision
ALTER COLUMN upload_session_id SET NOT NULL;

ALTER TABLE error_single_revision
ALTER COLUMN error_image_url SET NOT NULL;

-- Step 5: Drop the old error_image_urls array column
ALTER TABLE error_single_revision
DROP COLUMN IF EXISTS error_image_urls;

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_session ON error_single_revision(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_error_revision_created_at ON error_single_revision(created_at DESC);

-- ✅ Migration terminée!
-- La table est maintenant configurée pour :
-- - Une row par erreur (error_image_url singulier)
-- - Groupement via upload_session_id
-- - Documents partagés via document_ids[]
-- - Statut individuel par erreur
