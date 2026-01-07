import type { User } from "@supabase/supabase-js";
import posthog from "posthog-js";
import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";

export function useSignInCallback(): () => Promise<User | null> {
  const { supabase } = useSession();

  return useCallback(async () => {
    posthog.capture("sign_in_started");
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/auth/signin",
      "Sign In",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
    );

    if (!popup) {
      // Fallback if popup was blocked - redirect to signin page
      window.location.href = "/auth/signin";
      return null;
    } else {
      // Poll for popup closure - session will be updated automatically via auth state change listener
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
        }
      }, 500);

      // Cleanup interval after 5 minutes (timeout)
      setTimeout(
        () => {
          clearInterval(checkInterval);
          if (!popup.closed) {
            popup.close();
          }
        },
        5 * 60 * 1000,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      posthog.capture("sign_in_completed", {
        user_id: user.id,
      });
    }

    return user || null;
  }, [supabase]);
}
