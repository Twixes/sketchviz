import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/components/SessionProvider";

export interface ProjectListItem {
  id: string;
  title: string;
  style_notes: string | null;
  created_at: string;
  thread_count: number;
  scene_urls: string[];
}

export function useProjectsQuery() {
  const { user } = useSession();

  return useQuery({
    queryKey: ["projects", user?.id],
    queryFn: async (): Promise<ProjectListItem[]> => {
      const response = await fetch("/api/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      return data.projects;
    },
    enabled: !!user,
    staleTime: 30_000,
  });
}
