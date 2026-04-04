"use server";

import { z } from "zod";
import { polar } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getTeamForUser } from "@/lib/teams";

// --- Helpers ---

async function getAuthenticatedUserId(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

async function getAuthenticatedUserEmail(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;
  if (!email) throw new Error("Unauthorized");
  return email;
}

async function requireTeamOwner(teamId: string, userId: string): Promise<void> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();
  if (data?.role !== "owner") {
    throw new Error("Only the team owner can perform this action");
  }
}

// --- Action result types ---

export interface ActionResult {
  success: boolean;
  error?: string;
}

// --- Actions ---

const inviteMemberSchema = z.object({
  teamId: z.string().uuid(),
  email: z.string().email(),
});

export async function inviteMemberAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = inviteMemberSchema.safeParse({
      teamId: formData.get("teamId"),
      email: formData.get("email"),
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }
    const { teamId, email } = validation.data;

    await requireTeamOwner(teamId, userId);

    const teamInfo = await getTeamForUser(userId);
    if (!teamInfo?.polarSubscriptionId) {
      return {
        success: false,
        error: "Team billing is not set up. Complete checkout first.",
      };
    }

    // Check available seats via Polar
    const seatsList = await polar.customerSeats.listSeats({
      subscriptionId: teamInfo.polarSubscriptionId,
    });
    if (seatsList.availableSeats <= 0) {
      return {
        success: false,
        error: "No seats available. Add more seats first.",
      };
    }

    const supabase = createServiceClient();

    // Check if email already has a pending invitation for this team
    const { data: existingInvite } = await supabase
      .from("team_invitations")
      .select("id")
      .eq("team_id", teamId)
      .eq("email", email)
      .is("accepted_at", null)
      .is("declined_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();
    if (existingInvite) {
      return {
        success: false,
        error: "This email already has a pending invitation",
      };
    }

    // Check if user with this email is already on a team
    const { data: existingUser } = await supabase
      .from("team_members")
      .select("user_id, users:user_id(email)")
      .eq("users.email", email);
    if (existingUser && existingUser.length > 0) {
      return {
        success: false,
        error: "This user is already on a team",
      };
    }

    // Create invitation
    const { error: inviteError } = await supabase
      .from("team_invitations")
      .insert({ team_id: teamId, email, invited_by: userId });
    if (inviteError) {
      return { success: false, error: "Failed to create invitation" };
    }

    posthogNode?.capture({
      distinctId: userId,
      event: "team_member_invited",
      properties: { team_id: teamId, invited_email: email },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to invite member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to invite member",
    };
  }
}

const acceptInvitationSchema = z.object({
  token: z.string().min(1),
});

export async function acceptInvitationAction(
  token: string,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const userEmail = await getAuthenticatedUserEmail();

    const validation = acceptInvitationSchema.safeParse({ token });
    if (!validation.success) {
      return { success: false, error: "Invalid invitation token" };
    }

    const supabase = createServiceClient();

    // Fetch and validate invitation
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .select(
        "id, team_id, email, expires_at, accepted_at, teams(name, polar_subscription_id)",
      )
      .eq("token", token)
      .single();

    if (inviteError || !invitation) {
      return { success: false, error: "Invitation not found" };
    }
    if (invitation.accepted_at) {
      return { success: false, error: "Invitation already accepted" };
    }
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: "Invitation has expired" };
    }
    if (invitation.email !== userEmail) {
      return {
        success: false,
        error: "This invitation was sent to a different email address",
      };
    }

    // Check user is not already on a team
    const existingTeam = await getTeamForUser(userId);
    if (existingTeam) {
      return { success: false, error: "You are already on a team" };
    }

    const team = invitation.teams as unknown as {
      name: string;
      polar_subscription_id: string | null;
    };

    // Add member to team
    const { error: memberError } = await supabase
      .from("team_members")
      .insert({ team_id: invitation.team_id, user_id: userId, role: "member" });
    if (memberError) {
      return { success: false, error: "Failed to join team" };
    }

    // Assign Polar seat
    if (team.polar_subscription_id) {
      try {
        await polar.customerSeats.assignSeat({
          subscriptionId: team.polar_subscription_id,
          email: userEmail,
          immediateClaim: true,
        });
      } catch (error) {
        console.error("Failed to assign Polar seat:", error);
        // Don't fail the join — the seat can be assigned manually later
      }
    }

    // Mark invitation as accepted
    await supabase
      .from("team_invitations")
      .update({ accepted_at: new Date().toISOString() })
      .eq("id", invitation.id);

    posthogNode?.capture({
      distinctId: userId,
      event: "team_invitation_accepted",
      properties: { team_id: invitation.team_id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to accept invitation:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to accept invitation",
    };
  }
}

