import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";
import Link from "next/link";
import type React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  link?: string;

  // Visual variants
  variant?: "primary" | "secondary" | "ghost" | "icon" | "list-item";

  // Sizes
  size?: "sm" | "md" | "lg";

  // Icon support (auto-scaled based on size)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // States
  loading?: boolean; // Shows built-in spinner, hides children
  isSelected?: boolean; // Shows selected state (list-item variant only)

  // Interaction behavior
  scaleOnHover?: boolean; // default: true for primary, false for others

  // Color scheme (icon variant only)
  colorScheme?: "dark" | "light"; // default: 'dark'

  // Tooltip
  tooltip?: string | React.ReactNode;
}

const LoadingSpinner = ({ size }: { size: "sm" | "md" | "lg" }) => {
  const sizeClass = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  }[size];

  return (
    <svg
      className={clsx(sizeClass, "animate-spin")}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Loading"
    >
      <title>Loading</title>
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Button = ({
  link,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  isSelected = false,
  scaleOnHover,
  colorScheme = "dark",
  tooltip,
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) => {
  // Determine if scale effect should be applied
  const shouldScale =
    scaleOnHover !== undefined ? scaleOnHover : variant === "primary";

  // Base classes - shared by all variants (except list-item which needs different flex behavior)
  const baseClasses =
    variant === "list-item"
      ? "flex items-center transition-all"
      : "inline-flex items-center justify-center transition-all backdrop-blur-sm";

  // Variant-specific classes
  const variantClasses = {
    primary: clsx([
      "font-semibold",
      loading || disabled
        ? "cursor-not-allowed bg-black/20 text-black/40"
        : "bg-black text-white hover:bg-black/90",
    ]),
    secondary: clsx([
      "border border-black/20 bg-white/75 font-medium text-black",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : "hover:border-black/30 hover:bg-white/90",
    ]),
    ghost: clsx([
      "text-black",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : "hover:bg-black/5",
    ]),
    icon: clsx([
      colorScheme === "dark"
        ? "bg-black/80 text-white"
        : "bg-white/80 text-black",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : colorScheme === "dark"
          ? "hover:bg-black/90"
          : "hover:bg-white/90",
    ]),
    "list-item": clsx([
      "text-left",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : isSelected
          ? "bg-black text-white cursor-pointer"
          : "text-black hover:bg-black/5 focus-visible:bg-black/5 cursor-pointer active:scale-[0.98]",
    ]),
  }[variant];

  // Size-specific classes
  const sizeClasses = {
    primary: {
      sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
      md: "px-4 py-2 text-sm gap-2 rounded-xl",
      lg: "px-6 py-3 text-sm gap-2 rounded-xl",
    },
    secondary: {
      sm: "px-2 py-0.75 text-xs gap-1.5 rounded-lg",
      md: "px-4 py-2 text-sm gap-2 rounded-xl",
      lg: "px-6 py-3 text-sm gap-2 rounded-xl",
    },
    ghost: {
      sm: "px-2 py-0.75 text-xs gap-1.5 rounded-lg",
      md: "px-3 py-2 text-sm gap-2 rounded-xl",
      lg: "px-4 py-3 text-sm gap-2 rounded-xl",
    },
    icon: {
      sm: "p-1 rounded-lg",
      md: "p-2 rounded-xl",
      lg: "p-3 rounded-xl",
    },
    "list-item": {
      sm: "px-2 py-0.75 text-xs gap-2 rounded-lg",
      md: "px-3 py-2 text-sm gap-2 rounded-lg",
      lg: "px-4 py-3 text-sm gap-2 rounded-lg",
    },
  }[variant][size];

  // Scale effect classes
  const scaleClasses =
    shouldScale && !loading && !disabled
      ? "hover:scale-[1.02] active:scale-[0.98]"
      : "";

  // Additional interaction classes for specific variants
  const interactionClasses =
    variant !== "icon" && variant !== "list-item" && !loading && !disabled
      ? "focus:outline-none focus:ring-2 focus:ring-black/20"
      : "";

  const button = (
    <button
      type={type}
      disabled={loading || disabled}
      className={clsx(
        baseClasses,
        variantClasses,
        sizeClasses,
        scaleClasses,
        interactionClasses,
        className,
      )}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size} />
      ) : (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      )}
    </button>
  );

  const buttonWithTooltip = tooltip ? (
    <Tooltip.Provider>
      <Tooltip.Root delayDuration={200}>
        <Tooltip.Trigger asChild>{button}</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="z-50 rounded-lg bg-black px-3 py-2 text-xs text-white shadow-lg max-w-xs"
            sideOffset={5}
          >
            {tooltip}
            <Tooltip.Arrow className="fill-black" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  ) : (
    button
  );

  return link ? (
    <Link href={link} className="flex flex-col items-stretch">
      {buttonWithTooltip}
    </Link>
  ) : (
    buttonWithTooltip
  );
};
