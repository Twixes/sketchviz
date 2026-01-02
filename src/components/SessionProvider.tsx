"use client";

import { sendGAEvent } from "@next/third-parties/google";
import type { SupabaseClient, User } from "@supabase/supabase-js";
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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        posthog.identify(session?.user?.id, {
          email: session?.user?.email,
          name: session?.user?.user_metadata.full_name,
          first_name: extractFirstName(session?.user?.user_metadata.full_name),
        });
        sendGAEvent("event", "conversion", {
          send_to: "AW-971292206/OnR4CMWIxdsbEK78ks8D",
        });
      } else {
        posthog.reset();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
