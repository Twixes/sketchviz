import { useMutation } from "@tanstack/react-query";
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

    onMutate: () => {
      setIsGenerating(true);
    },

    onSuccess: (data) => {
      // The generation was already added optimistically or we need to update it
      updateGenerationOutput(data.generationId, data.outputImage);
      setIsGenerating(false);
    },

    onError: () => {
      setIsGenerating(false);
    },
  });
}
