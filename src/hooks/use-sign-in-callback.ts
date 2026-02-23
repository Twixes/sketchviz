import posthog from "posthog-js";
import { useCallback } from "react";

interface SignInOptions {
  redirectAfterLogin?: string;
}

export function useSignInCallback(): (options?: SignInOptions) => void {
  return useCallback((options?: SignInOptions) => {
    posthog.capture("log_in_started");
    const url = new URL("/auth/login", window.location.origin);
    if (options?.redirectAfterLogin) {
      url.searchParams.set("redirect", options.redirectAfterLogin);
    }
    window.location.href = url.toString();
  }, []);
}
