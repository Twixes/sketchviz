"use client";

import { useEffect } from "react";

export default function AuthSuccess() {
  useEffect(() => {
    // Close the popup window after successful authentication
    if (window.opener) {
      window.close();
    } else {
      // If not in a popup, redirect to home
      window.location.href = "/";
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
