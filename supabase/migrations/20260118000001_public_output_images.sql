-- Make output-images bucket publicly readable for shared thread viewing
-- Upload policy remains user-folder restricted (only authenticated users can upload to their own folder)

-- Set buckets to public (allows unauthenticated access)
UPDATE storage.buckets SET public = true WHERE id = 'input-images';
UPDATE storage.buckets SET public = true WHERE id = 'output-images';

-- Drop owner-only read policy
DROP POLICY IF EXISTS "Users can read their own files in output-images" ON storage.objects;

-- Allow anyone to read output images
CREATE POLICY "Anyone can read from output-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'output-images');

-- Upload policy "Users can upload to their own folder in output-images" remains unchanged
