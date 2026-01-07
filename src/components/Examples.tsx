"use client";

import { useRouter } from "next/navigation";
import { uuidv7 } from "uuidv7";
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
  const {
    setInputSrc,
    setBlobUrl,
    setEditDescription,
    setIndoorLight,
    setOutdoorLight,
    setTentativeThreadId,
  } = useThreadEditorStore();

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
      // Set parameters if available
      setEditDescription(generateParams?.edit_description ?? null);
      setIndoorLight(generateParams?.indoor_light ?? null);
      setOutdoorLight(generateParams?.outdoor_light ?? null);
      // Generate a tentative thread ID and navigate to the thread page
      const threadId = uuidv7();
      setTentativeThreadId(threadId);
      router.push(`/threads/${threadId}`);
    } catch (error) {
      console.error("Failed to load example:", error);
    }
  };

  return (
    <section className="grid gap-6 sm:grid-cols-3 text-balance">
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
