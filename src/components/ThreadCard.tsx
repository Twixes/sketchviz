"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useCallback } from "react";
import { useSession } from "@/components/SessionProvider";
import { useSignedUrl } from "@/hooks/use-signed-url";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";

export interface ThreadData {
  id: string;
  title: string;
  created_at: string;
  generation_count: number;
  latest_generation: {
    output_url: string | null;
    input_url: string;
  } | null;
}

interface ThreadCardProps {
  thread: ThreadData;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const { user } = useSession();
  const queryClient = useQueryClient();

  // Both query keys that may contain this thread
  const threadsQueryKey = ["threads", user?.id];
  const recentThreadsQueryKey = ["recent-threads", user?.id];

  // Get the image URL (prefer output, fallback to input)
  const imageUrl =
    thread.latest_generation?.output_url ||
    thread.latest_generation?.input_url ||
    null;

  // Get signed URL for authenticated access
  const signedUrl = useSignedUrl(imageUrl);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/threads/${thread.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete thread");
      }
      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: threadsQueryKey });
      await queryClient.cancelQueries({ queryKey: recentThreadsQueryKey });

      // Snapshot the previous values
      const previousThreads =
        queryClient.getQueryData<ThreadData[]>(threadsQueryKey);
      const previousRecentThreads = queryClient.getQueryData<ThreadData[]>(
        recentThreadsQueryKey,
      );

      // Optimistically remove the thread from both caches
      queryClient.setQueryData<ThreadData[]>(threadsQueryKey, (old) =>
        old?.filter((t) => t.id !== thread.id),
      );
      queryClient.setQueryData<ThreadData[]>(recentThreadsQueryKey, (old) =>
        old?.filter((t) => t.id !== thread.id),
      );

      // Return context with the previous values
      return { previousThreads, previousRecentThreads };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousThreads) {
        queryClient.setQueryData(threadsQueryKey, context.previousThreads);
      }
      if (context?.previousRecentThreads) {
        queryClient.setQueryData(
          recentThreadsQueryKey,
          context.previousRecentThreads,
        );
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: threadsQueryKey });
      queryClient.invalidateQueries({ queryKey: recentThreadsQueryKey });
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  return (
    <motion.div
      key={thread.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative overflow-hidden rounded-xl border border-black/20 bg-white/75 p-0 text-left transition-all hover:border-black/40 hover:bg-white/90"
    >
      <Link href={`/threads/${thread.id}`} className="block">
        {/* Thumbnail */}
        {thread.latest_generation && signedUrl ? (
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
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/threads/${thread.id}`} className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-black line-clamp-2">
              {thread.title}
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
            {thread.generation_count}
            {" iteration"}
            {thread.generation_count > 1 ? "s" : ""}
          </span>
          <span>•</span>
          <span>{new Date(thread.created_at).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
