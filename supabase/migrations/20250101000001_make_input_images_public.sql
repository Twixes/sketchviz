-- Make input-images bucket public for uploads and reads
-- This allows anyone to upload and access input images without authentication
-- Output images remain private with user-specific paths

-- Drop existing policies for input-images bucket
DROP POLICY IF EXISTS "Users can upload to their own folder in input-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own files in input-images" ON storage.objects;

-- Policy: Allow anyone (authenticated or not) to upload to input-images
CREATE POLICY "Anyone can upload to input-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'input-images');

-- Policy: Allow anyone (authenticated or not) to read from input-images
CREATE POLICY "Anyone can read from input-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'input-images');
