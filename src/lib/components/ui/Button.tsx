import clsx from "clsx";
import type React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  // Visual variants
  variant?: "primary" | "secondary" | "ghost" | "icon";

  // Sizes
  size?: "sm" | "md" | "lg";

  // Icon support (auto-scaled based on size)
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  // States
  loading?: boolean; // Shows built-in spinner, hides children

  // Interaction behavior
  scaleOnHover?: boolean; // default: true for primary, false for others

  // Color scheme (icon variant only)
  colorScheme?: "dark" | "light"; // default: 'dark'
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
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  scaleOnHover,
  colorScheme = "dark",
  className,
  children,
  disabled,
  type = "button",
  ...props
}: ButtonProps) => {
  // Determine if scale effect should be applied
  const shouldScale =
    scaleOnHover !== undefined ? scaleOnHover : variant === "primary";

  // Icon size classes based on button size
  const iconSizeClass = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5",
  }[size];

  // Wrap icons with size class
  const wrappedLeftIcon = leftIcon ? (
    <span className={iconSizeClass}>{leftIcon}</span>
  ) : null;
  const wrappedRightIcon = rightIcon ? (
    <span className={iconSizeClass}>{rightIcon}</span>
  ) : null;

  // Base classes - shared by all variants
  const baseClasses = "inline-flex items-center justify-center transition-all";

  // Variant-specific classes
  const variantClasses = {
    primary: clsx([
      "rounded-xl font-semibold",
      loading || disabled
        ? "cursor-not-allowed bg-black/20 text-black/40"
        : "bg-black text-white hover:bg-black/90",
    ]),
    secondary: clsx([
      "rounded-xl border border-black/20 bg-white/75 font-medium text-black",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : "hover:border-black/30 hover:bg-black/5",
    ]),
    ghost: clsx([
      "rounded-lg text-black",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : "hover:bg-black/5",
    ]),
    icon: clsx([
      "rounded-full",
      colorScheme === "dark"
        ? "bg-black/80 text-white"
        : "bg-white/80 text-black",
      loading || disabled
        ? "cursor-not-allowed opacity-50"
        : "hover:bg-opacity-90",
    ]),
  }[variant];

  // Size-specific classes
  const sizeClasses = {
    primary: {
      sm: "px-3 py-1.5 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-sm gap-2",
    },
    secondary: {
      sm: "px-2 py-1 text-xs gap-1.5",
      md: "px-4 py-2 text-sm gap-2",
      lg: "px-6 py-3 text-sm gap-2",
    },
    ghost: {
      sm: "px-2 py-1 text-xs gap-1.5",
      md: "px-3 py-2 text-sm gap-2",
      lg: "px-4 py-3 text-sm gap-2",
    },
    icon: {
      sm: "p-1",
      md: "p-2",
      lg: "p-3",
    },
  }[variant][size];

  // Scale effect classes
  const scaleClasses =
    shouldScale && !loading && !disabled
      ? "hover:scale-[1.02] active:scale-[0.98]"
      : "";

  // Additional interaction classes for specific variants
  const interactionClasses =
    variant !== "icon" && !loading && !disabled
      ? "focus:outline-none focus:ring-2 focus:ring-black/20"
      : "";

  return (
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
          {wrappedLeftIcon}
          {children}
          {wrappedRightIcon}
        </>
      )}
    </button>
  );
};
