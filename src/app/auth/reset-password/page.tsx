"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useCallback, useState } from "react";
import { NeonBackground } from "@/components/NeonBackground";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/auth/callback` },
      );

      setLoading(false);
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setSent(true);
    },
    [email],
  );

  return (
    <NeonBackground>
      <div className="flex flex-1 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-xl"
        >
          <Link
            href="/"
            className="flex items-center justify-center gap-2 mb-6"
          >
            <Image
              src="/icon.png"
              alt="SketchViz"
              className="size-12"
              width={48}
              height={48}
            />
          </Link>

          <h1 className="text-2xl font-semibold text-black text-center mb-2">
            Reset password
          </h1>
          <p className="text-sm text-black/60 text-center mb-6">
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </p>

          {sent ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
              <p className="text-sm text-emerald-800">
                Check your email for a reset link. You can close this page.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                Send reset link
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-black/50 hover:text-black/80 transition-colors"
            >
              Back to log in
            </Link>
          </div>
        </motion.div>
      </div>
    </NeonBackground>
  );
}
