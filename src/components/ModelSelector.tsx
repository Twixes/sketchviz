import { LightningBoltIcon, RocketIcon } from "@radix-ui/react-icons";
import type React from "react";
import { Select, type SelectOption } from "@/lib/components/ui/Select";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";
import { CreditBadge } from "./GenerateButton";

export interface ModelOption extends SelectOption<Model> {
  description: React.ReactNode;
}

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  disabled?: boolean;
  proOnly?: boolean;
}

function ResolutionBadge({
  resolution,
}: {
  resolution: "1K" | "1.5K" | "2K" | "4K";
}) {
  const styles: Record<typeof resolution, string> = {
    "4K": "bg-black border-white text-white",
    "2K": "bg-neutral-300 border-black/10 text-neutral-800",
    "1.5K": "bg-neutral-200 border-black/10 text-neutral-800",
    "1K": "bg-neutral-100 border-black/10 text-neutral-800",
  };
  const labels: Record<typeof resolution, string> = {
    "4K": "4K",
    "2K": "1440p",
    "1.5K": "1080p",
    "1K": "720p",
  };
  return (
    <span
      className={`rounded px-1 text-xs font-semibold border ${styles[resolution]}`}
    >
      {labels[resolution]}
    </span>
  );
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "google/gemini-3-pro-image-preview/4k",
    icon: RocketIcon,
    label: (
      <>
        Pro <ResolutionBadge resolution="4K" />{" "}
        <CreditBadge
          creditCost={determineCreditCostOfImageGeneration({
            model: "google/gemini-3-pro-image-preview/4k",
          })}
        />
      </>
    ),
    description: (
      <>
        <strong>High quality. Maximum resolution (16 megapixels).</strong>
        <br />
        Powered by Google Gemini.
      </>
    ),
  },
  {
    value: "google/gemini-3-pro-image-preview",
    icon: RocketIcon,
    label: (
      <>
        Pro <ResolutionBadge resolution="2K" />{" "}
        <CreditBadge
          creditCost={determineCreditCostOfImageGeneration({
            model: "google/gemini-3-pro-image-preview",
          })}
        />
      </>
    ),
    description: (
      <>
        <strong>High quality. High resolution (4 megapixels).</strong>
        <br />
        Powered by Google Gemini.
      </>
    ),
  },
  {
    value: "bfl/flux-2-klein-9b/1.5k",
    icon: LightningBoltIcon,
    label: (
      <>
        Lite <ResolutionBadge resolution="1.5K" />{" "}
        <CreditBadge
          creditCost={determineCreditCostOfImageGeneration({
            model: "bfl/flux-2-klein-9b/1.5k",
          })}
        />
      </>
    ),
    description: (
      <>
        <strong>Fast results. Standard resolution (2 megapixels).</strong>
        <br />
        Powered by Black Forest Labs FLUX.
      </>
    ),
  },
  {
    value: "bfl/flux-2-klein-9b/1k",
    icon: LightningBoltIcon,
    label: (
      <>
        Lite <ResolutionBadge resolution="1K" />{" "}
        <CreditBadge
          creditCost={determineCreditCostOfImageGeneration({
            model: "bfl/flux-2-klein-9b/1k",
          })}
        />
      </>
    ),
    description: (
      <>
        <strong>Fast results. Low resolution (1 megapixel).</strong>
        <br />
        Powered by Black Forest Labs FLUX.
      </>
    ),
  },
];

const PRO_ONLY_REASON = "Pro quality is required for project-level consistency";

export function ModelSelector({
  value,
  onChange,
  disabled,
  proOnly,
}: ModelSelectorProps) {
  const options = proOnly
    ? MODEL_OPTIONS.map((opt) =>
        opt.value.startsWith("google/")
          ? opt
          : { ...opt, disabledReason: PRO_ONLY_REASON },
      )
    : MODEL_OPTIONS;

  return (
    <Select
      label="Quality"
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
