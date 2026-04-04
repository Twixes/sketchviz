"use client";

import { useState } from "react";
import { Button } from "@/lib/components/ui/Button";
import { Dialog } from "@/lib/components/ui/Dialog";
import { Input } from "@/lib/components/ui/Input";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (email: string) => void;
  isPending: boolean;
  error?: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  onInvite,
  isPending,
  error,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email.trim());
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) setEmail("");
        onOpenChange(open);
      }}
      title="Invite team member"
      description="Send an invitation to join your team. They'll see a banner when they log in."
      footer={
        <div className="flex justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            loading={isPending}
            disabled={!email.trim() || isPending}
          >
            Send invitation
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="mt-4">
        <Input
          label="Email address"
          type="email"
          placeholder="colleague@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error}
          autoFocus
          required
        />
      </form>
    </Dialog>
  );
}
