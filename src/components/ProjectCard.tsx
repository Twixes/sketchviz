"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import type { ProjectListItem } from "@/hooks/use-projects-query";
import { useSignedUrl } from "@/hooks/use-signed-url";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";

interface ProjectCardProps {
  project: ProjectListItem;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const signedUrl = useSignedUrl(project.latest_output_url);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete project");
      }
      return response.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["projects", user?.id] });
      const previous = queryClient.getQueryData<ProjectListItem[]>([
        "projects",
        user?.id,
      ]);
      queryClient.setQueryData<ProjectListItem[]>(
        ["projects", user?.id],
        (old) => old?.filter((p) => p.id !== project.id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["projects", user?.id], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", user?.id] });
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const hasStyle = !!project.style_notes;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-black/20 bg-white/75 p-0 text-left transition-all hover:border-black/40 hover:bg-white/90"
    >
      <Link href={`/projects/${project.id}`} className="block">
        {signedUrl ? (
          <div className="aspect-video w-full overflow-hidden bg-black/5">
            <img
              src={signedUrl}
              alt={project.title}
              width={400}
              height={225}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-black/5">
            <p className="text-sm text-black/40">No preview</p>
          </div>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-black line-clamp-2">
              {project.title || "Untitled Project"}
            </h2>
          </Link>
          <DropdownMenu>
            <DropdownMenuItem
              onClick={handleDelete}
              destructive
              disabled={deleteMutation.isPending}
            >
              <TrashIcon className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs text-black/50">
          <span>
            {project.thread_count} scene{project.thread_count !== 1 ? "s" : ""}
          </span>
          <span>•</span>
          <span>{hasStyle ? "Style set" : "In setup"}</span>
          <span>•</span>
          <span>{new Date(project.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
