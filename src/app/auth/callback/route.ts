import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isValidRedirectPath } from "@/lib/auth-utils";
import { extractFirstName } from "@/lib/language-utils";
import { ensurePolarProvisioned } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import {
  buildSignupDiscoveryMetadata,
  getSignupDiscoveryFromMetadata,
  parseSignupDiscoveryCookie,
  resolveSignupDiscovery,
  SIGNUP_DISCOVERY_COOKIE_NAME,
} from "@/lib/signup-discovery";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures a Polar customer exists for the given user. Creates one with the Free plan if not found.
 * Returns true if the user was newly created (signup).
 * Throws if Polar provisioning fails — auth should not succeed without billing setup.
 */
async function ensurePolarCustomer(
  userId: string,
  email: string,
  fullName?: string,
  discoverySource?: string,
  discoveryDetail?: string,
): Promise<boolean> {
  const { wasAlreadyProvisioned } = await ensurePolarProvisioned({
    userId,
    email,
    name: fullName ?? email,
  });
  const resolvedDiscoverySource = discoverySource ?? discoveryDetail;
  const resolvedDiscoveryDetail = discoverySource ? discoveryDetail : undefined;

  if (!wasAlreadyProvisioned) {
    posthogNode?.capture({
      distinctId: userId,
      event: "signed_up",
      properties: {
        $set: {
          email,
          name: fullName ?? email,
          first_name: fullName ? extractFirstName(fullName) : undefined,
          discovery_source: resolvedDiscoverySource,
          discovery_source_detail: resolvedDiscoveryDetail,
        },
      },
    });
  }

  return !wasAlreadyProvisioned;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type") as EmailOtpType | null;
  const origin = requestUrl.origin;
  const cookieStore = await cookies();
  const googleSignupDiscovery = parseSignupDiscoveryCookie(
    cookieStore.get(SIGNUP_DISCOVERY_COOKIE_NAME)?.value,
  );
  let isSignup = false;

  const supabase = await createClient();

  try {
    if (code) {
      // OAuth flow (Google)
      await supabase.auth.exchangeCodeForSession(code);
      const { data } = await supabase.auth.getClaims();
      const userId = data?.claims?.sub;
      const userEmail = data?.claims?.email as string | undefined;
      const userMetadata = data?.claims?.user_metadata as
        | Record<string, unknown>
        | undefined;
      const metadataDiscovery = getSignupDiscoveryFromMetadata(userMetadata);
      const resolvedSignupDiscovery = resolveSignupDiscovery(
        googleSignupDiscovery.discoverySource ??
          metadataDiscovery.discoverySource,
        googleSignupDiscovery.discoveryDetail ??
          metadataDiscovery.discoveryDetail,
      );
      if (userId && userEmail) {
        isSignup = await ensurePolarCustomer(
          userId,
          userEmail,
          typeof userMetadata?.full_name === "string"
            ? userMetadata.full_name
            : undefined,
          resolvedSignupDiscovery.discoverySource,
          resolvedSignupDiscovery.discoveryDetail,
        );

        if (
          isSignup &&
          (resolvedSignupDiscovery.discoverySource ||
            resolvedSignupDiscovery.discoveryDetail)
        ) {
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              ...userMetadata,
              ...buildSignupDiscoveryMetadata(
                resolvedSignupDiscovery.discoverySource,
                resolvedSignupDiscovery.discoveryDetail,
              ),
            },
          });
          if (updateError) {
            console.error(
              "Failed to persist signup discovery metadata:",
              updateError,
            );
            posthogNode?.captureException(updateError);
          }
        }
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
          `${origin}/auth/login?error=${encodeURIComponent(error.message)}`,
        );
      }

      if (type === "signup" || type === "email") {
        // Email verification — ensure Polar customer exists
        const userId = data.user?.id;
        const userEmail = data.user?.email;
        const fullName = data.user?.user_metadata?.full_name as
          | string
          | undefined;
        const resolvedSignupDiscovery = getSignupDiscoveryFromMetadata(
          data.user?.user_metadata as Record<string, unknown> | undefined,
        );
        if (userId && userEmail) {
          isSignup = await ensurePolarCustomer(
            userId,
            userEmail,
            fullName,
            resolvedSignupDiscovery.discoverySource,
            resolvedSignupDiscovery.discoveryDetail,
          );
        }
      }

      if (type === "recovery") {
        // Password reset — redirect to update-password page
        return NextResponse.redirect(`${origin}/auth/update-password`);
      }
    }
  } catch (error) {
    console.error("Auth callback error:", error);
    posthogNode?.captureException(error);
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent("Something went wrong during sign-in. Please try again.")}`,
    );
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
  const response = NextResponse.redirect(redirectUrl);
  response.cookies.delete(SIGNUP_DISCOVERY_COOKIE_NAME);
  return response;
}
