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
        "pointer-events-none absolute whitespace-nowrap rounded-md bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm z-10",
        {
          "left-2 top-2": position === "top-left",
          "right-2 top-2": position === "top-right",
          "left-2 bottom-2": position === "bottom-left",
          "right-2 bottom-2": position === "bottom-right",
        },
        className,
      )}
    >
      {children}
    </div>
  );
}
