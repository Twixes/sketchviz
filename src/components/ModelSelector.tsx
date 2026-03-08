import {
  ImageIcon,
  LightningBoltIcon,
  RocketIcon,
} from "@radix-ui/react-icons";
import type React from "react";
import { Select } from "@/lib/components/ui/Select";
import type { Model } from "@/lib/schemas";

/** The abstract model tiers, independent of resolution. */
export type BaseModel = "pro" | "standard" | "lite";

/** Resolution tier that stays consistent across model switches. */
export type ResolutionTier = "high" | "low";

interface ModelDefinition {
  baseModel: BaseModel;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: React.ReactNode;
  models: Record<ResolutionTier, Model>;
}

export const MODEL_DEFINITIONS: ModelDefinition[] = [
  {
    baseModel: "pro",
    label: "Pro",
    icon: RocketIcon,
    description: (
      <>
        Top-tier quality for targeted changes.
        <br />
        14/24 credits. Powered by Google.
      </>
    ),
    models: {
      high: "google/gemini-3-pro-image-preview/4k",
      low: "google/gemini-3-pro-image-preview",
    },
  },
  {
    baseModel: "standard",
    label: "Standard",
    icon: ImageIcon,
    description: (
      <>
        Balanced quality for most visuals.
        <br />
        7/12 credits. Powered by Google.
      </>
    ),
    models: {
      high: "google/gemini-3.1-flash-image-preview/4k",
      low: "google/gemini-3.1-flash-image-preview",
    },
  },
  {
    baseModel: "lite",
    label: "Lite",
    icon: LightningBoltIcon,
    description: (
      <>
        Fast results for quick previews.
        <br />
        3/5 credits. Powered by Black Forest Labs.
      </>
    ),
    models: {
      high: "bfl/flux-2-klein-9b/1.5k",
      low: "bfl/flux-2-klein-9b/1k",
    },
  },
];

/** Build a full Model string from base model + tier. */
export function buildModel(baseModel: BaseModel, tier: ResolutionTier): Model {
  const def = MODEL_DEFINITIONS.find((d) => d.baseModel === baseModel);
  if (!def) {
    return MODEL_DEFINITIONS[0].models[tier];
  }
  return def.models[tier];
}

/** Resolve a full Model string to its base model and resolution tier. */
export function parseModel(model: Model): {
  baseModel: BaseModel;
  tier: ResolutionTier;
} {
  for (const def of MODEL_DEFINITIONS) {
    if (def.models.high === model)
      return { baseModel: def.baseModel, tier: "high" };
    if (def.models.low === model)
      return { baseModel: def.baseModel, tier: "low" };
  }
  // Fallback to pro high
  return { baseModel: "pro", tier: "high" };
}

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  disabled?: boolean;
  proOnly?: boolean;
}

const PRO_ONLY_REASON = "Pro quality is required for project-level consistency";

export function ModelSelector({
  value,
  onChange,
  disabled,
  proOnly,
}: ModelSelectorProps) {
  const { baseModel, tier } = parseModel(value);

  let options = MODEL_DEFINITIONS.map((def) => ({
    value: def.baseModel,
    icon: def.icon,
    label: (
      <>
        {def.label}{" "}
        {def.baseModel === "standard" && (
          <span className="inline-flex items-center rounded border border-black/20 px-1 text-xs">
            NEW
          </span>
        )}
      </>
    ),
    description: def.description,
  }));

  if (proOnly) {
    options = options.map((opt) =>
      opt.value === "pro" ? opt : { ...opt, disabledReason: PRO_ONLY_REASON },
    );
  }

  return (
    <Select
      label="Quality"
      value={baseModel}
      options={options}
      onChange={(newBaseModel) => onChange(buildModel(newBaseModel, tier))}
      disabled={disabled}
    />
  );
}
