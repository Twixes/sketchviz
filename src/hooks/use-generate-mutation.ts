import { useMutation } from "@tanstack/react-query";
import { useUploadStore } from "@/stores/upload-store";

interface GenerateParams {
  blobUrl: string;
  lightConditions: "sunny" | "overcast" | null;
  editDescription: string | null;
}

interface GenerateResponse {
  outputImage: string;
  error?: string;
}

export function useGenerateMutation() {
  const { setOutputSrc, setError, setIsGenerating } = useUploadStore();

  return useMutation({
    mutationFn: async ({
      blobUrl,
      lightConditions,
      editDescription,
    }: GenerateParams): Promise<string> => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blobUrl,
          outside_light_conditions: lightConditions,
          edit_description: editDescription,
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
