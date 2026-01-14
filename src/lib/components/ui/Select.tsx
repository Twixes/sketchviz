import { CheckIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface SelectOption<T> {
  value: T;
  label: string | React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  description?: string | React.ReactNode;
  disabledReason?: string;
}

interface SelectProps<T> {
  label: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  allowCustomInput?: boolean;
  customInputPlaceholder?: string;
  disabled?: boolean;
}

export function Select<T extends string | null>({
  label,
  value,
  options,
  onChange,
  allowCustomInput = false,
  customInputPlaceholder = "…or specify it in text",
  disabled = false,
}: SelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  // Find the current option or determine if it's a custom value
  const currentOption = options.find((opt) => opt.value === value);
  const isCustomValue =
    allowCustomInput &&
    value !== null &&
    !options.some((opt) => opt.value === value);
  const customInputValue = isCustomValue ? (value as string) : "";
  const fallbackOption = options[0];

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={label} className="text-sm font-semibold text-black">
        {label}:
      </label>
      <Popover.Root open={isOpen && !disabled} onOpenChange={setIsOpen}>
        <Popover.Trigger
          disabled={disabled}
          className="inline-flex items-center justify-between gap-2 flex-1 rounded-xl border border-black/20 bg-white px-4 py-2 text-sm font-medium text-black transition-all duration-150 hover:bg-black/5 hover:border-black/30 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-black/20 min-w-30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-black/20"
        >
          <span id={label} className="flex items-center gap-2 truncate">
            {currentOption ? (
              <>
                <currentOption.icon className="size-4 shrink-0" />
                <div className="flex items-center gap-2">
                  {currentOption.label}
                </div>
              </>
            ) : isCustomValue ? (
              value
            ) : (
              // Fallback to first option if no match
              <>
                <fallbackOption.icon className="size-4 shrink-0" />
                <div className="flex items-center gap-2">
                  {fallbackOption.label}
                </div>
              </>
            )}
          </span>
          <span
            className={cn(
              "text-black/60 transition-transform duration-200",
              isOpen && "rotate-180",
            )}
          >
            ▼
          </span>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            className="z-50 overflow-hidden rounded-xl border border-black/20 bg-white shadow-xl p-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            align="start"
            sideOffset={4}
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const isDisabled = !!option.disabledReason;

              const button = (
                <Button
                  key={String(option.value ?? "null")}
                  variant="list-item"
                  isSelected={isSelected}
                  disabled={isDisabled}
                  onClick={() => {
                    if (!isDisabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className="group relative w-full pr-8"
                >
                  <option.icon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-150",
                      !isSelected && !isDisabled && "group-hover:scale-110",
                    )}
                  />
                  <div className="flex flex-col items-start flex-1">
                    <span
                      className={cn(
                        "flex items-center gap-2",
                        option.description && "font-medium",
                      )}
                    >
                      {option.label}
                    </span>
                    {option.description && (
                      <span
                        className={cn(
                          "text-xs",
                          isSelected ? "text-white/70" : "text-black/50",
                        )}
                      >
                        {option.description}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <CheckIcon className="absolute right-3 size-4 text-white" />
                  )}
                </Button>
              );

              // Wrap in tooltip if disabled and has tooltip text
              if (option.disabledReason) {
                return (
                  <Tooltip.Provider key={String(option.value ?? "null")}>
                    <Tooltip.Root delayDuration={200}>
                      <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Content
                          className="z-50 rounded-lg bg-black px-3 py-2 text-xs text-white shadow-lg max-w-xs"
                          sideOffset={5}
                        >
                          {option.disabledReason}
                          <Tooltip.Arrow className="fill-black" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  </Tooltip.Provider>
                );
              }

              return button;
            })}
            {allowCustomInput && (
              <div className="relative flex items-center gap-2 rounded-lg p-1 text-sm">
                <input
                  type="text"
                  value={customInputValue}
                  onChange={(e) => onChange((e.target.value || null) as T)}
                  placeholder={customInputPlaceholder}
                  disabled={disabled}
                  className="w-full rounded-lg border border-black/20 bg-white px-2 py-1.5 text-sm text-black placeholder:text-black/40 transition-transform duration-150 hover:border-black/30 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
