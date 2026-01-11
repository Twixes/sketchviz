-- Add width and height columns to store output image dimensions
ALTER TABLE public.generations ADD COLUMN width integer;
ALTER TABLE public.generations ADD COLUMN height integer;
