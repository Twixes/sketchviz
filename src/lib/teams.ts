import "server-only";

import { createServiceClient } from "./supabase/service";

export type TeamRole = "owner" | "member";

export interface BillingContextPersonal {
  type: "personal";
  billingEntityId: string;
}

export interface BillingContextTeam {
  type: "team";
  billingEntityId: string;
  teamId: string;
  teamName: string;
  role: TeamRole;
}

export type BillingContext = BillingContextPersonal | BillingContextTeam;

/**
 * Resolve billing context for a user. If the user is on a team, billing goes through
 * the team's Polar customer (using team.id as externalId). Otherwise, the user's own
 * Polar customer is used (using userId as externalId).
 */
export async function getBillingContext(
  userId: string,
): Promise<BillingContext> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("team_members")
    .select("role, teams(id, name)")
    .eq("user_id", userId)
    .single();

  if (error || !data?.teams) {
    return { type: "personal", billingEntityId: userId };
  }

  const team = data.teams as unknown as { id: string; name: string };
  return {
    type: "team",
    billingEntityId: team.id,
    teamId: team.id,
    teamName: team.name,
    role: data.role as TeamRole,
  };
}

export interface TeamInfo {
  id: string;
  name: string;
  ownerUserId: string;
  polarCustomerId: string | null;
  polarSubscriptionId: string | null;
  role: TeamRole;
}

/**
 * Get team info for a user, or null if they're not on a team.
 */
export async function getTeamForUser(userId: string): Promise<TeamInfo | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("team_members")
    .select(
      "role, teams(id, name, owner_user_id, polar_customer_id, polar_subscription_id)",
    )
    .eq("user_id", userId)
    .single();

  if (error || !data?.teams) {
    return null;
  }

  const team = data.teams as unknown as {
    id: string;
    name: string;
    owner_user_id: string;
    polar_customer_id: string | null;
    polar_subscription_id: string | null;
  };
  return {
    id: team.id,
    name: team.name,
    ownerUserId: team.owner_user_id,
    polarCustomerId: team.polar_customer_id,
    polarSubscriptionId: team.polar_subscription_id,
    role: data.role as TeamRole,
  };
}
