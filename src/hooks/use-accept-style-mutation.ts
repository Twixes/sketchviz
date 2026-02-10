import { useMutation, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { toast } from "sonner";

interface AcceptStyleParams {
  projectId: string;
  generationId: string;
}

interface AcceptStyleResponse {
  style_notes: string;
}

export function useAcceptStyleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      generationId,
    }: AcceptStyleParams): Promise<AcceptStyleResponse> => {
      const response = await fetch(`/api/projects/${projectId}/accept-style`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generation_id: generationId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to extract style");
      }

      return data;
    },

    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
      posthog.capture("project_style_accepted", {
        project_id: variables.projectId,
        generation_id: variables.generationId,
      });
    },

    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to extract style";
      toast.error(message);
    },
  });
}
