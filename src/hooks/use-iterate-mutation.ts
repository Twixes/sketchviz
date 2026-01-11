import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

interface IterateParams {
  generationId: string;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model?: Model;
  aspectRatio?: AspectRatio | null;
  useBasePrompt?: boolean;
}

interface IterateResponse {
  outputImage: string;
  generationId: string;
  threadId: string;
  width: number;
  height: number;
  error?: string;
}

export function useIterateMutation() {
  const { referenceImages, setIsGenerating, updateGenerationOutput } =
    useThreadEditorStore();

  return useMutation({
    mutationFn: async ({
      generationId,
      outdoorLight,
      indoorLight,
      editDescription,
      model,
      aspectRatio,
      useBasePrompt = false,
    }: IterateParams): Promise<IterateResponse> => {
      const response = await fetch(`/api/generations/${generationId}/iterate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          outdoor_light: outdoorLight,
          indoor_light: indoorLight,
          edit_description: editDescription,
          model,
          aspect_ratio: aspectRatio,
          use_base_prompt: useBasePrompt,
          reference_image_urls: referenceImages
            .filter((img) => img.blobUrl !== null)
            .map((img) => img.blobUrl),
        }),
      });

      const payload: IterateResponse = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Iteration failed.");
      }

      return payload;
    },

    onMutate: ({
      generationId,
      outdoorLight,
      indoorLight,
      editDescription,
      model,
      aspectRatio,
      useBasePrompt,
    }) => {
      setIsGenerating(true);
      posthog.capture("iteration_started", {
        generation_id: generationId,
        outdoor_light: outdoorLight,
        indoor_light: indoorLight,
        has_edit_description: editDescription !== null,
        model,
        aspect_ratio: aspectRatio,
        use_base_prompt: useBasePrompt,
        reference_image_count: referenceImages.filter(
          (img) => img.blobUrl !== null,
        ).length,
      });
    },

    onSuccess: (data, variables) => {
      // The generation was already added optimistically or we need to update it
      updateGenerationOutput(
        data.generationId,
        data.outputImage,
        data.width,
        data.height,
      );
      setIsGenerating(false);
      posthog.capture("iteration_completed", {
        thread_id: data.threadId,
        generation_id: data.generationId,
        outdoor_light: variables.outdoorLight,
        indoor_light: variables.indoorLight,
        has_edit_description: variables.editDescription !== null,
        model: variables.model,
        aspect_ratio: variables.aspectRatio,
        use_base_prompt: variables.useBasePrompt,
        reference_image_count: referenceImages.filter(
          (img) => img.blobUrl !== null,
        ).length,
      });
    },

    onError: (error, variables) => {
      setIsGenerating(false);
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      posthog.capture("iteration_failed", {
        error: message,
        generation_id: variables.generationId,
        outdoor_light: variables.outdoorLight,
        indoor_light: variables.indoorLight,
        has_edit_description: variables.editDescription !== null,
        model: variables.model,
        aspect_ratio: variables.aspectRatio,
        use_base_prompt: variables.useBasePrompt,
        reference_image_count: referenceImages.filter(
          (img) => img.blobUrl !== null,
        ).length,
      });
    },
  });
}
