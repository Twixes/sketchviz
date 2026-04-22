import { Select, type SelectOption } from "@/lib/components/ui/Select";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";
import { CreditBadge } from "./GenerateButton";
import {
  buildModel,
  DEFAULT_BASE_MODEL,
  MODEL_DEFINITIONS,
  parseModel,
  type ResolutionTier,
} from "./ModelSelector";

interface ResolutionOption extends SelectOption<ResolutionTier> {
  description: React.ReactNode;
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
      className={`rounded-sm px-1 text-xs font-semibold border ${styles[resolution]}`}
    >
      {labels[resolution]}
    </span>
  );
}

const RESOLUTION_LABELS: Record<
  string,
  Record<ResolutionTier, { badge: "1K" | "1.5K" | "2K" | "4K"; mp: string }>
> = {
  ultra: {
    high: { badge: "4K", mp: "8 megapixels" },
    low: { badge: "2K", mp: "4 megapixels" },
  },
  pro: {
    high: { badge: "4K", mp: "16 megapixels" },
    low: { badge: "2K", mp: "4 megapixels" },
  },
  standard: {
    high: { badge: "4K", mp: "16 megapixels" },
    low: { badge: "2K", mp: "4 megapixels" },
  },
  lite: {
    high: { badge: "1.5K", mp: "2 megapixels" },
    low: { badge: "1K", mp: "1 megapixel" },
  },
};

function buildResolutionOptions(currentBaseModel: string): ResolutionOption[] {
  const labels =
    RESOLUTION_LABELS[currentBaseModel] ??
    RESOLUTION_LABELS[DEFAULT_BASE_MODEL];
  const def =
    MODEL_DEFINITIONS.find((d) => d.baseModel === currentBaseModel) ??
    MODEL_DEFINITIONS.find((d) => d.baseModel === DEFAULT_BASE_MODEL) ??
    MODEL_DEFINITIONS[0];

  return (["high", "low"] as const).map((tier) => ({
    value: tier,
    label: (
      <>
        <ResolutionBadge resolution={labels[tier].badge} />{" "}
        <CreditBadge
          creditCost={determineCreditCostOfImageGeneration({
            model: def.models[tier],
          })}
        />
      </>
    ),
    description: labels[tier].mp,
  }));
}

interface ResolutionSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
  disabled?: boolean;
}

export function ResolutionSelector({
  value,
  onChange,
  disabled,
}: ResolutionSelectorProps) {
  const { baseModel, tier } = parseModel(value);
  const options = buildResolutionOptions(baseModel);

  return (
    <Select
      label="Resolution"
      value={tier}
      options={options}
      onChange={(newTier) => onChange(buildModel(baseModel, newTier))}
      disabled={disabled}
    />
  );
}
