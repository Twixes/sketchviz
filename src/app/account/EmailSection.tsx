"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { type FormEvent, useCallback, useState } from "react";
import { toast } from "sonner";
import type { SessionUser } from "@/components/SessionProvider";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { SettingsCard } from "./SettingsCard";

interface EmailSectionProps {
  user: SessionUser;
  supabase: SupabaseClient;
}

export function EmailSection({ user, supabase }: EmailSectionProps) {
  const [email, setEmail] = useState(user.email);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUnchanged = email === user.email;

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);

      const { error: updateError } = await supabase.auth.updateUser({ email });

      setLoading(false);
      if (updateError) {
        setError(updateError.message);
        return;
      }
      toast.success("Confirmation email sent to your new address");
    },
    [email, supabase],
  );

  return (
    <SettingsCard title="Email address">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={isUnchanged}
        >
          Update email
        </Button>
      </form>
    </SettingsCard>
  );
}
