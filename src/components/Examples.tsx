"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const EXAMPLES = [
  {
    before: "/kitchen-before.webp",
    after: "/kitchen-after.webp",
    label: "For interior design",
  },
  {
    before: "/house-before.webp",
    after: "/house-after.webp",
    label: "For architecture",
  },
  {
    before: "/anything-before.webp",
    after: "/anything-after.webp",
    label: "For absolutely anything",
  },
];

interface ExampleItemProps {
  before: string;
  after: string;
  label: string;
  index: number;
}

function ExampleItem({ before, after, label, index }: ExampleItemProps) {
  const [revealPercent, setRevealPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

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
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
      className="flex select-none flex-col gap-3"
      ref={containerRef}
    >
      <button
        className="relative aspect-[3/2] cursor-ew-resize overflow-hidden rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_50px_-30px_rgba(12,12,12,0.3)] touch-none"
        onPointerDown={() => setIsDragging(true)}
        type="button"
      >
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
        <div className="pointer-events-none absolute left-3 top-3 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
          After
        </div>

        {/* Drag button - always visible on the divider */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg"
          style={{ left: `${revealPercent}%` }}
        >
          ← Drag →
        </div>
      </button>

      <p className="whitespace-nowrap text-center text-sm font-medium text-black/70">
        {label}
      </p>
    </motion.div>
  );
}

export function Examples() {
  return (
    <motion.section className="grid gap-6 sm:grid-cols-3">
      {EXAMPLES.map((example, index) => (
        <ExampleItem
          key={example.label}
          before={example.before}
          after={example.after}
          label={example.label}
          index={index}
        />
      ))}
    </motion.section>
  );
}
