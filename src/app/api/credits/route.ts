import { NextResponse } from "next/server";
import { getCreditsForUser } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const credits = await getCreditsForUser(user.id);

  return NextResponse.json({ credits });
}
