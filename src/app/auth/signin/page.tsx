"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  useEffect(() => {
    const supabase = createClient();
    // Automatically trigger Google sign-in when this page loads
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-black/20 border-t-black" />
        <p className="text-sm text-black/60">Redirecting to Google...</p>
      </div>
    </div>
  );
}
