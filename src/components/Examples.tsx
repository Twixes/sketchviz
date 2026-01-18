"use client";

import { useRouter } from "next/navigation";
import type { GenerateRequest } from "@/lib/schemas";
import { useThreadEditorStore } from "@/stores/thread-editor-store";
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
    label: "For industrial design",
  },
];

export function Examples() {
  const router = useRouter();
  const { startNewThread } = useThreadEditorStore();

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
      // Set the full URL for the generate API to fetch from
      const fullUrl = new URL(beforeUrl, window.location.origin).href;
      // Start new thread with initial parameters
      const threadId = startNewThread({
        initialParams: {
          inputSrc: objectUrl,
          blobUrl: fullUrl,
          editDescription: generateParams?.edit_description ?? null,
          indoorLight: generateParams?.indoor_light ?? null,
          outdoorLight: generateParams?.outdoor_light ?? null,
        },
      });
      router.push(`/threads/${threadId}`);
    } catch (error) {
      console.error("Failed to load example:", error);
    }
  };

  return (
    <section className="grid gap-6 md:grid-cols-3 text-balance">
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
    </section>
  );
}
