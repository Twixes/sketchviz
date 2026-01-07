import { useMutation } from "@tanstack/react-query";
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
  error?: string;
}

export function useRegenerateMutation() {
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

    onMutate: () => {
      setIsGenerating(true);
    },

    onSuccess: (data) => {
      updateGenerationOutput(data.generationId, data.outputImage);
      setIsGenerating(false);
    },

    onError: () => {
      setIsGenerating(false);
    },
  });
}
