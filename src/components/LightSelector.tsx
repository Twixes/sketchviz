import {
  DotFilledIcon,
  LightningBoltIcon,
  MagicWandIcon,
  StarIcon,
  SunIcon,
} from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";

export interface LightOption {
  value: string | null;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

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
  customValuePlaceholder = "…or specify it in text",
  onChange,
}: LightSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the current option or determine if it's a custom value
  const currentOption = options.find((opt) => opt.value === value);
  const isCustomValue =
    value !== null && !options.some((opt) => opt.value === value);
  const customInputValue = isCustomValue ? value : "";

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={label} className="text-sm font-semibold text-black">
        {label}:
      </label>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger className="inline-flex items-center justify-between gap-2 flex-1 rounded-xl border border-black/20 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20 min-w-30">
          <span id={label} className="flex items-center gap-2 truncate">
            {currentOption ? (
              <>
                <currentOption.icon className="size-4" />
                {currentOption.label}
              </>
            ) : isCustomValue ? (
              value
            ) : (
              <>
                <MagicWandIcon className="size-4" />
                Auto
              </>
            )}
          </span>
          <span className="text-black/60">▼</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 overflow-hidden rounded-xl border border-black/20 bg-white shadow-lg p-1 w-48"
            align="start"
            sideOffset={4}
          >
            {options.map((option) => (
              <button
                key={option.value ?? "auto"}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="relative flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-black outline-none hover:bg-black/5 focus:bg-black/10"
              >
                <option.icon className="size-4" />
                <span>{option.label}</span>
              </button>
            ))}
            <div className="relative flex items-center gap-2 rounded-lg p-1 text-sm">
              <input
                type="text"
                value={customInputValue}
                onChange={(e) => onChange(e.target.value || null)}
                placeholder={customValuePlaceholder}
                className="w-full rounded-lg border border-black/20 bg-white px-2 py-1.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
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
  { value: "all_on", label: "All on", icon: LightningBoltIcon },
  { value: "all_off", label: "All off", icon: DotFilledIcon },
];
