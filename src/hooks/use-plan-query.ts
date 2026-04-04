import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { PlanResponse } from "@/app/api/plan/types";
import { useSession } from "@/components/SessionProvider";

async function fetchPlan(): Promise<PlanResponse> {
  const response = await fetch("/api/plan");
  if (!response.ok) {
    throw new Error("Failed to fetch credits");
  }
  const data: PlanResponse = await response.json();
  return data;
}

export function usePlanQuery(): UseQueryResult<PlanResponse, Error> {
  const { user } = useSession();
  return useQuery({
    queryKey: ["plan"],
    queryFn: fetchPlan,
    refetchOnWindowFocus: true,
    staleTime: 300_000, // Consider data fresh for 5 minutes
    refetchInterval: (query) =>
      // Keep refetching if user is logged in. Fast poll while Polar provisioning is pending (null plan),
      // then slow poll (120s) just to sync with other devices
      !user ? false : query.state.data?.planType === null ? 500 : 120_000,
  });
}
