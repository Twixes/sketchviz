"use client";

import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import clsx from "clsx";
import { motion } from "motion/react";
import { useCallback, useEffect } from "react";
import { TIME_MACHINE_SPRING } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

interface LayerNavigationControlsProps {
  currentIndex: number;
  totalLayers: number;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  className?: string;
  orientation?: "vertical" | "horizontal";
}

export function LayerNavigationControls({
  currentIndex,
  totalLayers,
  onPrevious,
  onNext,
  disabled = false,
  className,
  orientation = "vertical",
}: LayerNavigationControlsProps) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalLayers - 1;

  const isVertical = orientation === "vertical";
  const isHorizontal = orientation === "horizontal";

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      if (isVertical) {
        if (e.key === "ArrowUp" && canGoPrevious) {
          e.preventDefault();
          onPrevious();
        } else if (e.key === "ArrowDown" && canGoNext) {
          e.preventDefault();
          onNext();
        }
      } else {
        if (e.key === "ArrowLeft" && canGoPrevious) {
          e.preventDefault();
          onPrevious();
        } else if (e.key === "ArrowRight" && canGoNext) {
          e.preventDefault();
          onNext();
        }
      }
    },
    [disabled, canGoPrevious, canGoNext, onPrevious, onNext, isVertical],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (totalLayers <= 1) return null;

  const PreviousIcon = isVertical ? ChevronUpIcon : ChevronLeftIcon;
  const NextIcon = isVertical ? ChevronDownIcon : ChevronRightIcon;

  return (
    <motion.div
      className={clsx(
        "flex items-center gap-2",
        isVertical ? "flex-col" : "flex-row",
        className,
      )}
      initial={{ opacity: 0, [isVertical ? "x" : "y"]: isVertical ? 20 : 10 }}
      animate={{ opacity: 1, [isVertical ? "x" : "y"]: 0 }}
      transition={TIME_MACHINE_SPRING}
    >
      {/* Previous arrow */}
      <Button
        variant="icon"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious || disabled}
        className={clsx(
          "transition-all",
          canGoPrevious && !disabled
            ? isVertical
              ? "hover:scale-110"
              : "hover:scale-101"
            : "opacity-30 cursor-not-allowed",
          !isVertical && "grow",
        )}
        aria-label={`Go to previous layer${isHorizontal ? " (left)" : ""}`}
      >
        <PreviousIcon className="w-5 h-5" />
      </Button>

      {/* Layer indicator */}
      <div
        className={clsx(
          "flex items-center tabular-nums",
          isVertical ? "flex-col py-2" : "flex-row px-2",
        )}
      >
        <motion.span
          key={currentIndex}
          className={clsx(
            "font-semibold",
            isVertical ? "text-2xl" : "text-base",
          )}
          initial={{
            opacity: 0,
            [isVertical ? "y" : "x"]: isVertical ? -10 : -5,
          }}
          animate={{ opacity: 1, [isVertical ? "y" : "x"]: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentIndex}
        </motion.span>
        <span
          className={clsx(
            "text-black/50",
            isVertical ? "text-xs" : "text-base ml-1",
          )}
        >
          of {totalLayers - 1}
        </span>
      </div>

      {/* Next arrow */}
      <Button
        variant="icon"
        size="sm"
        onClick={onNext}
        disabled={!canGoNext || disabled}
        className={clsx(
          "transition-all",
          canGoNext && !disabled
            ? isVertical
              ? "hover:scale-110"
              : "hover:scale-101"
            : "opacity-30 cursor-not-allowed",
          !isVertical && "grow",
        )}
        aria-label={`Go to next layer${isHorizontal ? " (right)" : ""}`}
      >
        <NextIcon className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}
