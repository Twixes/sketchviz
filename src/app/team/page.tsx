"use client";

import { Cross2Icon, ExitIcon, PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { InviteMemberDialog } from "@/components/InviteMemberDialog";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import {
  type TeamMemberData,
  TeamMemberList,
} from "@/components/TeamMemberList";
import { TeamSeatUsage } from "@/components/TeamSeatUsage";
import { Button } from "@/lib/components/ui/Button";
import {
  addSeatsAction,
  inviteMemberAction,
  leaveTeamAction,
  removeMemberAction,
  revokeInvitationAction,
} from "./actions";

// --- Data fetching ---

interface TeamPageData {
  team: {
    id: string;
    name: string;
    owner_user_id: string;
    polar_subscription_id: string | null;
  } | null;
  members: TeamMemberData[];
  pendingInvitations: Array<{
    id: string;
    email: string;
    created_at: string;
    expires_at: string;
  }>;
  seats: { available: number; total: number; used: number } | null;
  role: "owner" | "member" | null;
}

function useTeamQuery() {
  const { user, supabase } = useSession();

  return useQuery({
    queryKey: ["team", user?.id],
    queryFn: async (): Promise<TeamPageData> => {
      if (!user) {
        return {
          team: null,
          members: [],
          pendingInvitations: [],
          seats: null,
          role: null,
        };
      }

      // Get user's team membership
      const { data: membership } = await supabase
        .from("team_members")
        .select("team_id, role")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        return {
          team: null,
          members: [],
          pendingInvitations: [],
          seats: null,
          role: null,
        };
      }

      // Fetch team, members, and invitations in parallel
      const [teamResult, membersResult, invitationsResult] = await Promise.all([
        supabase
          .from("teams")
          .select("id, name, owner_user_id, polar_subscription_id")
          .eq("id", membership.team_id)
          .single(),
        supabase
          .from("team_members")
          .select("user_id, role")
          .eq("team_id", membership.team_id)
          .order("created_at", { ascending: true }),
        membership.role === "owner"
          ? supabase
              .from("team_invitations")
              .select("id, email, created_at, expires_at")
              .eq("team_id", membership.team_id)
              .is("accepted_at", null)
              .is("declined_at", null)
              .gt("expires_at", new Date().toISOString())
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as never[], error: null }),
      ]);

      const team = teamResult.data;
      const rawMembers = membersResult.data ?? [];

      // Fetch seat info via API if team has a subscription
      let seats: TeamPageData["seats"] = null;
      if (team?.polar_subscription_id) {
        try {
          const res = await fetch(
            `/api/team/seats?subscriptionId=${team.polar_subscription_id}`,
          );
          if (res.ok) {
            seats = await res.json();
          }
        } catch {
          // Seats info is nice-to-have, not critical
        }
      }

      // We need user emails for display — fetch from an API endpoint
      let memberDetails: TeamMemberData[] = [];
      if (rawMembers.length > 0) {
        try {
          const res = await fetch(
            `/api/team/members?${rawMembers.map((m) => `userIds=${m.user_id}`).join("&")}`,
          );
          if (res.ok) {
            const userData: Array<{
              id: string;
              email: string;
              full_name: string | null;
            }> = await res.json();
            memberDetails = rawMembers.map((m) => {
              const u = userData.find((u) => u.id === m.user_id);
              return {
                userId: m.user_id,
                email: u?.email ?? "Unknown",
                fullName: u?.full_name ?? null,
                role: m.role as "owner" | "member",
              };
            });
          }
        } catch {
          memberDetails = rawMembers.map((m) => ({
            userId: m.user_id,
            email: "Unknown",
            fullName: null,
            role: m.role as "owner" | "member",
          }));
        }
      }

      return {
        team,
        members: memberDetails,
        pendingInvitations: invitationsResult.data ?? [],
        seats,
        role: membership.role as "owner" | "member",
      };
    },
    enabled: !!user,
  });
}

// --- Page component ---

