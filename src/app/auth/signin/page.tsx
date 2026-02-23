"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { NeonBackground } from "@/components/NeonBackground";
import GoogleIcon from "@/icons/google.svg";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

function isValidRedirectPath(path: string | null): path is string {
  if (!path) return false;
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("..")) return false;
  return true;
}

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const initialMode =
    searchParams.get("mode") === "signup" ? "signup" : "signin";

  const validatedRedirect = useMemo(
    () => (isValidRedirectPath(redirectTo) ? redirectTo : null),
    [redirectTo],
  );

  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = useMemo(() => {
    const url = new URL("/auth/callback", window.location.origin);
    if (validatedRedirect) {
      url.searchParams.set("redirect", validatedRedirect);
    }
    return url.toString();
  }, [validatedRedirect]);

  const handleGoogleSignIn = useCallback(() => {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
      },
    });
  }, [callbackUrl]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: callbackUrl,
          },
        });
        setLoading(false);
        if (signUpError) {
          setError(signUpError.message);
          return;
        }
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        setLoading(false);
        if (signInError) {
          setError(signInError.message);
          return;
        }
        router.push(validatedRedirect ?? "/dashboard");
      }
    },
    [mode, email, password, fullName, callbackUrl, validatedRedirect, router],
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
          {/* Logo */}
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
            <p className="text-lg font-semibold tracking-tight text-black">
              SketchViz
            </p>
          </Link>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: mode === "signup" ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: mode === "signup" ? -20 : 20 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-semibold text-black text-center mb-6">
                {mode === "signin" ? "Log in" : "Create account"}
              </h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <Input
                    label="Full name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                  />
                )}
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={6}
                />

                {error && <p className="text-sm text-red-600">{error}</p>}

                {mode === "signin" && (
                  <div className="text-right">
                    <Link
                      href="/auth/reset-password"
                      className="text-xs text-black/50 hover:text-black/80 transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full"
                >
                  {mode === "signin" ? "Log in" : "Create account"}
                </Button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="h-px flex-1 bg-black/10" />
                <span className="text-xs text-black/40">or</span>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              {/* Google OAuth */}
              <Button
                variant="secondary"
                leftIcon={<GoogleIcon />}
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                Continue with Google
              </Button>

              {/* Toggle mode */}
              <p className="mt-6 text-center text-sm text-black/50">
                {mode === "signin" ? (
                  <>
                    Don&apos;t have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                      }}
                      className="font-medium text-black hover:underline cursor-pointer"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signin");
                        setError(null);
                      }}
                      className="font-medium text-black hover:underline cursor-pointer"
                    >
                      Log in
                    </button>
                  </>
                )}
              </p>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </NeonBackground>
  );
}
