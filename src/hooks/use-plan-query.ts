import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import type { PlanResponse } from "@/app/api/plan/types";

async function fetchPlan(): Promise<PlanResponse> {
  const response = await fetch("/api/plan");
  if (!response.ok) {
    throw new Error("Failed to fetch credits");
  }
  const data: PlanResponse = await response.json();
  return data;
}

export function usePlanQuery(): UseQueryResult<PlanResponse, Error> {
  return useQuery({
    queryKey: ["plan"],
    queryFn: fetchPlan,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
    // Keep refetching while planType is null (Polar still processing signup)
    refetchInterval: (query) =>
      query.state.data?.planType === null ? 2000 : false,
  });
}
