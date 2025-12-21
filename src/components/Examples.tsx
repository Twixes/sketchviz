"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";

const EXAMPLES = [
  {
    before: "/before-test.png",
    after: "/after-test.jpg",
    label: "Living room",
  },
  {
    before: "/before-test.png",
    after: "/after-test.jpg",
    label: "Kitchen",
  },
  {
    before: "/before-test.png",
    after: "/after-test.jpg",
    label: "Exterior",
  },
];

interface ExampleItemProps {
  before: string;
  after: string;
  label: string;
}

function ExampleItem({ before, after, label }: ExampleItemProps) {
  const [revealPercent, setRevealPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = containerRef.current?.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      console.log({ label, mouseClientX: e.clientX, rectLeft: rect.left, x, percent });
      setRevealPercent(percent);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex select-none flex-col gap-3" ref={containerRef}>
      <div
        className="relative aspect-[4/3] cursor-ew-resize overflow-hidden rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_50px_-30px_rgba(12,12,12,0.3)]"
        onMouseDown={() => setIsDragging(true)}
      >
        {/* Before image (base layer - left side) */}
        <img
          src={before}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />

        {/* After image (revealed on right side) */}
        <div
          className="absolute inset-0"
          style={{
            clipPath: `polygon(${revealPercent}% 0%, 100% 0%, 100% 100%, ${revealPercent}% 100%)`,
          }}
        >
          <img
            src={after}
            alt="After"
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>

        {/* Vertical divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
          style={{ left: `${revealPercent}%` }}
        />

        {/* Labels */}
        <div className="pointer-events-none absolute left-3 top-3 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          Before
        </div>
        <div className="pointer-events-none absolute right-3 top-3 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          After
        </div>

        {/* Drag button - always visible on the divider */}
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-medium text-black shadow-lg"
          style={{ left: `${revealPercent}%` }}
        >
          ← Drag →
        </div>
      </div>

      <p className="whitespace-nowrap text-center text-sm font-medium text-black/70">{label}</p>
    </div>
  );
}

export function Examples() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="grid gap-6 sm:grid-cols-3"
    >
      {EXAMPLES.map((example) => (
        <ExampleItem
          key={example.label}
          before={example.before}
          after={example.after}
          label={example.label}
        />
      ))}
    </motion.section>
  );
}
