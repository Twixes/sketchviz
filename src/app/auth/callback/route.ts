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
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    const userEmail = data?.claims?.email;
    const userMetadata = data?.claims?.user_metadata!;
    if (userId) {
      try {
        await polar.customers.getExternal({ externalId: userId });
      } catch (error) {
        if (error instanceof Error && error.name === "ResourceNotFound") {
          try {
            await polar.customers.create({
              externalId: userId,
              email: userEmail!,
              name: userMetadata.full_name!,
            });
            await polar.subscriptions.create({
              externalCustomerId: userId,
              productId: FREE_PLAN_PRODUCT_ID, // Free plan
            });
          } catch (error) {
            if (
              error instanceof Error &&
              error.name === "HTTPValidationError" &&
              error.message?.includes(
                "A customer with this email address already exists.",
              )
            ) {
              posthogNode?.captureException(error, userId);
              console.error(
                "A Polar customer with this email address already exists, skipping creation",
              );
            } else {
              throw error;
            }
          }
          posthogNode?.capture({
            distinctId: userId,
            event: "signed_up",
            properties: {
              $set: {
                email: userEmail,
                name: userMetadata.full_name!,
                first_name: extractFirstName(userMetadata.full_name!),
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
