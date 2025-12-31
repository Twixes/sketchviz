"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { SLOW_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import type { GenerateRequest } from "@/lib/schemas";
import { Hint } from "./Hint";

interface BeforeAfterComparisonProps {
  before: string;
  after: string;
  label: string;
  index: number;
  generateParams?: Pick<
    GenerateRequest,
    "indoor_light" | "outdoor_light" | "edit_description"
  >;
  onTryExample: (
    beforeUrl: string,
    generateParams?: Partial<GenerateRequest>,
  ) => void;
}

export function BeforeAfterComparison({
  before,
  after,
  label,
  index,
  generateParams,
  onTryExample,
}: BeforeAfterComparisonProps) {
  const [revealPercent, setRevealPercent] = useState(50 - (1 - index) * 10);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const handleTryExample = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTryExample(before, generateParams);
  };

  useEffect(() => {
    if (!isDragging) return;
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setRevealPercent(percent);
    };
    const handlePointerUp = () => setIsDragging(false);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SLOW_TRANSITION, delay: index * 0.05 }}
      className="flex select-none flex-col gap-3"
      ref={containerRef}
    >
      <div className="relative aspect-3/2 overflow-hidden rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_50px_-30px_rgba(12,12,12,0.3)]">
        {/* Before image (base layer - left side) */}
        <Image
          src={before}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
          width={300}
          height={300}
        />

        {/* After image (revealed on right side) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `polygon(${revealPercent}% 0%, 100% 0%, 100% 100%, ${revealPercent}% 100%)`,
          }}
        >
          <Image
            src={after}
            alt="After"
            className="h-full w-full object-cover"
            draggable={false}
            width={300}
            height={300}
          />
        </div>

        {/* Vertical divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${revealPercent}%` }}
        />

        {/* Labels */}
        <Hint position="top-left">Before</Hint>
        <Hint position="top-right">After</Hint>

        {/* Drag button - always visible on the divider */}
        <div
          className="flex items-center gap-0.5 absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2 py-1.5 text-xs font-medium text-black shadow-lg cursor-ew-resize touch-none"
          style={{ left: `${revealPercent}%` }}
          onPointerDown={(e) => {
            e.stopPropagation();
            setIsDragging(true);
          }}
        >
          <ArrowLeftIcon /> Drag <ArrowRightIcon />
        </div>

        {/* Try this out button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleTryExample}
          rightIcon={<Pencil1Icon className="size-3.5" />}
          className="absolute left-3 bottom-3 bg-white/80 hover:bg-white text-black/70 hover:text-black backdrop-blur-sm shadow-sm border-0 z-10"
        >
          Try this out
        </Button>
      </div>

      <p className="whitespace-nowrap text-center text-sm font-medium text-black/70">
        {label}
      </p>
    </motion.div>
  );
}
