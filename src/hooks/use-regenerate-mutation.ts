import { useMutation, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import toast from "react-hot-toast";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

interface RegenerateParams {
  generationId: string;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model?: Model;
  aspectRatio?: AspectRatio | null;
}

interface RegenerateResponse {
  outputImage: string;
  generationId: string;
  threadId: string;
  width: number;
  height: number;
  error?: string;
}

export function useRegenerateMutation() {
  const queryClient = useQueryClient();
  const {
    referenceImages,
    setIsGenerating,
    updateGenerationOutput,
    navigateNext,
  } = useThreadEditorStore();

  return useMutation({
    mutationFn: async ({
      generationId,
      outdoorLight,
      indoorLight,
      editDescription,
      model,
      aspectRatio,
    }: RegenerateParams): Promise<RegenerateResponse> => {
      const response = await fetch(
        `/api/generations/${generationId}/regenerate`,
        {
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
            reference_image_urls: referenceImages
              .filter((img) => img.blobUrl !== null)
              .map((img) => img.blobUrl),
          }),
        },
      );

      const payload: RegenerateResponse = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Regeneration failed.");
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
    }) => {
      setIsGenerating(true);
      posthog.capture("regeneration_started", {
        generation_id: generationId,
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
      updateGenerationOutput(
        data.generationId,
        data.outputImage,
        data.width,
        data.height,
      );
      setIsGenerating(false);
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      navigateNext();
      posthog.capture("regeneration_completed", {
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
      setIsGenerating(false);
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      toast.error(message);
      posthog.capture("regeneration_failed", {
        error: message,
        generation_id: variables.generationId,
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
