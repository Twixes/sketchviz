import { NextResponse } from "next/server";
import { getCreditsForUser, getPlanForUser } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
import type { PlanResponse } from "./types";

export async function GET(): Promise<
  NextResponse<PlanResponse | { error: string }>
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [credits, [planType]] = await Promise.all([
    getCreditsForUser(userId),
    getPlanForUser(userId),
  ]);

  return NextResponse.json({ credits, planType });
}
