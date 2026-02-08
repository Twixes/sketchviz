-- Add input_url to threads (nullable for backfill)
ALTER TABLE public.threads ADD COLUMN input_url varchar(2048);

-- Backfill from earliest generation per thread
UPDATE public.threads SET input_url = sub.input_url
FROM (
  SELECT DISTINCT ON (thread_id) thread_id, input_url
  FROM public.generations ORDER BY thread_id, created_at ASC
) sub
WHERE threads.id = sub.thread_id;

-- Make NOT NULL after backfill
ALTER TABLE public.threads ALTER COLUMN input_url SET NOT NULL;

-- Make generations.input_url nullable (deprecated)
ALTER TABLE public.generations ALTER COLUMN input_url DROP NOT NULL;
ALTER TABLE public.generations ALTER COLUMN input_url SET DEFAULT NULL;
