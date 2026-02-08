import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/SessionProvider";

export interface ProjectGeneration {
  id: string;
  output_url: string | null;
  user_params: Record<string, unknown>;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface ProjectThread {
  id: string;
  title: string;
  input_url: string;
  created_at: string;
  generations: ProjectGeneration[];
  latest_generation: ProjectGeneration | null;
}

export interface ProjectDetail {
  id: string;
  title: string;
  style_notes: string | null;
  style_source_generation_id: string | null;
  reference_image_urls: string[];
  created_at: string;
  updated_at: string;
  threads: ProjectThread[];
}

export function useProjectQuery(projectId: string | null) {
  const { user } = useSession();

  return useQuery({
    queryKey: ["project", projectId],
    queryFn: async (): Promise<ProjectDetail> => {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch project");
      }
      const data = await response.json();
      return data.project;
    },
    enabled: !!user && !!projectId,
  });
}
