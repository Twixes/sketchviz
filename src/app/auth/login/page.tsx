"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { AuthFormShell } from "@/components/AuthFormShell";
import { AuthGoogleButton } from "@/components/AuthGoogleButton";
import { useValidatedRedirect } from "@/hooks/use-validated-redirect";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const validatedRedirect = useValidatedRedirect();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const signupHref = useMemo(() => {
    const params = validatedRedirect
      ? `?redirect=${encodeURIComponent(validatedRedirect)}`
      : "";
    return `/auth/signup${params}`;
  }, [validatedRedirect]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
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
    },
    [email, password, validatedRedirect, router],
  );

  return (
    <AuthFormShell>
      <h1 className="text-2xl font-semibold text-black text-center mb-6">
        Log in
      </h1>

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
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          minLength={6}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="text-right">
          <Link
            href="/auth/reset-password"
            className="text-xs text-black/50 hover:text-black/80 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full"
        >
          Log in
        </Button>
      </form>

      <AuthGoogleButton
        redirectTo={validatedRedirect}
        label="Log in with Google"
      />

      <p className="mt-6 text-center text-sm text-black/50">
        Don&apos;t have an account?{" "}
        <Link
          href={signupHref}
          className="font-medium text-black hover:underline"
        >
          Sign up
        </Link>
      </p>
    </AuthFormShell>
  );
}
