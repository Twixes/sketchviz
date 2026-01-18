"use client";

import { ArrowRightIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useSession } from "@/components/SessionProvider";
import { ThreadCard, type ThreadData } from "@/components/ThreadCard";

const RECENT_THREADS_LIMIT = 6;

export function RecentThreads() {
  const { user, supabase } = useSession();

  const { data: threads, isLoading } = useQuery({
    queryKey: ["recent-threads", user?.id],
    queryFn: async (): Promise<ThreadData[]> => {
      if (!user) return [];

      const { data: threadsData, error } = await supabase
        .from("threads")
        .select(
          `
          id,
          title,
          created_at,
          generations (
            output_url,
            input_url,
            created_at
          )
        `,
        )
        .order("created_at", { ascending: false })
        .order("created_at", {
          referencedTable: "generations",
          ascending: false,
        })
        .limit(RECENT_THREADS_LIMIT);

      if (error) {
        console.error("Failed to fetch recent threads:", error);
        throw error;
      }

      return threadsData.map((thread) => {
        const generations = thread.generations || [];
        const latest = generations[0] || null;

        return {
          id: thread.id,
          title: thread.title,
          created_at: thread.created_at,
          generation_count: generations.length,
          latest_generation: latest
            ? { output_url: latest.output_url, input_url: latest.input_url }
            : null,
        };
      });
    },
    enabled: !!user,
    staleTime: 30_000, // Consider data fresh for 30 seconds
  });

  if (isLoading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-black">
            Recent visualizations
          </h2>
        </div>
        <div className="rounded-xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Loading...</p>
        </div>
      </section>
    );
  }

  if (!threads || threads.length === 0) {
    return null; // Empty state is handled by the Dashboard component
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-black">
          Recent visualizations
        </h2>
        <Link
          href="/threads"
          className="flex items-center gap-1 text-sm text-black/60 transition-colors hover:text-black"
        >
          View all history
          <ArrowRightIcon className="size-4" />
        </Link>
      </div>
      <motion.div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </motion.div>
    </section>
  );
}
