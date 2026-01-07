"use client";

import Link from "next/link";
import { useState } from "react";
import GoogleIcon from "@/icons/google.svg";
import { Button } from "@/lib/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Email not confirmed")) {
          setError(
            "Please verify your email address before signing in. Check your inbox for the verification link.",
          );
        } else if (error.message.includes("Invalid login credentials")) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(error.message);
        }
      } else {
        // Redirect to home on success
        window.location.href = "/";
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Sign In</h1>
          <p className="text-sm text-black/60">
            Welcome back! Sign in to your account
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-black mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-black/20 rounded-xl bg-white text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
              disabled={loading || googleLoading}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-black mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-black/20 rounded-xl bg-white text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
              disabled={loading || googleLoading}
            />
          </div>

          <div className="flex justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-black/60 hover:text-black transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={googleLoading}
            className="w-full"
          >
            Sign In
          </Button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-black/10" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-black/40">
              Or continue with
            </span>
          </div>
        </div>

        <Button
          variant="secondary"
          size="lg"
          onClick={handleGoogleSignIn}
          loading={googleLoading}
          disabled={loading}
          leftIcon={<GoogleIcon className="size-5" />}
          className="w-full"
        >
          Sign in with Google
        </Button>

        <p className="mt-6 text-center text-sm text-black/60">
          Don't have an account?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-black hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
