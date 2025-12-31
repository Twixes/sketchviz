-- Storage RLS Policies for input-images and output-images buckets
-- These policies ensure authenticated users can upload to and read from their own folders only
-- File deletion is not permitted through RLS

-- Policy: Allow authenticated users to upload to their own folder in input-images
CREATE POLICY "Users can upload to their own folder in input-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'input-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read only their own files in input-images
CREATE POLICY "Users can read their own files in input-images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'input-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to upload to their own folder in output-images
CREATE POLICY "Users can upload to their own folder in output-images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'output-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to read only their own files in output-images
CREATE POLICY "Users can read their own files in output-images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'output-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
