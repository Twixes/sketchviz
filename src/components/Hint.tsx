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
        "pointer-events-none absolute whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm",
        {
          "left-3 top-3": position === "top-left",
          "right-3 top-3": position === "top-right",
          "left-3 bottom-3": position === "bottom-left",
          "right-3 bottom-3": position === "bottom-right",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
