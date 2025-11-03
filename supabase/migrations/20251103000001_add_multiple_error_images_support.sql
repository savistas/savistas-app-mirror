-- Migration: Add support for multiple error images in error_single_revision
-- Change error_image_url from single TEXT to array of TEXT

-- Step 1: Add new column for multiple error image URLs
ALTER TABLE error_single_revision
ADD COLUMN error_image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing data (convert single error_image_url to array)
UPDATE error_single_revision
SET error_image_urls = ARRAY[error_image_url]
WHERE error_image_url IS NOT NULL;

-- Step 3: Make error_image_urls NOT NULL now that data is migrated
ALTER TABLE error_single_revision
ALTER COLUMN error_image_urls SET NOT NULL;

-- Step 4: Drop the old error_image_url column
ALTER TABLE error_single_revision
DROP COLUMN error_image_url;

-- Note: No index needed for error_image_urls as it's not commonly queried
