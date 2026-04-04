import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export interface PendingInvitation {
  token: string;
  teamName: string;
  expiresAt: string;
}

export async function GET() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const email = authData?.claims?.email as string | undefined;
  if (!email) {
    return NextResponse.json(null);
  }

  const { data: invitation } = await supabase
    .from("team_invitations")
    .select("token, expires_at, teams(name)")
    .eq("email", email)
    .is("accepted_at", null)
    .is("declined_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!invitation?.teams) {
    return NextResponse.json(null);
  }

  const team = invitation.teams as unknown as { name: string };
  const response: PendingInvitation = {
    token: invitation.token,
    teamName: team.name,
    expiresAt: invitation.expires_at,
  };
  return NextResponse.json(response);
}
