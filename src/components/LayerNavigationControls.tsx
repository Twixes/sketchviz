"use client";

import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
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
}

export function LayerNavigationControls({
  currentIndex,
  totalLayers,
  onPrevious,
  onNext,
  disabled = false,
}: LayerNavigationControlsProps) {
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < totalLayers - 1;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      if (e.key === "ArrowUp" && canGoPrevious) {
        e.preventDefault();
        onPrevious();
      } else if (e.key === "ArrowDown" && canGoNext) {
        e.preventDefault();
        onNext();
      }
    },
    [disabled, canGoPrevious, canGoNext, onPrevious, onNext],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (totalLayers <= 1) return null;

  return (
    <motion.div
      className="flex flex-col items-center gap-2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={TIME_MACHINE_SPRING}
    >
      {/* Up arrow (to previous/older layer) */}
      <Button
        variant="icon"
        size="sm"
        onClick={onPrevious}
        disabled={!canGoPrevious || disabled}
        className={clsx(
          "transition-all",
          canGoPrevious && !disabled
            ? "hover:scale-110"
            : "opacity-30 cursor-not-allowed",
        )}
        aria-label="Go to previous layer"
      >
        <ChevronUpIcon className="w-5 h-5" />
      </Button>

      {/* Layer indicator */}
      <div className="flex flex-col items-center py-2">
        <motion.span
          key={currentIndex}
          className="text-2xl font-semibold tabular-nums"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {currentIndex}
        </motion.span>
        <span className="text-xs text-black/50">of {totalLayers - 1}</span>
      </div>

      {/* Down arrow (to next/newer layer) */}
      <Button
        variant="icon"
        size="sm"
        onClick={onNext}
        disabled={!canGoNext || disabled}
        className={clsx(
          "transition-all",
          canGoNext && !disabled
            ? "hover:scale-110"
            : "opacity-30 cursor-not-allowed",
        )}
        aria-label="Go to next layer"
      >
        <ChevronDownIcon className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}
