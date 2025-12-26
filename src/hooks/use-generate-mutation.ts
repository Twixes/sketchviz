import { useMutation } from "@tanstack/react-query";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";
import { useUploadStore } from "@/stores/upload-store";

interface GenerateParams {
  blobUrl: string;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model?: Model;
  aspectRatio?: AspectRatio | null;
}

interface GenerateResponse {
  outputImage: string;
  error?: string;
}

export function useGenerateMutation() {
  const { setOutputSrc, setError, setIsGenerating, referenceImages } =
    useUploadStore();

  return useMutation({
    mutationFn: async ({
      blobUrl,
      outdoorLight,
      indoorLight,
      editDescription,
      model,
      aspectRatio,
    }: GenerateParams): Promise<string> => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blobUrl,
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

      return payload.outputImage;
    },

    onMutate: () => {
      setError(null);
      setOutputSrc(null);
      setIsGenerating(true);
    },

    onSuccess: (outputImage) => {
      setOutputSrc(outputImage);
      setIsGenerating(false);
    },

    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setError(message);
      setIsGenerating(false);
    },
  });
}
