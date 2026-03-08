import {
  AspectRatioIcon,
  ContainerIcon,
  SectionIcon,
  SquareIcon,
} from "@radix-ui/react-icons";
import { ASPECT_RATIOS, type AspectRatio } from "@/lib/aspect-ratio";
import { Select, type SelectOption } from "@/lib/components/ui/Select";
import type { Model } from "@/lib/schemas";

export interface AspectRatioOption extends SelectOption<AspectRatio | null> {
  description?: string;
  disabled?: boolean;
}

interface AspectRatioSelectorProps {
  value: AspectRatio | null;
  onChange: (value: AspectRatio | null) => void;
  hasReferenceImages: boolean;
  model: Model;
  disabled?: boolean;
}

// Create icon component for different aspect ratio types
function getAspectRatioIcon(ratio: AspectRatio | null) {
  if (ratio === null) return AspectRatioIcon;

  const [width, height] = ratio.split(":").map(Number);
  if (width === height) return SquareIcon;
  if (width > height) return SectionIcon;
  return ContainerIcon;
}

export function AspectRatioSelector({
  value,
  onChange,
  hasReferenceImages,
  model,
  disabled,
}: AspectRatioSelectorProps) {
  const preserveDisabledReason =
    hasReferenceImages && model.startsWith("google/")
      ? "This AI model requires a concrete aspect ratio when reference images are included"
      : undefined;
  const preserveOption: AspectRatioOption = {
    value: null,
    label: "Preserve",
    description: "Keep original aspect ratio",
    icon: AspectRatioIcon,
    disabledReason: preserveDisabledReason,
  };

  const aspectRatioOptions: AspectRatioOption[] = Object.entries(
    ASPECT_RATIOS,
  ).map(([value, description]) => ({
    value: value as AspectRatio,
    label: value,
    description,
    icon: getAspectRatioIcon(value as AspectRatio),
  }));

  const allOptions = [preserveOption, ...aspectRatioOptions];

  return (
    <Select
      label="Aspect ratio"
      value={value}
      options={allOptions}
      onChange={onChange}
      disabled={disabled}
    />
  );
}
