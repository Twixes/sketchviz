import {
  DotFilledIcon,
  LightningBoltIcon,
  MagicWandIcon,
  StarIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { Select, type SelectOption } from "@/lib/components/ui/Select";

export interface LightOption extends SelectOption<string | null> {}

interface LightSelectorProps {
  label: string;
  value: string | null;
  options: LightOption[];
  customValuePlaceholder?: string;
  onChange: (value: string | null) => void;
  disabled?: boolean;
}

export function LightSelector({
  label,
  value,
  options,
  customValuePlaceholder = "…or specify it in text",
  onChange,
  disabled,
}: LightSelectorProps) {
  return (
    <Select
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      allowCustomInput={true}
      customInputPlaceholder={customValuePlaceholder}
      disabled={disabled}
    />
  );
}

// Pre-defined option sets for common use cases
export const OUTDOOR_LIGHT_OPTIONS: LightOption[] = [
  { value: null, label: "Auto", icon: MagicWandIcon },
  { value: "sunny", label: "Sunny", icon: SunIcon },
  { value: "overcast", label: "Overcast", icon: DotFilledIcon },
  { value: "night", label: "Night", icon: StarIcon },
];

export const INDOOR_LIGHT_OPTIONS: LightOption[] = [
  { value: null, label: "Auto", icon: MagicWandIcon },
  { value: "all_on", label: "All lights on", icon: LightningBoltIcon },
  { value: "all_off", label: "All lights off", icon: DotFilledIcon },
];
