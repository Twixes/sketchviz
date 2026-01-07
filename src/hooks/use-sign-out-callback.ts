import posthog from "posthog-js";
import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";

export function useSignOutCallback() {
  const { supabase } = useSession();

  return useCallback(async () => {
    posthog.capture("sign_out");
    await supabase.auth.signOut();
    posthog.reset();
  }, [supabase]);
}
