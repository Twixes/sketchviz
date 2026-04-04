"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  acceptInvitationAction,
  declineInvitationAction,
} from "@/app/team/actions";
import { usePendingInvitationQuery } from "@/hooks/use-pending-invitation-query";
import { Button } from "@/lib/components/ui/Button";

export function TeamInvitationBanner() {
  const queryClient = useQueryClient();
  const { data: invitation } = usePendingInvitationQuery();

  const acceptMutation = useMutation({
    mutationFn: async (token: string) => {
      const result = await acceptInvitationAction(token);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitation"] });
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      queryClient.invalidateQueries({ queryKey: ["team"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async (token: string) => {
      const result = await declineInvitationAction(token);
      if (!result.success) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingInvitation"] });
    },
  });

  if (!invitation) return null;

  const isPending = acceptMutation.isPending || declineMutation.isPending;

  return (
    <div className="w-full rounded-lg border border-black/10 bg-white/80 px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-black">
          <strong>{invitation.teamName}</strong> has invited you to join their
          team.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isPending}
            onClick={() => declineMutation.mutate(invitation.token)}
          >
            Decline
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={acceptMutation.isPending}
            disabled={isPending}
            onClick={() => acceptMutation.mutate(invitation.token)}
          >
            Accept
          </Button>
        </div>
      </div>
      {(acceptMutation.error || declineMutation.error) && (
        <p className="mt-2 text-xs text-red-600">
          {acceptMutation.error?.message ?? declineMutation.error?.message}
        </p>
      )}
    </div>
  );
}
