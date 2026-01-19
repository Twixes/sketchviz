"use client";

import {
  EnterIcon,
  ExclamationTriangleIcon,
  ExternalLinkIcon,
  EyeOpenIcon,
  UpdateIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/cn";
import { Button } from "@/lib/components/ui/Button";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";
import type { SessionUser } from "./SessionProvider";

interface GenerateButtonProps {
  user: SessionUser | null;
  model: Model;
  credits: number | null | undefined;
  planType: "free" | "pro" | null | undefined;
  isGenerating: boolean;
  /**
   * Whether this is an iteration on an existing generation.
   * When true, shows "Iterate" label and UpdateIcon.
   */
  isIteration?: boolean;
  hasGenerations?: boolean;
  /** Number of reference images, used for BFL model credit calculation. */
  referenceImageCount?: number;
  onGenerate: () => void;
  onSignIn: () => void;
}

export function GenerateButton({
  user,
  model,
  credits,
  planType,
  isGenerating,
  isIteration = false,
  hasGenerations = false,
  referenceImageCount = 0,
  onGenerate,
  onSignIn,
}: GenerateButtonProps) {
  const creditCost = determineCreditCostOfImageGeneration({ model });
  // Only show insufficient credits for free users - Pro users are billed for overages
  const hasInsufficientCredits = !!(
    user &&
    planType === "free" &&
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
    if (hasGenerations) {
      return "Re-visualize";
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
        Sign up with Google to try for free
      </Button>
    );
  }

  // Insufficient credits - show upgrade button
  if (hasInsufficientCredits) {
    return <UpgradeButton isGenerating={isGenerating} />;
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
      <CreditBadge
        creditCost={creditCost}
        className="absolute top-3 bottom-3 right-3 border-white/60"
      />
    </Button>
  );
}

export function CreditBadge({
  creditCost,
  perRefCost,
  hasWarning = false,
  className,
}: {
  creditCost: number;
  /** Cost per reference image, shown as "+X/ref" when provided */
  perRefCost?: number;
  hasWarning?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded flex items-center px-1 border border-black/20 text-xs",
        className,
      )}
    >
      {hasWarning && <ExclamationTriangleIcon className="mr-0.5" />}
      {creditCost} credits{perRefCost ? ` + ${perRefCost}/reference` : ""}
    </div>
  );
}

export function UpgradeButton({ isGenerating }: { isGenerating: boolean }) {
  return (
    <Button
      variant="primary"
      size="lg"
      link="/pricing"
      disabled={isGenerating}
      rightIcon={<ExternalLinkIcon />}
      className="relative w-full px-20"
    >
      You're out of free credits – upgrade now from the Pricing page
    </Button>
  );
}
