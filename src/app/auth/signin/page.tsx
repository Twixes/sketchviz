"use client";

import { signIn } from "next-auth/react";
import { useEffect } from "react";

export default function SignInPage() {
  useEffect(() => {
    // Automatically trigger Google sign-in when this page loads
    signIn("google", { callbackUrl: "/auth/callback" });
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
