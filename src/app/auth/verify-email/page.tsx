"use client";

import { EnvelopeClosedIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { NeonBackground } from "@/components/NeonBackground";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = useCallback(async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setResent(true);
  }, [email]);

  return (
    <NeonBackground>
      <div className="flex flex-1 items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="w-full max-w-sm rounded-2xl border border-black/10 bg-white p-8 shadow-xl text-center"
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

          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-black/5">
            <EnvelopeClosedIcon className="size-6 text-black/60" />
          </div>

          <h1 className="text-xl font-semibold text-black mb-2">
            Check your email
          </h1>
          <p className="text-sm text-black/60 mb-6">
            We sent a verification link to{" "}
            {email ? (
              <span className="font-medium text-black">{email}</span>
            ) : (
              "your email address"
            )}
            . Click the link to verify your account.
          </p>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

          <Button
            variant="secondary"
            className="w-full mb-4"
            onClick={handleResend}
            loading={resending}
            disabled={resent}
          >
            {resent ? "Verification email resent" : "Resend verification email"}
          </Button>

          <Link
            href="/auth/login"
            className="text-sm text-black/50 hover:text-black/80 transition-colors"
          >
            Back to login
          </Link>
        </motion.div>
      </div>
    </NeonBackground>
  );
}
