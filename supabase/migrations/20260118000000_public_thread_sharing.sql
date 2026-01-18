-- Make threads and generations publicly viewable by URL
-- Change UUID generation from v7 to v4 for maximum randomness (security through obscurity)

-- Change default UUID generation from v7 to v4 for threads
ALTER TABLE public.threads ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Change default UUID generation from v7 to v4 for generations
ALTER TABLE public.generations ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Drop existing owner-only SELECT policies
DROP POLICY IF EXISTS "Users can view their own threads" ON public.threads;
DROP POLICY IF EXISTS "Users can view generations from their own threads" ON public.generations;

-- Create public SELECT policies (security via UUIDv4 obscurity)
CREATE POLICY "Anyone can view threads"
  ON public.threads FOR SELECT USING (true);

CREATE POLICY "Anyone can view generations"
  ON public.generations FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE policies remain owner-only (unchanged)
