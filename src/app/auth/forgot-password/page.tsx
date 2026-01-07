"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/lib/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white px-4">
        <div className="w-full max-w-md text-center">
          <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-label="Email sent"
            >
              <title>Email sent</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Check your email
          </h1>
          <p className="text-sm text-black/60 mb-6">
            We've sent a password reset link to <strong>{email}</strong>. Please
            click the link to reset your password.
          </p>
          <p className="text-xs text-black/40 mb-6">
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
          <Link
            href="/auth/signin"
            className="text-sm text-black/60 hover:text-black transition-colors"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            Forgot Password?
          </h1>
          <p className="text-sm text-black/60">
            Enter your email address and we'll send you a link to reset your
            password
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-4 mb-6">
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
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full"
          >
            Send Reset Link
          </Button>
        </form>

        <p className="text-center text-sm text-black/60">
          Remember your password?{" "}
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
