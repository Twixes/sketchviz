import { RocketIcon } from "@radix-ui/react-icons";
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
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "google/gemini-3-pro-image-preview/4k",
    label: (
      <>
        4K{" "}
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
        Powered by Google's Nano Banana Pro.
      </>
    ),
    icon: RocketIcon,
  },
  {
    value: "google/gemini-3-pro-image-preview",
    label: (
      <>
        2K{" "}
        <CreditBadge
          creditCost={determineCreditCostOfImageGeneration({
            model: "google/gemini-3-pro-image-preview",
          })}
        />
      </>
    ),
    description: (
      <>
        <strong>High quality. Standard resolution (4 megapixels).</strong>
        <br />
        Powered by Google's Nano Banana Pro.
      </>
    ),
    icon: RocketIcon,
  },
];

export function ModelSelector({
  value,
  onChange,
  disabled,
}: ModelSelectorProps) {
  return (
    <Select
      label="Resolution"
      value={value}
      options={MODEL_OPTIONS}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
