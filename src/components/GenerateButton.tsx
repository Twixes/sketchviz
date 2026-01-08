"use client";

import {
  DoubleArrowUpIcon,
  EnterIcon,
  ExclamationTriangleIcon,
  EyeOpenIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/lib/components/ui/Button";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";

interface GenerateButtonProps {
  user: User | null;
  model: Model;
  credits: number | null | undefined;
  isGenerating: boolean;
  /**
   * Whether this is an iteration on an existing generation.
   * When true, shows "Iterate" label and UpdateIcon.
   */
  isIteration?: boolean;
  onGenerate: () => void;
  onSignIn: () => void;
}

export function GenerateButton({
  user,
  model,
  credits,
  isGenerating,
  isIteration = false,
  onGenerate,
  onSignIn,
}: GenerateButtonProps) {
  const creditCost = determineCreditCostOfImageGeneration({ model });
  const hasInsufficientCredits = !!(
    user &&
    credits !== null &&
    credits !== undefined &&
    credits < creditCost
  );

  // Compute button label based on state
  const getLabel = () => {
    if (isGenerating) {
      return isIteration ? "Iterating..." : "Visualizing...";
    }
    if (isIteration) {
      return "Iterate";
    }
    return "Visualize";
  };

  // Not logged in - show login button
  if (!user) {
    return (
      <Button
        variant="primary"
        size="lg"
        onClick={onSignIn}
        disabled={isGenerating}
        leftIcon={<EnterIcon />}
        className="relative w-full px-20"
      >
        Sign in with Google to continue
        <CreditBadge creditCost={creditCost} />
      </Button>
    );
  }

  // Insufficient credits - show upgrade button
  if (hasInsufficientCredits) {
    return (
      <Button
        variant="primary"
        size="lg"
        link="/billing/upgrade"
        disabled={isGenerating}
        rightIcon={<DoubleArrowUpIcon />}
        className="relative w-full px-20"
      >
        You're out of credits – upgrade to Pro
        <CreditBadge creditCost={creditCost} hasWarning />
      </Button>
    );
  }

  // Normal action button
  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onGenerate}
      disabled={isGenerating}
      leftIcon={isIteration ? <UpdateIcon /> : <EyeOpenIcon />}
      className="relative w-full px-20"
    >
      {getLabel()}
      <CreditBadge creditCost={creditCost} />
    </Button>
  );
}

function CreditBadge({
  creditCost,
  hasWarning = false,
}: {
  creditCost: number;
  hasWarning?: boolean;
}) {
  return (
    <div className="absolute top-3 bottom-3 right-3 rounded flex items-center px-1 border border-white/60 text-xs">
      {hasWarning && <ExclamationTriangleIcon className="mr-0.5" />}
      {creditCost} credits
    </div>
  );
}
