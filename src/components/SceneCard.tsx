"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback } from "react";
import type { ProjectThread } from "@/hooks/use-project-query";
import { useSignedUrl } from "@/hooks/use-signed-url";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";

interface SceneCardProps {
  thread: ProjectThread;
  projectId: string;
  isGenerating?: boolean;
}

export function SceneCard({ thread, projectId, isGenerating }: SceneCardProps) {
  const queryClient = useQueryClient();

  // Get the best image: latest output, or thread input
  const imageUrl =
    thread.latest_generation?.output_url || thread.input_url || null;
  const signedUrl = useSignedUrl(imageUrl);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/projects/${projectId}/scenes/${thread.id}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove scene");
      }
      return response.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  const hasGenerations = thread.generations.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-black/20 bg-white/75 p-0 text-left transition-all hover:border-black/40 hover:bg-white/90"
    >
      <Link
        href={`/projects/${projectId}/scenes/${thread.id}`}
        className="block"
      >
        <div className="relative">
          {signedUrl ? (
            <div className="aspect-video w-full overflow-hidden bg-black/5">
              <img
                src={signedUrl}
                alt={thread.title}
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
          {isGenerating && (
            <div className="absolute inset-1.5 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <div className="loading-ring" aria-hidden />
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/projects/${projectId}/scenes/${thread.id}`}
            className="flex-1 min-w-0"
          >
            <h3 className="text-sm font-semibold text-black line-clamp-2">
              {thread.title || "Untitled Scene"}
            </h3>
          </Link>
          <DropdownMenu>
            <DropdownMenuItem
              onClick={handleDelete}
              destructive
              disabled={deleteMutation.isPending}
            >
              <TrashIcon className="size-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
        <div className="mt-1 text-xs text-black/50">
          {hasGenerations
            ? `${thread.generations.length} generation${thread.generations.length !== 1 ? "s" : ""}`
            : "Not visualized yet"}
        </div>
      </div>
    </motion.div>
  );
}
