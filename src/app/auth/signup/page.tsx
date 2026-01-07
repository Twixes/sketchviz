"use client";

import Link from "next/link";
import { useState } from "react";
import GoogleIcon from "@/icons/google.svg";
import { Button } from "@/lib/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validate password match
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    // Validate password strength
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError(
            "An account with this email already exists. Please sign in instead.",
          );
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
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

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Success checkmark"
            >
              <title>Success checkmark</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Check your email
          </h1>
          <p className="text-sm text-black/60 mb-6">
            We've sent a verification link to <strong>{email}</strong>. Please
            click the link to verify your account and complete the sign up
            process.
          </p>
          <p className="text-xs text-black/40">
            Didn't receive the email? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => setSuccess(false)}
              className="text-black hover:underline font-medium"
            >
              try again
            </button>
            .
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Sign Up</h1>
          <p className="text-sm text-black/60">
            Create an account to get started
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignUp} className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-black mb-2"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-black/20 rounded-xl bg-white text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
              disabled={loading || googleLoading}
            />
          </div>

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
            <p className="mt-1 text-xs text-black/40">
              Must be at least 8 characters
            </p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-black mb-2"
            >
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-black/20 rounded-xl bg-white text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-transparent transition-all"
              disabled={loading || googleLoading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            disabled={googleLoading}
            className="w-full"
          >
            Sign Up
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
          onClick={handleGoogleSignUp}
          loading={googleLoading}
          disabled={loading}
          leftIcon={<GoogleIcon className="size-5" />}
          className="w-full"
        >
          Sign up with Google
        </Button>

        <p className="mt-6 text-center text-sm text-black/60">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-black hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
