import { useQuery } from "@tanstack/react-query";

interface CreditsResponse {
  credits: number | null;
}

async function fetchCredits(): Promise<number | null> {
  const response = await fetch("/api/credits");
  if (!response.ok) {
    throw new Error("Failed to fetch credits");
  }
  const data: CreditsResponse = await response.json();
  return data.credits;
}

export function useCreditsQuery(enabled: boolean) {
  return useQuery({
    queryKey: ["credits"],
    queryFn: fetchCredits,
    enabled,
    refetchOnWindowFocus: true,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
}
