import { NextResponse } from "next/server";
import { FREE_PLAN_PRODUCT_ID, polar } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      try {
        await polar.customers.getExternal({ externalId: user.id });
      } catch (error) {
        if (error instanceof Error && error.name === "ResourceNotFound") {
          await polar.customers.create({
            externalId: user.id,
            email: user.email!,
            name: user.user_metadata.full_name,
          });
          await polar.subscriptions.create({
            externalCustomerId: user.id,
            productId: FREE_PLAN_PRODUCT_ID, // Free plan
          });
        } else {
          throw error;
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/auth/success`);
}
