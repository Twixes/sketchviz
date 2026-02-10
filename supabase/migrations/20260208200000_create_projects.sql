-- Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v7(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(255) NOT NULL DEFAULT '',
  style_notes text,  -- AI-extracted, nullable until style is accepted
  style_source_generation_id uuid REFERENCES public.generations(id) ON DELETE SET NULL,
  reference_image_urls jsonb DEFAULT '[]'::jsonb,  -- Up to 3 URLs
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add project_id to threads (nullable for standalone threads)
ALTER TABLE public.threads ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX projects_user_id_idx ON public.projects(user_id);
CREATE INDEX projects_created_at_idx ON public.projects(created_at DESC);
CREATE INDEX threads_project_id_idx ON public.threads(project_id);

-- Trigger for updated_at (reuses existing function from initial migration)
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: Owner-only (projects are private, unlike threads which are publicly viewable)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own projects"
  ON public.projects FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (user_id = auth.uid());
