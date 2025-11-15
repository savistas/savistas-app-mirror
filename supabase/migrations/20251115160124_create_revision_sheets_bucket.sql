-- Create the bucket for generated revision sheets (fiches de révision)
INSERT INTO storage.buckets (id, name, public)
VALUES ('revision-sheets', 'revision-sheets', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for revision-sheets bucket
-- Policy: Anyone can view revision sheets (public bucket)
CREATE POLICY "Revision sheets are viewable by everyone"
ON storage.objects
FOR SELECT
USING (bucket_id = 'revision-sheets');

-- Policy: Service role can upload revision sheets (for Edge Functions)
CREATE POLICY "Service role can upload revision sheets"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'revision-sheets');

-- Policy: Service role can update revision sheets
CREATE POLICY "Service role can update revision sheets"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'revision-sheets');

-- Policy: Users can delete their own revision sheets
CREATE POLICY "Users can delete their own revision sheets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'revision-sheets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
