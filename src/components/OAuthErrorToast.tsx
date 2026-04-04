"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/** Map of Supabase OAuth error codes to user-facing messages. */
const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  bad_oauth_state:
    "Your sign-in session has expired. Please try signing in again.",
  bad_oauth_callback: "Sign-in could not be completed. Please try again.",
  access_denied: "Access was denied. Please try signing in again.",
  server_error: "Something went wrong during sign-in. Please try again.",
  temporarily_unavailable:
    "The sign-in service is temporarily unavailable. Please try again later.",
};

export function OAuthErrorToast() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    if (!errorCode) return;

    const message =
      OAUTH_ERROR_MESSAGES[errorCode] ??
      "Something went wrong during sign-in. Please try again.";
    toast.error(message);

    // Clean up the URL without triggering a navigation
    const url = new URL(window.location.href);
    url.searchParams.delete("error");
    url.searchParams.delete("error_code");
    url.searchParams.delete("error_description");
    window.history.replaceState({}, "", url.toString());
  }, [searchParams]);

  return null;
}
