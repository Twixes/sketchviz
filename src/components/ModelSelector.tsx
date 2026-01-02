import { LightningBoltIcon, RocketIcon } from "@radix-ui/react-icons";
import { Select, type SelectOption } from "@/lib/components/ui/Select";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";

export interface ModelOption extends SelectOption<Model> {
  description: string;
}

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "google/gemini-3-pro-image-preview/4k",
    label: (
      <>
        Nano Banana Pro{" "}
        <span className="bg-black rounded-md px-1 text-xs font-semibold border border-white text-white">
          4K
        </span>
      </>
    ),
    description: "Highest quality in maximum resolution.",
    icon: RocketIcon,
  },
  {
    value: "google/gemini-3-pro-image-preview",
    label: (
      <>
        Nano Banana Pro{" "}
        <span className="bg-neutral-200 rounded-md px-1 text-xs font-semibold border border-white text-neutral-800">
          2K
        </span>
      </>
    ),
    description: "Highest quality in standard resolution (recommended).",
    icon: RocketIcon,
  },
  {
    value: "google/gemini-2.5-flash-image-preview",
    label: "Nano Banana",
    description: "Fast and cheap, but less reliable.",
    icon: LightningBoltIcon,
  },
];

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <Select
      label="AI model"
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
    />
  );
}
