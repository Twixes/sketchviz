import { useQuery } from "@tanstack/react-query";
import type { PendingInvitation } from "@/app/api/team/pending-invitation/route";
import { useSession } from "@/components/SessionProvider";

export function usePendingInvitationQuery() {
  const { user } = useSession();

  return useQuery({
    queryKey: ["pendingInvitation", user?.id],
    queryFn: async (): Promise<PendingInvitation | null> => {
      const res = await fetch("/api/team/pending-invitation");
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
