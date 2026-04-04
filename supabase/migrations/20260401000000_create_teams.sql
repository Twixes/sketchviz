-- Create teams table
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  polar_customer_id text,
  polar_subscription_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create team_members table
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)  -- One team per user (R9)
);

-- Create team_invitations table
CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (token)
);

-- Indexes
CREATE INDEX team_members_team_id_idx ON public.team_members(team_id);
CREATE INDEX team_members_user_id_idx ON public.team_members(user_id);
CREATE INDEX team_invitations_email_idx ON public.team_invitations(email);
CREATE INDEX team_invitations_token_idx ON public.team_invitations(token);
CREATE INDEX team_invitations_team_id_idx ON public.team_invitations(team_id);

-- Trigger for updated_at on teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SECURITY DEFINER helper to check team membership without recursive RLS
CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  );
$$;

-- SECURITY DEFINER helper to check team ownership
CREATE OR REPLACE FUNCTION is_team_owner(p_team_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = p_team_id AND user_id = auth.uid() AND role = 'owner'
  );
$$;

-- SECURITY DEFINER helper to get user's team ID
CREATE OR REPLACE FUNCTION get_user_team_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT team_id FROM public.team_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- RLS: teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team"
  ON public.teams FOR SELECT
  USING (is_team_member(id));

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Team owner can update team"
  ON public.teams FOR UPDATE
  USING (is_team_owner(id));

CREATE POLICY "Team owner can delete team"
  ON public.teams FOR DELETE
  USING (is_team_owner(id));

-- RLS: team_members
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their team members"
  ON public.team_members FOR SELECT
  USING (is_team_member(team_id));

CREATE POLICY "Team owner can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (is_team_owner(team_id) OR (user_id = auth.uid() AND role = 'owner'));

CREATE POLICY "Team owner can remove members"
  ON public.team_members FOR DELETE
  USING (is_team_owner(team_id) OR user_id = auth.uid());

-- RLS: team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view invitations"
  ON public.team_invitations FOR SELECT
  USING (is_team_member(team_id) OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Team owner can create invitations"
  ON public.team_invitations FOR INSERT
  WITH CHECK (is_team_owner(team_id));

CREATE POLICY "Invited user can update invitation (accept/decline)"
  ON public.team_invitations FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Team owner can delete invitations"
  ON public.team_invitations FOR DELETE
  USING (is_team_owner(team_id));