export default function TeamPage() {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const { data, isLoading } = useTeamQuery();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string>();

  const invalidateTeam = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["team"] });
    queryClient.invalidateQueries({ queryKey: ["plan"] });
  }, [queryClient]);

  // --- Mutations ---

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!data?.team) throw new Error("No team");
      const formData = new FormData();
      formData.set("teamId", data.team.id);
      formData.set("email", email);
      const result = await inviteMemberAction(formData);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      setInviteDialogOpen(false);
      setInviteError(undefined);
      invalidateTeam();
    },
    onError: (error) => {
      setInviteError(error.message);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!data?.team) throw new Error("No team");
      const result = await removeMemberAction(data.team.id, targetUserId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: invalidateTeam,
  });

  const leaveTeamMutation = useMutation({
    mutationFn: async () => {
      const result = await leaveTeamAction();
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: invalidateTeam,
  });

  const revokeInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await revokeInvitationAction(invitationId);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: invalidateTeam,
  });

  const addSeatsMutation = useMutation({
    mutationFn: async (additionalSeats: number) => {
      if (!data?.team) throw new Error("No team");
      const formData = new FormData();
      formData.set("teamId", data.team.id);
      formData.set("additionalSeats", String(additionalSeats));
      const result = await addSeatsAction(formData);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: invalidateTeam,
  });

  if (!user) {
    return (
      <PageWrapper user={null} title="Team">
        <p className="text-black/60">Sign in to manage your team.</p>
      </PageWrapper>
    );
  }

  if (isLoading) {
    return (
      <PageWrapper user={user} title="Team">
        <div className="text-black/50">Loading...</div>
      </PageWrapper>
    );
  }

  // --- No team ---
  if (!data?.team) {
    return (
      <PageWrapper user={user} title="Team">
        <p className="text-black/60">
          You're not part of a team yet. If your organization has a team
          account, ask an admin to send you an invitation.
        </p>
      </PageWrapper>
    );
  }

  const isOwner = data.role === "owner";

  // --- Team view ---
  return (
    <PageWrapper user={user} title={data.team.name}>
      <div className="flex flex-col gap-8">
        {/* Seat usage */}
        {data.seats && (
          <TeamSeatUsage
            usedSeats={data.seats.used}
            totalSeats={data.seats.total}
          />
        )}

        {/* Members */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Members</h2>
            {isOwner && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<PlusIcon className="size-4" />}
                onClick={() => {
                  setInviteError(undefined);
                  setInviteDialogOpen(true);
                }}
              >
                Invite
              </Button>
            )}
          </div>
          <TeamMemberList
            members={data.members}
            isOwner={isOwner}
            currentUserId={user.id}
            onRemoveMember={(userId) => removeMemberMutation.mutate(userId)}
            isRemoving={removeMemberMutation.isPending}
          />
        </section>

        {/* Pending invitations (owner only) */}
        {isOwner && data.pendingInvitations.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold text-black">
              Pending invitations
            </h2>
            <div className="divide-y divide-black/10 rounded-lg border border-black/10">
              {data.pendingInvitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-black">{invite.email}</span>
                    <span className="text-xs text-black/50">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="icon"
                    size="sm"
                    colorScheme="light"
                    tooltip="Revoke invitation"
                    disabled={revokeInvitationMutation.isPending}
                    onClick={() => revokeInvitationMutation.mutate(invite.id)}
                  >
                    <Cross2Icon className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {isOwner && data.seats && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const seats = prompt("How many seats to add?");
                if (seats && Number.parseInt(seats, 10) > 0) {
                  addSeatsMutation.mutate(Number.parseInt(seats, 10));
                }
              }}
              loading={addSeatsMutation.isPending}
            >
              Add seats
            </Button>
          )}
          {!isOwner && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ExitIcon className="size-4" />}
              onClick={() => {
                if (confirm("Are you sure you want to leave this team?")) {
                  leaveTeamMutation.mutate();
                }
              }}
              loading={leaveTeamMutation.isPending}
            >
              Leave team
            </Button>
          )}
        </div>

        {/* Error display */}
        {(removeMemberMutation.error ||
          leaveTeamMutation.error ||
          addSeatsMutation.error) && (
          <p className="text-sm text-red-600">
            {removeMemberMutation.error?.message ??
              leaveTeamMutation.error?.message ??
              addSeatsMutation.error?.message}
          </p>
        )}
      </div>

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onInvite={(email) => inviteMutation.mutate(email)}
        isPending={inviteMutation.isPending}
        error={inviteError}
      />
    </PageWrapper>
  );
}
