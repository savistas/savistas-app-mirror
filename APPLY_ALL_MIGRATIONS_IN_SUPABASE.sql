-- ========================================
-- FICHIER SQL COMPLET À EXÉCUTER DANS SUPABASE DASHBOARD
-- ========================================
-- Instructions:
-- 1. Ouvre ton dashboard Supabase
-- 2. Va dans "SQL Editor"
-- 3. Crée une nouvelle query
-- 4. Copie-colle TOUT ce fichier
-- 5. Exécute
-- ========================================

-- ========================================
-- PARTIE 1: MIGRATION DE LA TABLE error_single_revision
-- ========================================

-- Step 1: Add upload_session_id column to group errors from the same upload
ALTER TABLE error_single_revision
ADD COLUMN IF NOT EXISTS upload_session_id UUID;

-- Step 2: Add document_ids array column (pour plusieurs documents)
ALTER TABLE error_single_revision
ADD COLUMN IF NOT EXISTS document_ids UUID[];

-- Step 3: Migrate existing data from document_id to document_ids
-- Convert single document_id to array format
UPDATE error_single_revision
SET
  upload_session_id = COALESCE(upload_session_id, id),  -- Use the revision ID as session ID for existing data
  document_ids = COALESCE(document_ids, ARRAY[document_id])  -- Convert single ID to array
WHERE document_id IS NOT NULL;

-- Step 4: Set upload_session_id for any remaining NULL rows
UPDATE error_single_revision
SET upload_session_id = id
WHERE upload_session_id IS NULL;

-- Step 5: Set default empty array for document_ids if still NULL
UPDATE error_single_revision
SET document_ids = ARRAY[]::UUID[]
WHERE document_ids IS NULL;

-- Step 6: Make new columns NOT NULL now that data is migrated
ALTER TABLE error_single_revision
ALTER COLUMN upload_session_id SET NOT NULL;

ALTER TABLE error_single_revision
ALTER COLUMN document_ids SET NOT NULL;

-- Step 7: Drop the old document_id column (singular)
ALTER TABLE error_single_revision
DROP COLUMN IF EXISTS document_id;

-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_upload_session ON error_single_revision(upload_session_id);
CREATE INDEX IF NOT EXISTS idx_error_revision_created_at ON error_single_revision(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_revision_user_id ON error_single_revision(user_id);

-- ========================================
-- PARTIE 2: CRÉATION DU BUCKET error_revision (SI N'EXISTE PAS)
-- ========================================

-- Create the error_revision bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'error_revision',
  'error_revision',
  true,  -- Public bucket for sharing analysis results
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- PARTIE 3: RLS POLICIES POUR LE BUCKET error_revision
-- ========================================

-- Drop existing policies if they exist (pour éviter les conflits)
DROP POLICY IF EXISTS "Users can upload their own error images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own error images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for error_revision" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own error images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own error images" ON storage.objects;

-- Policy 1: Users can upload their own error images
CREATE POLICY "Users can upload their own error images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'error_revision'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own error images
CREATE POLICY "Users can view their own error images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'error_revision'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 3: Public read access for error_revision (pour N8N et partage)
CREATE POLICY "Public read access for error_revision"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'error_revision');

-- Policy 4: Users can update their own error images
CREATE POLICY "Users can update their own error images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'error_revision'
  AND (auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'error_revision'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Policy 5: Users can delete their own error images
CREATE POLICY "Users can delete their own error images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'error_revision'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- ========================================
-- PARTIE 4: VÉRIFICATION
-- ========================================

-- Vérifier que la table a été modifiée correctement
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'error_single_revision'
  AND column_name IN ('upload_session_id', 'error_image_url', 'document_ids', 'document_id')
ORDER BY column_name;

-- Vérifier que le bucket existe
SELECT id, name, public, file_size_limit
FROM storage.buckets
WHERE id = 'error_revision';

-- Vérifier que les policies ont été créées
SELECT
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%error%'
ORDER BY policyname;

-- ========================================
-- ✅ MIGRATION TERMINÉE!
-- ========================================
-- RÉSULTATS ATTENDUS:
--
-- Requête 1 (Colonnes): Tu devrais voir 3 colonnes
--   - document_ids (ARRAY, not null)
--   - error_image_url (text, not null)
--   - upload_session_id (uuid, not null)
--   ET PAS DE "document_id" (l'ancienne colonne)
--
-- Requête 2 (Bucket): Tu devrais voir le bucket "error_revision"
--
-- Requête 3 (Policies): Tu devrais voir 5 policies pour error_revision
--
-- Si tout est OK, l'upload devrait fonctionner! 🚀
-- ========================================
