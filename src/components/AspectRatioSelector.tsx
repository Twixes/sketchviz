import {
  AspectRatioIcon,
  ContainerIcon,
  SectionIcon,
  SquareIcon,
} from "@radix-ui/react-icons";
import {
  ASPECT_RATIO_LABELS,
  ASPECT_RATIOS,
  type AspectRatio,
} from "@/lib/aspect-ratio";
import { Select, type SelectOption } from "@/lib/components/ui/Select";

export interface AspectRatioOption extends SelectOption<AspectRatio | null> {
  description?: string;
  disabled?: boolean;
}

interface AspectRatioSelectorProps {
  value: AspectRatio | null;
  onChange: (value: AspectRatio | null) => void;
  hasReferenceImages: boolean;
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
  disabled,
}: AspectRatioSelectorProps) {
  const preserveOption: AspectRatioOption = {
    value: null,
    label: "Preserve",
    description: "Keep original aspect ratio",
    icon: AspectRatioIcon,
    disabledReason: hasReferenceImages
      ? "The AI models require a concrete aspect ratio when reference images are included"
      : undefined,
  };

  const aspectRatioOptions: AspectRatioOption[] = ASPECT_RATIOS.map(
    (ratio) => ({
      value: ratio,
      label: ratio,
      description: ASPECT_RATIO_LABELS[ratio],
      icon: getAspectRatioIcon(ratio),
    }),
  );

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
