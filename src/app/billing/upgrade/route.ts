import { NextResponse } from "next/server";
import { PRO_PLAN_PRODUCT_ID } from "@/lib/constants";
import { getPlanForUser, polar } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";

export async function GET(): Promise<
  NextResponse<unknown | { error: string }>
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [planType, subscriptionId] = await getPlanForUser(userId);

  if (planType === "pro") {
    return NextResponse.json(
      { error: "You already are on the Pro plan" },
      { status: 400 },
    );
  }

  const checkout = await polar.checkouts.create({
    products: [PRO_PLAN_PRODUCT_ID],
    subscriptionId: subscriptionId ?? undefined,
    successUrl: "https://sketchviz.app/billing/success",
  });

  return NextResponse.redirect(checkout.url);
}
