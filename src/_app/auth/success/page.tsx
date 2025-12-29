"use client";

import { useLocale, useTranslations } from "next-globe-gen";
import { useEffect } from "react";

export default function AuthSuccess() {
  const t = useTranslations();
  const locale = useLocale();

  useEffect(() => {
    // Close the popup window after successful authentication
    if (window.opener) {
      window.close();
    } else {
      // If not in a popup, redirect to home (with locale)
      window.location.href = `/${locale}`;
    }
  }, [locale]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-black/20 border-t-black" />
        <p className="text-sm text-black/60">{t("auth.success")}</p>
      </div>
    </div>
  );
}
