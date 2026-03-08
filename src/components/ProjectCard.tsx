"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import type { ProjectListItem } from "@/hooks/use-projects-query";
import { useSignedUrls } from "@/hooks/use-signed-url";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";

interface ProjectCardProps {
  project: ProjectListItem;
}

/** Column span for each image in a 6-column grid, based on total scene count. */
function getColSpan(count: number, index: number): string {
  switch (count) {
    case 1:
      return "col-span-6";
    case 2:
      return "col-span-3";
    case 3:
      return "col-span-2";
    case 4:
      return "col-span-3";
    case 5:
      // Top row: 3 items spanning 2 each, bottom row: 2 items spanning 3 each
      return index < 3 ? "col-span-2" : "col-span-3";
    default:
      return "col-span-2";
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const signedUrls = useSignedUrls(project.scene_urls);

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
      className="group relative overflow-hidden rounded-lg border border-black/20 bg-white/75 backdrop-blur-lg p-0 text-left transition-all hover:border-black/40 hover:bg-white/90"
    >
      <Link href={`/projects/${project.id}`} className="block">
        {signedUrls.length > 0 ? (
          <div className="grid aspect-video w-full grid-cols-6 overflow-hidden bg-black/5">
            {signedUrls.map(
              (url, i) =>
                url && (
                  <img
                    key={url}
                    src={url}
                    alt={`${project.title} scene ${i + 1}`}
                    className={`h-full w-full object-cover ${getColSpan(signedUrls.length, i)}`}
                  />
                ),
            )}
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-black/5">
            <p className="text-sm text-black/40">No scenes yet</p>
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
