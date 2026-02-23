"use client";

import { useCallback, useMemo } from "react";
import GoogleIcon from "@/icons/google.svg";
import { Button } from "@/lib/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

interface AuthGoogleButtonProps {
  redirectTo?: string | null;
  label: string;
}

export function AuthGoogleButton({ redirectTo, label }: AuthGoogleButtonProps) {
  const callbackUrl = useMemo(() => {
    const url = new URL("/auth/callback", window.location.origin);
    if (redirectTo) {
      url.searchParams.set("redirect", redirectTo);
    }
    return url.toString();
  }, [redirectTo]);

  const handleClick = useCallback(() => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
  }, [callbackUrl]);

  return (
    <>
      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-black/10" />
        <span className="text-xs text-black/40">or</span>
        <div className="h-px flex-1 bg-black/10" />
      </div>
      <Button
        variant="secondary"
        leftIcon={<GoogleIcon />}
        className="w-full"
        onClick={handleClick}
      >
        {label}
      </Button>
    </>
  );
}
