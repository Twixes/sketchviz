import { LightningBoltIcon, RocketIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import { useState } from "react";
import type { Model } from "@/lib/schemas";

export interface ModelOption {
  value: Model;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModelSelectorProps {
  value: Model;
  onChange: (value: Model) => void;
}

export const MODEL_OPTIONS: ModelOption[] = [
  {
    value: "google/gemini-3-pro-image-preview",
    label: "Nano Banana Pro",
    description: "Highest quality (recommended). By Google.",
    icon: RocketIcon,
  },
  {
    value: "google/gemini-2.5-flash-image-preview",
    label: "Nano Banana",
    description: "Faster, but less reliable. By Google.",
    icon: LightningBoltIcon,
  },
];

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = MODEL_OPTIONS.find((opt) => opt.value === value);

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="model" className="text-sm font-semibold text-black">
        AI model:
      </label>
      <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
        <Popover.Trigger className="inline-flex items-center justify-between gap-2 flex-1 rounded-xl border border-black/20 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20 min-w-30">
          <span id="model" className="flex items-center gap-2 truncate">
            {currentOption ? (
              <>
                <currentOption.icon className="size-4" />
                {currentOption.label}
              </>
            ) : (
              <>
                <RocketIcon className="size-4" />
                Nano Banana Pro
              </>
            )}
          </span>
          <span className="text-black/60">▼</span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 overflow-hidden rounded-xl border border-black/20 bg-white shadow-lg p-1"
            align="start"
            sideOffset={4}
          >
            {MODEL_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="relative text-left flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-black outline-none hover:bg-black/5 focus:bg-black/10"
              >
                <option.icon className="size-4 shrink-0" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-black/50">
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
