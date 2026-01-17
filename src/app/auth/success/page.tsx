"use client";

import { useEffect } from "react";

export default function AuthSuccess() {
  useEffect(() => {
    if (window.opener) {
      // Close the popup - parent window polls for closure and checks auth status
      window.close();
    } else {
      // If not in a popup, redirect to dashboard
      window.location.href = "/dashboard";
    }
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-black/20 border-t-black" />
        <p className="text-sm text-black/60">Sign in successful!</p>
      </div>
    </div>
  );
}
