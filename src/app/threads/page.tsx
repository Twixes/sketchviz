"use client";

import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { ThreadCard, type ThreadData } from "@/components/ThreadCard";
import { Button } from "@/lib/components/ui/Button";

export default function ThreadsPage() {
  const router = useRouter();
  const { user, supabase } = useSession();

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch threads with all their generations in a single query using JOIN
      const { data: threadsData, error: threadsError } = await supabase
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
        });

      if (threadsError) {
        console.error("Failed to fetch threads:", threadsError);
        throw threadsError;
      }

      // Transform the joined data into the expected format
      const threadsWithStats = threadsData.map((thread) => {
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

      return threadsWithStats as ThreadData[];
    },
    enabled: !!user,
  });

  const handleBackHome = useCallback(() => {
    router.push("/");
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <PageWrapper user={user}>
      <div>
        <Link
          href="/dashboard"
          className="mb-2 flex items-center gap-1 text-sm text-black/60 transition-colors hover:text-black"
        >
          <ArrowLeftIcon className="size-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-semibold text-black lg:text-3xl">
          History
        </h1>
        <p className="mt-2 text-lg text-black/70">Your past visualizations</p>
      </div>
      <motion.section className="space-y-8">
        {isLoading ? (
          <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
            <p className="text-black/50">Loading threads...</p>
          </div>
        ) : threads && threads.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-black/20 bg-white/75 p-12 text-center">
            <p className="text-lg text-black/50">No threads yet</p>
            <p className="mt-2 text-sm text-black/40">
              Start by creating your first visualization
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={handleBackHome}
              className="mt-6"
            >
              Create visualization
            </Button>
          </div>
        )}
      </motion.section>
    </PageWrapper>
  );
}
