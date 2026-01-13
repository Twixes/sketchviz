import { NextResponse } from "next/server";
import { FREE_PLAN_PRODUCT_ID } from "@/lib/constants";
import { extractFirstName } from "@/lib/language-utils";
import { polar } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  let isSignup = false;

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
          posthogNode.capture({
            distinctId: user.id,
            event: "signed_up",
            properties: {
              $set: {
                email: user.email,
                name: user.user_metadata.full_name,
                first_name: extractFirstName(user.user_metadata.full_name),
              },
            },
          });
          isSignup = true;
        } else {
          throw error;
        }
      }
    }
  }

  // URL to redirect to after auth completes
  // If a redirect param was passed, go there; otherwise go to /auth/success (for popup flow)
  const redirectPath = requestUrl.searchParams.get("redirect");
  const redirectUrl = new URL(
    isValidRedirectPath(redirectPath)
      ? `${origin}${redirectPath}`
      : `${origin}/auth/success`,
  );
  if (isSignup) {
    redirectUrl.searchParams.set("signup", "true");
  }
  return NextResponse.redirect(redirectUrl);
}

/**
 * Validates that a redirect path is safe (same-origin, no open redirect).
 */
function isValidRedirectPath(path: string | null): path is string {
  if (!path) return false;
  // Must start with exactly one slash (prevents protocol-relative URLs like //evil.com)
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Block path traversal
  if (path.includes("..")) return false;
  return true;
}
