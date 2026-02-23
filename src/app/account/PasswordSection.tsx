"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { SettingsCard } from "./SettingsCard";

interface PasswordSectionProps {
  supabase: SupabaseClient;
}

export function PasswordSection({ supabase }: PasswordSectionProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = !password || !confirmPassword;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      setLoading(true);
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      toast.success("Password updated successfully");
      setPassword("");
      setConfirmPassword("");
    },
    [password, confirmPassword, supabase],
  );

  return (
    <SettingsCard title="Password">
      <form onSubmit={handleSubmit} className="space-y-3">
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
          disabled={isEmpty}
        >
          Update password
        </Button>
      </form>
    </SettingsCard>
  );
}
