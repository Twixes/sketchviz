"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { extractFirstName } from "@/lib/language-utils";
import { createClient } from "@/lib/supabase/client";

type SessionContextType = {
  user: User | null;
  supabase: SupabaseClient;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: User | null;
}) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(initialUser);
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want this to run on every page change
  useEffect(() => {
    window.gtag?.("event", "conversion", {
      send_to: "AW-971292206/UqMnCMns6ekZEK78ks8D",
      value: 1.0,
      currency: "PLN",
    });
  }, [pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "true") {
      window.gtag?.("event", "conversion", {
        send_to: "AW-971292206/OnR4CMWIxdsbEK78ks8D",
      });
      // Remove signup param from URL without creating a history entry
      params.delete("signup");
      const newSearch = params.toString();
      const newUrl = `${window.location.pathname}${newSearch ? `?${newSearch}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      // Invalidate plan query to refetch with new auth state
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      if (session?.user) {
        posthog.identify(session?.user?.id, {
          email: session?.user?.email,
          name: session?.user?.user_metadata.full_name,
          first_name: extractFirstName(session?.user?.user_metadata.full_name),
        });
      } else {
        posthog.reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, queryClient]);

  return (
    <SessionContext.Provider value={{ user, supabase }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
