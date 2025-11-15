-- Create the bucket for documents uploaded to generate revision sheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents_for_revision', 'documents_for_revision', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for documents_for_revision bucket
-- Policy: Anyone can view documents (public bucket)
CREATE POLICY "Documents for revision are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'documents_for_revision');

-- Policy: Users can upload their own documents
CREATE POLICY "Users can upload their own documents for revision"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents_for_revision'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own documents
CREATE POLICY "Users can update their own documents for revision"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents_for_revision'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own documents
CREATE POLICY "Users can delete their own documents for revision"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents_for_revision'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
