import clsx from "clsx";
import type { ReactNode } from "react";

type HintProps = {
  children: ReactNode;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
};

export function Hint({
  children,
  position = "top-left",
  className,
}: HintProps) {
  return (
    <div
      className={clsx(
        "pointer-events-none absolute whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm z-10",
        {
          "left-4 top-4": position === "top-left",
          "right-4 top-4": position === "top-right",
          "left-4 bottom-4": position === "bottom-left",
          "right-4 bottom-4": position === "bottom-right",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
