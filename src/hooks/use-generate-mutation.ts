import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

interface GenerateParams {
  blobUrl: string;
  threadId?: string;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model?: Model;
  aspectRatio?: AspectRatio | null;
}

interface GenerateResponse {
  outputImage: string;
  threadId: string;
  generationId: string;
  width: number;
  height: number;
  error?: string;
}

export function useGenerateMutation() {
  const { setError, setIsGenerating, referenceImages } = useThreadEditorStore();

  return useMutation({
    mutationFn: async ({
      blobUrl,
      threadId,
      outdoorLight,
      indoorLight,
      editDescription,
      model,
      aspectRatio,
    }: GenerateParams): Promise<GenerateResponse> => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input_url: blobUrl,
          thread_id: threadId,
          outdoor_light: outdoorLight,
          indoor_light: indoorLight,
          edit_description: editDescription,
          model,
          aspect_ratio: aspectRatio,
          reference_image_urls: referenceImages
            .filter((img) => img.blobUrl !== null)
            .map((img) => img.blobUrl),
        }),
      });

      const payload: GenerateResponse = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Generation failed.");
      }

      return payload;
    },

    onMutate: ({
      outdoorLight,
      indoorLight,
      editDescription,
      model,
      aspectRatio,
    }) => {
      setError(null);
      setIsGenerating(true);
      posthog.capture("generation_started", {
        outdoor_light: outdoorLight,
        indoor_light: indoorLight,
        has_edit_description: editDescription !== null,
        model,
        aspect_ratio: aspectRatio,
        reference_image_count: referenceImages.filter(
          (img) => img.blobUrl !== null,
        ).length,
      });
    },

    onSuccess: (data, variables) => {
      setIsGenerating(false);
      posthog.capture("generation_completed", {
        thread_id: data.threadId,
        generation_id: data.generationId,
        outdoor_light: variables.outdoorLight,
        indoor_light: variables.indoorLight,
        has_edit_description: variables.editDescription !== null,
        model: variables.model,
        aspect_ratio: variables.aspectRatio,
        reference_image_count: referenceImages.filter(
          (img) => img.blobUrl !== null,
        ).length,
      });
    },

    onError: (error, variables) => {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setError(message);
      setIsGenerating(false);
      posthog.capture("generation_failed", {
        error: message,
        outdoor_light: variables.outdoorLight,
        indoor_light: variables.indoorLight,
        has_edit_description: variables.editDescription !== null,
        model: variables.model,
        aspect_ratio: variables.aspectRatio,
        reference_image_count: referenceImages.filter(
          (img) => img.blobUrl !== null,
        ).length,
      });
    },
  });
}
