import { NextResponse } from "next/server";
import { polar } from "@/lib/polar";
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
        if ("name" in error && error.name === "ResourceNotFound") {
          console.log("Customer not found, creating...");

          await polar.customers.create({
            externalId: user.id,
            email: user.email!,
            name: user.user_metadata.full_name,
          });
          await polar.subscriptions.create({
            externalCustomerId: user.id,
            productId: "d603bffa-78e5-468c-bce6-b909577073dc", // Free plan
          });
        }
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/auth/success`);
}
