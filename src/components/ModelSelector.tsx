import { LightningBoltIcon, RocketIcon } from "@radix-ui/react-icons";
import type React from "react";
import { Select, type SelectOption } from "@/lib/components/ui/Select";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";

export interface ModelOption extends SelectOption<Model> {
  description: React.ReactNode;
}

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  disabled?: boolean;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "google/gemini-3-pro-image-preview/4k",
    label: (
      <>
        Pro{" "}
        <span className="bg-black rounded-md px-1 ml-1 text-xs font-semibold border border-white text-white">
          4K
        </span>
      </>
    ),
    description: (
      <>
        <strong>Highest quality in 4K resolution.</strong>
        <br />
        Powered by Google's Nano Banana Pro.
      </>
    ),
    icon: RocketIcon,
  },
  {
    value: "google/gemini-3-pro-image-preview",
    label: (
      <>
        Pro{" "}
        <span className="bg-neutral-200 rounded-md px-1 ml-1 text-xs font-semibold border border-white text-neutral-800">
          2K
        </span>
      </>
    ),
    description: (
      <>
        <strong>Highest quality in standard resolution (default).</strong>
        <br />
        Powered by Google's Nano Banana Pro.
      </>
    ),
    icon: RocketIcon,
  },
  {
    value: "google/gemini-2.5-flash-image-preview",
    label: (
      <>
        Lite{" "}
        <span className="bg-neutral-200 rounded-md px-1 ml-1 text-xs font-semibold border border-white text-neutral-800">
          1K
        </span>
      </>
    ),
    description: (
      <>
        <strong>
          Faster and cheaper, but less reliable & lower resolution.
        </strong>
        <br />
        Powered by Google's Nano Banana.
      </>
    ),
    icon: LightningBoltIcon,
  },
];

export function ModelSelector({
  value,
  onChange,
  disabled,
}: ModelSelectorProps) {
  return (
    <Select
      label="Quality"
      value={value}
      options={MODEL_OPTIONS.map((option) => ({
        ...option,
        description: (
          <div>
            {option.description}
            <br />
            Credits per visualization:{" "}
            <strong>
              {determineCreditCostOfImageGeneration({ model: option.value })}
            </strong>
            .
          </div>
        ),
      }))}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
