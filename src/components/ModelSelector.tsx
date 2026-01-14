import { RocketIcon } from "@radix-ui/react-icons";
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
    label: "4K",
    description: (
      <>
        <strong>High quality. Maximum resolution.</strong>
        <br />
        Powered by Google's Nano Banana Pro.
      </>
    ),
    icon: RocketIcon,
  },
  {
    value: "google/gemini-3-pro-image-preview",
    label: "2K",
    description: (
      <>
        <strong>High quality. Standard resolution.</strong>
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
