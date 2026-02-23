"use client";

import type { SupabaseClient, UserIdentity } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import GoogleIcon from "@/icons/google.svg";
import { Button } from "@/lib/components/ui/Button";
import { SettingsCard } from "./SettingsCard";

interface ThirdPartLogin {
  supabase: SupabaseClient;
}

export function ThirdPartLogin({ supabase }: ThirdPartLogin) {
  const [identities, setIdentities] = useState<UserIdentity[] | null>(null);
  const [loading, setLoading] = useState(false);

  const googleIdentity = identities?.find((i) => i.provider === "google");

  useEffect(() => {
    supabase.auth.getUserIdentities().then(({ data }) => {
      if (data) {
        setIdentities(data.identities);
      }
    });
  }, [supabase]);

  const handleConnect = useCallback(() => {
    const redirectTo = new URL(
      "/auth/callback?redirect=/account",
      window.location.origin,
    ).toString();
    supabase.auth.linkIdentity({
      provider: "google",
      options: { redirectTo },
    });
  }, [supabase]);

  const handleDisconnect = useCallback(async () => {
    if (!googleIdentity) return;
    setLoading(true);
    const { error } = await supabase.auth.unlinkIdentity(googleIdentity);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Google account disconnected");
    setIdentities((prev) =>
      prev ? prev.filter((i) => i.provider !== "google") : prev,
    );
  }, [googleIdentity, supabase]);

  if (identities === null) {
    return (
      <SettingsCard title="Third-party login">
        <p className="text-sm text-black/50">Loading…</p>
      </SettingsCard>
    );
  }

  return (
    <SettingsCard title="Third-party login">
      {googleIdentity ? (
        <div className="space-y-3">
          <p className="text-sm text-black/70">
            Connected with Google as{" "}
            <span className="font-medium text-black">
              {googleIdentity.identity_data?.email ?? "Unknown"}
            </span>
            .
          </p>
          <Button
            variant="secondary"
            leftIcon={<GoogleIcon />}
            onClick={handleDisconnect}
            loading={loading}
          >
            Disconnect Google
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          leftIcon={<GoogleIcon />}
          onClick={handleConnect}
        >
          Connect Google
        </Button>
      )}
    </SettingsCard>
  );
}
