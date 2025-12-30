import type { User } from "@supabase/supabase-js";
import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";

export function useSignInCallback(): () => Promise<User | null> {
  const { supabase } = useSession();

  return useCallback(async () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/auth/signin",
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
    );

    if (!popup) {
      // Fallback if popup was blocked
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
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
    return user || null;
  }, [supabase]);
}
