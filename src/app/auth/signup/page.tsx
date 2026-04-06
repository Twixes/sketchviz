"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useMemo, useState } from "react";
import { AuthFormShell } from "@/components/AuthFormShell";
import { AuthGoogleButton } from "@/components/AuthGoogleButton";
import { useValidatedRedirect } from "@/hooks/use-validated-redirect";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { Select } from "@/lib/components/ui/Select";
import {
  buildSignupDiscoveryMetadata,
  getSignupDiscoveryOption,
  SIGNUP_DISCOVERY_DETAIL_PLACEHOLDER,
  SIGNUP_DISCOVERY_OPTIONS,
} from "@/lib/signup-discovery";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const validatedRedirect = useValidatedRedirect();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [discoverySource, setDiscoverySource] = useState<string | null>(null);
  const [discoveryDetail, setDiscoveryDetail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = useMemo(() => {
    const url = new URL("/auth/callback", window.location.origin);
    if (validatedRedirect) {
      url.searchParams.set("redirect", validatedRedirect);
    }
    return url.toString();
  }, [validatedRedirect]);

  const loginHref = useMemo(() => {
    const params = validatedRedirect
      ? `?redirect=${encodeURIComponent(validatedRedirect)}`
      : "";
    return `/auth/login${params}`;
  }, [validatedRedirect]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const supabase = createClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            ...buildSignupDiscoveryMetadata(discoverySource, discoveryDetail),
          },
          emailRedirectTo: callbackUrl,
        },
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
    },
    [
      email,
      password,
      fullName,
      discoverySource,
      discoveryDetail,
      callbackUrl,
      router,
    ],
  );

  const handleDiscoverySourceChange = useCallback((value: string | null) => {
    setDiscoverySource(value);
    setDiscoveryDetail(null);
  }, []);

  return (
    <AuthFormShell>
      <h1 className="text-2xl font-semibold text-black text-center mb-6">
        Sign up for new horizons
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
          required
          autoComplete="name"
          className="rounded-lg"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="rounded-lg"
        />
        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          minLength={6}
          className="rounded-lg"
        />
        <Select
          label="How did you find out about SketchViz? (optional)"
          value={discoverySource}
          options={SIGNUP_DISCOVERY_OPTIONS}
          onChange={handleDiscoverySourceChange}
          required={false}
          placeholder="Select an option"
          layout="vertical"
        />
        {discoverySource !== null && (
          <Input
            label={
              getSignupDiscoveryOption(discoverySource)?.detailLabel ??
              "Where did you find us? (optional)"
            }
            type="text"
            value={discoveryDetail ?? ""}
            onChange={(e) => setDiscoveryDetail(e.target.value || null)}
            placeholder={SIGNUP_DISCOVERY_DETAIL_PLACEHOLDER}
            autoComplete="off"
            className="rounded-lg"
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          className="w-full"
        >
          Sign up
        </Button>
      </form>

      <AuthGoogleButton
        redirectTo={validatedRedirect}
        label="Sign up with Google"
        signupDiscoverySource={discoverySource}
        signupDiscoveryDetail={discoveryDetail}
      />

      <p className="mt-6 text-center text-sm text-black/50">
        Already have an account?{" "}
        <Link
          href={loginHref}
          className="font-medium text-black hover:underline"
        >
          Log in
        </Link>
      </p>
    </AuthFormShell>
  );
}
