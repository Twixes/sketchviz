import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify caller is on a team
  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("user_id", userId)
    .single();
  if (!membership) {
    return NextResponse.json({ error: "Not on a team" }, { status: 403 });
  }

  const url = new URL(request.url);
  const userIds = url.searchParams.getAll("userIds");
  if (userIds.length === 0) {
    return NextResponse.json([]);
  }

  // Verify all requested users are on the same team
  const serviceClient = createServiceClient();
  const { data: teamMembers } = await serviceClient
    .from("team_members")
    .select("user_id")
    .eq("team_id", membership.team_id)
    .in("user_id", userIds);

  const validUserIds = new Set(teamMembers?.map((m) => m.user_id) ?? []);

  // Fetch user details via admin API
  const users = await Promise.all(
    userIds
      .filter((id) => validUserIds.has(id))
      .map(async (uid) => {
        const { data: userData } =
          await serviceClient.auth.admin.getUserById(uid);
        return {
          id: uid,
          email: userData?.user?.email ?? "Unknown",
          full_name:
            (userData?.user?.user_metadata?.full_name as string | undefined) ??
            null,
        };
      }),
  );

  return NextResponse.json(users);
}
