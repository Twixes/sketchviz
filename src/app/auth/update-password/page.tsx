"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useState } from "react";
import { NeonBackground } from "@/components/NeonBackground";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/dashboard");
    },
    [password, confirmPassword, router],
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
            Update password
          </h1>
          <p className="text-sm text-black/60 text-center mb-6">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="New password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={6}
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              minLength={6}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
            >
              Update password
            </Button>
          </form>
        </motion.div>
      </div>
    </NeonBackground>
  );
}