export async function declineInvitationAction(
  token: string,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const userEmail = await getAuthenticatedUserEmail();

    const supabase = createServiceClient();

    const { data: invitation } = await supabase
      .from("team_invitations")
      .select("id, email")
      .eq("token", token)
      .is("accepted_at", null)
      .is("declined_at", null)
      .single();

    if (!invitation || invitation.email !== userEmail) {
      return { success: false, error: "Invitation not found" };
    }

    await supabase
      .from("team_invitations")
      .update({ declined_at: new Date().toISOString() })
      .eq("id", invitation.id);

    posthogNode?.capture({
      distinctId: userId,
      event: "team_invitation_declined",
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to decline invitation:", error);
    return { success: false, error: "Failed to decline invitation" };
  }
}

const removeMemberSchema = z.object({
  teamId: z.string().uuid(),
  targetUserId: z.string().uuid(),
});

export async function removeMemberAction(
  teamId: string,
  targetUserId: string,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = removeMemberSchema.safeParse({ teamId, targetUserId });
    if (!validation.success) {
      return { success: false, error: "Invalid parameters" };
    }

    await requireTeamOwner(teamId, userId);

    if (targetUserId === userId) {
      return {
        success: false,
        error: "Cannot remove yourself. Transfer ownership first.",
      };
    }

    const supabase = createServiceClient();

    // Get team info for Polar seat revocation
    const teamInfo = await getTeamForUser(userId);

    // Find and revoke Polar seat if possible
    if (teamInfo?.polarSubscriptionId) {
      try {
        const seatsList = await polar.customerSeats.listSeats({
          subscriptionId: teamInfo.polarSubscriptionId,
        });
        // Find seat for this user by looking up their email
        const { data: targetUser } = await supabase
          .from("team_members")
          .select("user_id")
          .eq("team_id", teamId)
          .eq("user_id", targetUserId)
          .single();
        if (targetUser) {
          const { data: userData } =
            await createServiceClient().auth.admin.getUserById(targetUserId);
          const targetEmail = userData?.user?.email;
          if (targetEmail) {
            const seat = seatsList.seats.find(
              (s) => s.customerEmail === targetEmail && s.status === "claimed",
            );
            if (seat) {
              await polar.customerSeats.revokeSeat({ seatId: seat.id });
            }
          }
        }
      } catch (error) {
        console.error("Failed to revoke Polar seat:", error);
        // Continue with removal even if seat revocation fails
      }
    }

    // Remove member from team
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamId)
      .eq("user_id", targetUserId);
    if (deleteError) {
      return { success: false, error: "Failed to remove member" };
    }

    posthogNode?.capture({
      distinctId: userId,
      event: "team_member_removed",
      properties: { team_id: teamId, removed_user_id: targetUserId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to remove member:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}

export async function leaveTeamAction(): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();
    const userEmail = await getAuthenticatedUserEmail();

    const teamInfo = await getTeamForUser(userId);
    if (!teamInfo) {
      return { success: false, error: "You are not on a team" };
    }
    if (teamInfo.role === "owner") {
      return {
        success: false,
        error:
          "Team owners cannot leave. Transfer ownership or delete the team.",
      };
    }

    // Revoke Polar seat
    if (teamInfo.polarSubscriptionId) {
      try {
        const seatsList = await polar.customerSeats.listSeats({
          subscriptionId: teamInfo.polarSubscriptionId,
        });
        const seat = seatsList.seats.find(
          (s) => s.customerEmail === userEmail && s.status === "claimed",
        );
        if (seat) {
          await polar.customerSeats.revokeSeat({ seatId: seat.id });
        }
      } catch (error) {
        console.error("Failed to revoke Polar seat:", error);
      }
    }

    const supabase = createServiceClient();
    const { error: deleteError } = await supabase
      .from("team_members")
      .delete()
      .eq("team_id", teamInfo.id)
      .eq("user_id", userId);
    if (deleteError) {
      return { success: false, error: "Failed to leave team" };
    }

    posthogNode?.capture({
      distinctId: userId,
      event: "team_member_left",
      properties: { team_id: teamInfo.id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to leave team:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to leave team",
    };
  }
}

const addSeatsSchema = z.object({
  teamId: z.string().uuid(),
  additionalSeats: z.coerce.number().int().min(1).max(500),
});

export async function addSeatsAction(
  formData: FormData,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = addSeatsSchema.safeParse({
      teamId: formData.get("teamId"),
      additionalSeats: formData.get("additionalSeats"),
    });
    if (!validation.success) {
      return { success: false, error: validation.error.issues[0].message };
    }
    const { teamId, additionalSeats } = validation.data;

    await requireTeamOwner(teamId, userId);

    const teamInfo = await getTeamForUser(userId);
    if (!teamInfo?.polarSubscriptionId) {
      return { success: false, error: "Team billing is not set up" };
    }

    // Get current seat count
    const seatsList = await polar.customerSeats.listSeats({
      subscriptionId: teamInfo.polarSubscriptionId,
    });
    const newTotalSeats = seatsList.totalSeats + additionalSeats;

    // Update subscription seats
    await polar.subscriptions.update({
      id: teamInfo.polarSubscriptionId,
      subscriptionUpdate: {
        seats: newTotalSeats,
      },
    });

    posthogNode?.capture({
      distinctId: userId,
      event: "team_seats_added",
      properties: {
        team_id: teamId,
        additional_seats: additionalSeats,
        new_total: newTotalSeats,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to add seats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add seats",
    };
  }
}

const revokeInvitationSchema = z.object({
  invitationId: z.string().uuid(),
});

export async function revokeInvitationAction(
  invitationId: string,
): Promise<ActionResult> {
  try {
    const userId = await getAuthenticatedUserId();

    const validation = revokeInvitationSchema.safeParse({ invitationId });
    if (!validation.success) {
      return { success: false, error: "Invalid invitation ID" };
    }

    const supabase = createServiceClient();

    // Get invitation and verify ownership
    const { data: invitation } = await supabase
      .from("team_invitations")
      .select("id, team_id")
      .eq("id", invitationId)
      .is("accepted_at", null)
      .single();
    if (!invitation) {
      return { success: false, error: "Invitation not found" };
    }

    await requireTeamOwner(invitation.team_id, userId);

    await supabase.from("team_invitations").delete().eq("id", invitationId);

    posthogNode?.capture({
      distinctId: userId,
      event: "team_invitation_revoked",
      properties: { team_id: invitation.team_id },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to revoke invitation:", error);
    return { success: false, error: "Failed to revoke invitation" };
  }
}
