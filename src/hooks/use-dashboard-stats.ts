import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/SessionProvider";

export interface DailyCount {
  date: string;
  count: number;
}

export interface DashboardStats {
  totalGenerations: number;
  monthlyGenerations: number;
  dailyCounts: DailyCount[];
}

const DAYS_FOR_SPARKLINE = 14;

export function useDashboardStats() {
  const { user, supabase } = useSession();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) {
        return { totalGenerations: 0, monthlyGenerations: 0, dailyCounts: [] };
      }

      // Fetch total generations count (user's own generations only)
      const { count: totalGenerations, error: totalError } = await supabase
        .from("generations")
        .select("*, threads!inner(user_id)", { count: "exact", head: true })
        .eq("threads.user_id", user.id);

      if (totalError) {
        console.error("Failed to fetch total generations:", totalError);
        throw totalError;
      }

      // Fetch monthly generations count
      const startOfMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        1,
      );
      const { count: monthlyGenerations, error: monthlyError } = await supabase
        .from("generations")
        .select("*, threads!inner(user_id)", { count: "exact", head: true })
        .eq("threads.user_id", user.id)
        .gte("created_at", startOfMonth.toISOString());

      if (monthlyError) {
        console.error("Failed to fetch monthly generations:", monthlyError);
        throw monthlyError;
      }

      // Fetch daily counts for the last N days (for sparkline)
      // Use UTC consistently to avoid timezone mismatches
      const now = new Date();
      const startDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - DAYS_FOR_SPARKLINE + 1,
        ),
      );

      const { data: recentGenerations, error: recentError } = await supabase
        .from("generations")
        .select("created_at, threads!inner(user_id)")
        .eq("threads.user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true });

      if (recentError) {
        console.error("Failed to fetch recent generations:", recentError);
        throw recentError;
      }

      // Group by date
      const countsByDate = new Map<string, number>();
      for (const gen of recentGenerations || []) {
        const date = new Date(gen.created_at).toISOString().split("T")[0];
        countsByDate.set(date, (countsByDate.get(date) || 0) + 1);
      }

      // Build array for all days in range (including zeros)
      const dailyCounts: DailyCount[] = [];
      for (let i = 0; i < DAYS_FOR_SPARKLINE; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split("T")[0];
        dailyCounts.push({
          date: dateStr,
          count: countsByDate.get(dateStr) || 0,
        });
      }

      return {
        totalGenerations: totalGenerations ?? 0,
        monthlyGenerations: monthlyGenerations ?? 0,
        dailyCounts,
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}
