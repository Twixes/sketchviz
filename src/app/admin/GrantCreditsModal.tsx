"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/lib/components/ui/Button";
import { Dialog } from "@/lib/components/ui/Dialog";
import { Input } from "@/lib/components/ui/Input";
import { type GrantCreditsResult, grantCreditsAction } from "./actions";

interface GrantCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
}

const initialState: GrantCreditsResult = { success: false };

export function GrantCreditsModal({
  open,
  onOpenChange,
  userId,
  userEmail,
}: GrantCreditsModalProps) {
  const [state, formAction, isPending] = useActionState(
    grantCreditsAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Close modal and reset form on success
  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      formRef.current?.reset();
    }
  }, [state.success, onOpenChange]);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Grant Extra Credits"
      description={`Grant additional credits to ${userEmail}`}
      footer={
        <>
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="grant-credits-form"
            variant="primary"
            loading={isPending}
          >
            Grant credits
          </Button>
        </>
      }
    >
      <form ref={formRef} id="grant-credits-form" action={formAction}>
        <input type="hidden" name="userId" value={userId} />
        <Input
          id="credit-amount"
          name="creditAmount"
          type="number"
          min="1"
          max="10000"
          required
          placeholder="Enter amount"
          error={state.error}
        />
      </form>
    </Dialog>
  );
}
