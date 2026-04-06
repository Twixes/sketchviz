import { CheckIcon } from "@radix-ui/react-icons";
import * as Popover from "@radix-ui/react-popover";
import * as Tooltip from "@radix-ui/react-tooltip";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface SelectOption<T> {
  value: T;
  label: string | React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  description?: string | React.ReactNode;
  disabledReason?: string;
}

interface SelectProps<T, OptionT extends T = T> {
  label: string;
  value: T;
  options: SelectOption<OptionT>[];
  onChange: (value: T) => void;
  required?: boolean;
  placeholder?: React.ReactNode;
  allowCustomInput?: boolean;
  customInputPlaceholder?: string;
  disabled?: boolean;
  layout?: "horizontal" | "vertical";
}

export function Select<T extends string | null, OptionT extends T = T>({
  label,
  value,
  options,
  onChange,
  required = true,
  placeholder = "Select an option",
  allowCustomInput = false,
  customInputPlaceholder = "…or specify it in text",
  disabled = false,
  layout = "horizontal",
}: SelectProps<T, OptionT>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerId = `select-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  // Find the current option or determine if it's a custom value
  const currentOption = options.find((opt) => opt.value === value);
  const isCustomValue =
    allowCustomInput &&
    value !== null &&
    !options.some((opt) => opt.value === value);
  const customInputValue = isCustomValue ? (value as string) : "";
  const fallbackOption = options[0];
  const showPlaceholder = !required && !currentOption && !isCustomValue;

  return (
    <div
      className={cn(
        layout === "vertical"
          ? "flex flex-col gap-1.5"
          : "flex items-center gap-2",
      )}
    >
      <label
        htmlFor={triggerId}
        className={cn(
          "text-black",
          layout === "vertical"
            ? "text-sm font-medium text-black/70"
            : "text-sm font-semibold",
        )}
      >
        {layout === "vertical" ? label : `${label}:`}
      </label>
      <Popover.Root open={isOpen && !disabled} onOpenChange={setIsOpen}>
        <Popover.Trigger
          id={triggerId}
          disabled={disabled}
          className={cn(
            "inline-flex items-center justify-between gap-2 rounded-lg border border-black/20 bg-white px-3 py-2 text-sm font-medium text-black transition-all duration-150 hover:bg-black/5 hover:border-black/40 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-black/20 min-w-30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-black/20",
            layout === "vertical" ? "w-full" : "flex-1",
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {showPlaceholder ? (
              <span className="text-black/40">{placeholder}</span>
            ) : currentOption ? (
              <>
                {currentOption.icon && (
                  <currentOption.icon className="size-4 shrink-0" />
                )}
                <div className="flex items-center gap-2">
                  {currentOption.label}
                </div>
              </>
            ) : isCustomValue ? (
              value
            ) : (
              // Fallback to first option if no match
              <>
                {fallbackOption.icon && (
                  <fallbackOption.icon className="size-4 shrink-0" />
                )}
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
            className="z-50 overflow-hidden flex flex-col gap-px rounded-lg border border-black/20 bg-white shadow-xl p-1 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
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
                      if (!required && isSelected) {
                        onChange(null as T);
                      } else {
                        onChange(option.value);
                      }
                      setIsOpen(false);
                    }
                  }}
                  className="group relative w-full pr-8 rounded-md"
                >
                  {option.icon && (
                    <option.icon
                      className={cn(
                        "size-4 shrink-0 transition-transform duration-150",
                        !isSelected && !isDisabled && "group-hover:scale-110",
                      )}
                    />
                  )}
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
                          "text-xs leading-tight",
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
                          className="z-50 rounded-md bg-black px-3 py-2 text-xs text-white shadow-lg max-w-xs"
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
              <div className="relative flex items-center gap-2 p-1 text-sm">
                <input
                  type="text"
                  value={customInputValue}
                  onChange={(e) => onChange((e.target.value || null) as T)}
                  placeholder={customInputPlaceholder}
                  disabled={disabled}
                  className="w-full rounded-lg border border-black/20 bg-white px-2 py-2 text-sm text-black placeholder:text-black/40 transition-transform duration-150 hover:border-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black/40 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
