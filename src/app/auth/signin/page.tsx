"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Validates redirect path is safe (same-origin, no open redirect).
 */
function isValidRedirectPath(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("..")) return false;
  return true;
}

export default function SignInPage() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const validatedRedirect = useMemo(
    () => (isValidRedirectPath(redirectTo) ? redirectTo : null),
    [redirectTo],
  );

  useEffect(() => {
    const supabase = createClient();
    // Build callback URL with optional redirect param
    const callbackUrl = new URL("/auth/callback", window.location.origin);
    if (validatedRedirect) {
      callbackUrl.searchParams.set("redirect", validatedRedirect);
    }
    // Automatically trigger Google sign-in when this page loads
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl.toString(),
      },
    });
  }, [validatedRedirect]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-black/20 border-t-black" />
        <p className="text-sm text-black/60">Redirecting to Google...</p>
      </div>
    </div>
  );
}
