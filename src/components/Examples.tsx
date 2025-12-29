"use client";

import {
  ArrowLeftIcon,
  ArrowRightIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Image from "next/image";
import { useTranslations } from "next-globe-gen";
import { useEffect, useRef, useState } from "react";
import type { GenerateRequest } from "@/lib/schemas";
import { useUploadStore } from "@/stores/upload-store";

interface ExampleConfig {
  before: string;
  after: string;
  labelKey: string;
  generateParams?: Partial<GenerateRequest>;
}

const EXAMPLE_CONFIGS: ExampleConfig[] = [
  {
    before: "/kitchen-before.webp",
    after: "/kitchen-after.webp",
    labelKey: "examples.interiorDesign",
    generateParams: {
      indoor_light: "all_on",
      outdoor_light: "night",
    },
  },
  {
    before: "/house-before.webp",
    after: "/house-after.webp",
    labelKey: "examples.architecture",
    generateParams: {
      edit_description:
        "Place the house alongside an Albuquerque suburban street, with deserty hills in the background",
    },
  },
  {
    before: "/anything-before.webp",
    after: "/anything-after.webp",
    labelKey: "examples.anything",
  },
];

interface ExampleItemProps {
  before: string;
  after: string;
  label: string;
  index: number;
  generateParams?: Pick<
    GenerateRequest,
    "indoor_light" | "outdoor_light" | "edit_description"
  >;
}

function ExampleItem({
  before,
  after,
  label,
  index,
  generateParams,
}: ExampleItemProps) {
  const t = useTranslations();
  const [revealPercent, setRevealPercent] = useState(50 - (1 - index) * 10);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const {
    setInputSrc,
    setBlobUrl,
    setEditDescription,
    setIndoorLight,
    setOutdoorLight,
  } = useUploadStore();

  const handleTryExample = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Fetch the static image
      const response = await fetch(before);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Set the local blob URL for preview
      setInputSrc(objectUrl);

      // Set the full URL for the generate API to fetch from
      const fullUrl = new URL(before, window.location.origin).href;
      setBlobUrl(fullUrl);

      // Set edit description if available
      setEditDescription(generateParams?.edit_description ?? null);
      setIndoorLight(generateParams?.indoor_light ?? null);
      setOutdoorLight(generateParams?.outdoor_light ?? null);
    } catch (error) {
      console.error("Failed to load example:", error);
    }
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
      transition={{ duration: 0.4, ease: "easeOut", delay: index * 0.05 }}
      className="flex select-none flex-col gap-3"
      ref={containerRef}
    >
      <div
        className="relative aspect-3/2 cursor-ew-resize overflow-hidden rounded-2xl border border-black/10 bg-black/5 shadow-[0_20px_50px_-30px_rgba(12,12,12,0.3)] touch-none"
        onPointerDown={() => setIsDragging(true)}
      >
        {/* Before image (base layer - left side) */}
        <Image
          src={before}
          alt={t("examples.before")}
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
            alt={t("examples.after")}
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
          {t("examples.before")}
        </div>
        <div className="pointer-events-none absolute right-3 top-3 whitespace-nowrap rounded-lg bg-black/60 px-2 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm">
          {t("examples.after")}
        </div>

        {/* Drag button - always visible on the divider */}
        <div
          className="flex items-center gap-0.5 absolute top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white px-2 py-1.5 text-xs font-medium text-black shadow-lg"
          style={{ left: `${revealPercent}%` }}
        >
          <ArrowLeftIcon /> {t("examples.drag")} <ArrowRightIcon />
        </div>

        {/* Try this out button */}
        <button
          onClick={handleTryExample}
          className="flex items-center gap-0.5 absolute left-3 bottom-3 whitespace-nowrap rounded-lg bg-white/80 hover:bg-white transition-colors px-2.5 py-1 text-xs font-medium text-black/70 hover:text-black shadow-sm backdrop-blur-sm z-10"
          type="button"
        >
          {t("examples.tryOut")} <Pencil1Icon className="size-3.5" />
        </button>
      </div>

      <p className="whitespace-nowrap text-center text-sm font-medium text-black/70">
        {label}
      </p>
    </motion.div>
  );
}

export function Examples() {
  const t = useTranslations();

  return (
    <motion.section className="grid gap-6 sm:grid-cols-3">
      {EXAMPLE_CONFIGS.map((config, index) => (
        <ExampleItem
          key={config.labelKey}
          before={config.before}
          after={config.after}
          label={t(config.labelKey)}
          index={index}
          generateParams={config.generateParams}
        />
      ))}
    </motion.section>
  );
}
