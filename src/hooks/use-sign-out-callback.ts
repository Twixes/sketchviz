import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";

export function useSignOutCallback() {
  const { supabase } = useSession();

  return useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);
}
