import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { FREE_PLAN_PRODUCT_ID } from "@/lib/constants";
import { extractFirstName } from "@/lib/language-utils";
import { polar } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures a Polar customer exists for the given user. Creates one with the Free plan if not found.
 * Returns true if the user was newly created (signup).
 */
async function ensurePolarCustomer(
  userId: string,
  email: string,
  fullName?: string,
): Promise<boolean> {
  try {
    await polar.customers.getExternal({ externalId: userId });
    return false;
  } catch (error) {
    if (error instanceof Error && error.name === "ResourceNotFound") {
      try {
        await polar.customers.create({
          externalId: userId,
          email,
          name: fullName ?? email,
        });
        await polar.subscriptions.create({
          externalCustomerId: userId,
          productId: FREE_PLAN_PRODUCT_ID,
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
          return false;
        }
        throw error;
      }
      posthogNode?.capture({
        distinctId: userId,
        event: "signed_up",
        properties: {
          $set: {
            email,
            name: fullName ?? email,
            first_name: fullName ? extractFirstName(fullName) : undefined,
          },
        },
      });
      return true;
    }
    throw error;
  }
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const origin = requestUrl.origin;
  let isSignup = false;

  const supabase = await createClient();

  if (code) {
    // OAuth flow (Google)
    await supabase.auth.exchangeCodeForSession(code);
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;
    const userEmail = data?.claims?.email as string | undefined;
    const userMetadata = data?.claims?.user_metadata as
      | Record<string, string>
      | undefined;
    if (userId && userEmail) {
      isSignup = await ensurePolarCustomer(
        userId,
        userEmail,
        userMetadata?.full_name,
      );
    }
  } else if (tokenHash && type) {
    // Email verification or password reset flow
    const { error, data } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      // Redirect to sign-in with error
      return NextResponse.redirect(
        `${origin}/auth/signin?error=${encodeURIComponent(error.message)}`,
      );
    }

    if (type === "signup" || type === "email") {
      // Email verification — ensure Polar customer exists
      const userId = data.user?.id;
      const userEmail = data.user?.email;
      const fullName = data.user?.user_metadata?.full_name as
        | string
        | undefined;
      if (userId && userEmail) {
        isSignup = await ensurePolarCustomer(userId, userEmail, fullName);
      }
    }

    if (type === "recovery") {
      // Password reset — redirect to update-password page
      return NextResponse.redirect(`${origin}/auth/update-password`);
    }
  }

  // URL to redirect to after auth completes
  const redirectPath = requestUrl.searchParams.get("redirect");
  const redirectUrl = new URL(
    isValidRedirectPath(redirectPath)
      ? `${origin}${redirectPath}`
      : `${origin}/dashboard`,
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
