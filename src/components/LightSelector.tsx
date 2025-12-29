import {
  DotFilledIcon,
  LightningBoltIcon,
  MagicWandIcon,
  StarIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import { useTranslations } from "next-globe-gen";
import { Select, type SelectOption } from "@/lib/components/ui/Select";

export interface LightOption extends SelectOption<string | null> {}

interface LightSelectorProps {
  label: string;
  value: string | null;
  options: LightOption[];
  customValuePlaceholder?: string;
  onChange: (value: string | null) => void;
}

export function LightSelector({
  label,
  value,
  options,
  customValuePlaceholder,
  onChange,
}: LightSelectorProps) {
  const t = useTranslations();

  return (
    <Select
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      allowCustomInput={true}
      customInputPlaceholder={
        customValuePlaceholder ?? t("lights.customPlaceholder")
      }
    />
  );
}

// Helper function to get translated outdoor light options
export function useOutdoorLightOptions(): LightOption[] {
  const t = useTranslations();
  return [
    { value: null, label: t("lights.auto"), icon: MagicWandIcon },
    { value: "sunny", label: t("lights.sunny"), icon: SunIcon },
    { value: "overcast", label: t("lights.overcast"), icon: DotFilledIcon },
    { value: "night", label: t("lights.night"), icon: StarIcon },
  ];
}

// Helper function to get translated indoor light options
export function useIndoorLightOptions(): LightOption[] {
  const t = useTranslations();
  return [
    { value: null, label: t("lights.auto"), icon: MagicWandIcon },
    { value: "all_on", label: t("lights.allOn"), icon: LightningBoltIcon },
    { value: "all_off", label: t("lights.allOff"), icon: DotFilledIcon },
  ];
}

// Legacy exports (kept for backwards compatibility but should use hooks above)
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
