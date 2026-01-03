"use client";

import { sendGAEvent, sendGTMEvent } from "@next/third-parties/google";
import type { SupabaseClient, User } from "@supabase/supabase-js";
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: we want this to run on every page change
  useEffect(() => {
    sendGTMEvent({
      event: "conversion",
      value: {
        send_to: "AW-971292206/UqMnCMns6ekZEK78ks8D",
        value: 1.0,
        currency: "PLN",
      },
    });
  }, [pathname]);

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
        sendGTMEvent({
          event: "conversion",
          value: { send_to: "AW-971292206/OnR4CMWIxdsbEK78ks8D" },
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
