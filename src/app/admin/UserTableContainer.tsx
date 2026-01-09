import { getCreditsForUser } from "@/lib/polar";
import { createServiceClient } from "@/lib/supabase/service";
import type { AdminUser } from "./actions";
import { Pagination } from "./Pagination";
import { UserTable } from "./UserTable";

interface UserTableContainerProps {
  page: number;
}

export async function UserTableContainer({ page }: UserTableContainerProps) {
  const limit = 100;
  const serviceClient = createServiceClient();

  // Calculate date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  // Fetch ALL users from Auth Admin API
  const allUsers: Array<{ id: string; email: string; created_at: string }> = [];
  let authPage = 1;
  const perPage = 1000;

  while (true) {
    const { data: listData, error: listError } =
      await serviceClient.auth.admin.listUsers({
        page: authPage,
        perPage,
      });

    if (listError) {
      console.error("Error fetching auth users:", listError);
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">Failed to fetch users</p>
        </div>
      );
    }

    for (const user of listData.users) {
      allUsers.push({
        id: user.id,
        email: user.email ?? "Unknown",
        created_at: user.created_at,
      });
    }

    if (listData.users.length < perPage) break;
    authPage++;
  }

  if (allUsers.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-black/20 bg-white/75 p-12 text-center">
        <p className="text-lg text-black/50">No users yet</p>
      </div>
    );
  }

  // Get generation counts from last 30 days per user
  const { data: recentGenerations, error: statsError } = await serviceClient
    .from("generations")
    .select("thread_id, created_at, threads!inner(user_id)")
    .gte("created_at", thirtyDaysAgoISO);

  if (statsError) {
    console.error("Error fetching generation stats:", statsError);
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="text-red-600">Failed to fetch generation stats</p>
      </div>
    );
  }

  // Aggregate generation counts by user_id
  const countsByUser = new Map<string, number>();
  for (const gen of recentGenerations ?? []) {
    const userId = (gen.threads as unknown as { user_id: string }).user_id;
    countsByUser.set(userId, (countsByUser.get(userId) ?? 0) + 1);
  }

  // Combine users with their generation counts and sort
  const usersWithCounts = allUsers
    .map((user) => ({
      ...user,
      generation_count: countsByUser.get(user.id) ?? 0,
    }))
    .sort((a, b) => b.generation_count - a.generation_count);

  // Paginate
  const totalCount = usersWithCounts.length;
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;
  const paginatedUsers = usersWithCounts.slice(offset, offset + limit);

  // Fetch credits for each user in parallel
  const usersWithCredits: AdminUser[] = await Promise.all(
    paginatedUsers.map(async (user) => {
      const credits = await getCreditsForUser(user.id);
      return {
        user_id: user.id,
        email: user.email,
        generation_count: user.generation_count,
        credits,
        created_at: user.created_at,
      };
    }),
  );

  return (
    <>
      <div className="text-sm text-black/60">
        {totalCount.toLocaleString()} user{totalCount !== 1 ? "s" : ""}
      </div>
      <UserTable users={usersWithCredits} />
      <Pagination page={page} totalPages={totalPages} />
    </>
  );
}
