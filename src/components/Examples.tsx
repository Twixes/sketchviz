"use client";

import { motion } from "motion/react";
import type { GenerateRequest } from "@/lib/schemas";
import { useUploadStore } from "@/stores/upload-store";
import { BeforeAfterComparison } from "./BeforeAfterComparison";

const EXAMPLES: {
  before: string;
  after: string;
  label: string;
  generateParams?: Partial<GenerateRequest>;
}[] = [
  {
    before: "/kitchen-before.webp",
    after: "/kitchen-after.webp",
    label: "For interior design",
    generateParams: {
      indoor_light: "all_on",
      outdoor_light: "night",
    },
  },
  {
    before: "/house-before.webp",
    after: "/house-after.webp",
    label: "For architecture",
    generateParams: {
      edit_description:
        "Place the house alongside an Albuquerque suburban street, with deserty hills in the background",
    },
  },
  {
    before: "/anything-before.webp",
    after: "/anything-after.webp",
    label: "For absolutely anything",
  },
];

export function Examples() {
  const {
    setInputSrc,
    setBlobUrl,
    setEditDescription,
    setIndoorLight,
    setOutdoorLight,
  } = useUploadStore();

  const handleTryExample = async (
    beforeUrl: string,
    generateParams?: Partial<GenerateRequest>,
  ) => {
    try {
      // Fetch the static image
      const response = await fetch(beforeUrl);
      if (!response.ok) throw new Error("Failed to fetch image");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Set the local blob URL for preview
      setInputSrc(objectUrl);

      // Set the full URL for the generate API to fetch from
      const fullUrl = new URL(beforeUrl, window.location.origin).href;
      setBlobUrl(fullUrl);

      // Set edit description if available
      setEditDescription(generateParams?.edit_description ?? null);
      setIndoorLight(generateParams?.indoor_light ?? null);
      setOutdoorLight(generateParams?.outdoor_light ?? null);
    } catch (error) {
      console.error("Failed to load example:", error);
    }
  };

  return (
    <motion.section className="grid gap-6 sm:grid-cols-3">
      {EXAMPLES.map((example, index) => (
        <BeforeAfterComparison
          key={example.label}
          before={example.before}
          after={example.after}
          label={example.label}
          index={index}
          generateParams={example.generateParams}
          onTryExample={handleTryExample}
        />
      ))}
    </motion.section>
  );
}
