"use client";

import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useActionState, useState } from "react";
import { Button } from "@/lib/components/ui/Button";
import { type CreateTeamResult, createTeamAction } from "./actions";

const initialState: CreateTeamResult = { success: false };

export function CreateTeamForm() {
  const [state, formAction, isPending] = useActionState(
    createTeamAction,
    initialState,
  );
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (state.checkoutUrl) {
      await navigator.clipboard.writeText(state.checkoutUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold text-black mb-4">Create team</h2>

      {state.success && state.checkoutUrl ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-md bg-green-50 border border-green-200 p-4">
            <p className="text-sm font-medium text-green-800 mb-2">
              Team created! Send this payment link to the customer:
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded bg-white border border-green-200 px-3 py-2 text-xs text-black break-all">
                {state.checkoutUrl}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                leftIcon={
                  copied ? (
                    <CheckIcon className="size-3.5" />
                  ) : (
                    <CopyIcon className="size-3.5" />
                  )
                }
              >
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            {state.teamId && (
              <p className="text-xs text-green-700 mt-2">
                Team ID: {state.teamId}
              </p>
            )}
          </div>
        </div>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="team-name"
                className="text-sm font-medium text-black/70"
              >
                Team name
              </label>
              <input
                id="team-name"
                name="name"
                type="text"
                placeholder="e.g. Architecture Studio"
                required
                maxLength={100}
                className="rounded-md border border-black/20 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="seat-count"
                className="text-sm font-medium text-black/70"
              >
                Seats
              </label>
              <input
                id="seat-count"
                name="seatCount"
                type="number"
                min={1}
                max={500}
                defaultValue={5}
                required
                className="rounded-md border border-black/20 bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="owner-email"
              className="text-sm font-medium text-black/70"
            >
              Owner email
            </label>
            <input
              id="owner-email"
              name="ownerEmail"
              type="email"
              placeholder="admin@school.edu"
              required
              className="rounded-md border border-black/20 bg-white px-3 py-2 text-sm"
            />
            <p className="text-xs text-black/40">
              Must be a registered user. They become the team owner.
            </p>
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <div>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={isPending}
            >
              Create team & generate payment link
            </Button>
          </div>
          <p className="text-xs text-black/50">
            Creates the team, sets up billing, and generates a shareable Polar
            checkout link. Send the link to the customer to activate their
            subscription.
          </p>
        </form>
      )}
    </div>
  );
}
