"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { ThreadCard } from "./ThreadCard";

interface Thread {
  id: string;
  title: string;
  created_at: string;
  generation_count: number;
  latest_generation: {
    output_url: string | null;
    input_url: string;
  } | null;
}

export default function ThreadsPage() {
  const router = useRouter();
  const { user, supabase } = useSession();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const { data: threads, isLoading } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch threads
      const { data: threadsData, error: threadsError } = await supabase
        .from("threads")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (threadsError) {
        console.error("Failed to fetch threads:", threadsError);
        throw threadsError;
      }

      // For each thread, get generation count and latest generation
      const threadsWithStats = await Promise.all(
        threadsData.map(async (thread) => {
          // Get generation count
          const { count } = await supabase
            .from("generations")
            .select("*", { count: "exact", head: true })
            .eq("thread_id", thread.id);

          // Get latest generation for thumbnail
          const { data: latestGeneration } = await supabase
            .from("generations")
            .select("output_url, input_url")
            .eq("thread_id", thread.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          return {
            ...thread,
            generation_count: count || 0,
            latest_generation: latestGeneration,
          };
        }),
      );

      return threadsWithStats as Thread[];
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
    <FunkyBackgroundFuzz>
      <motion.main
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex grow w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} />

        <motion.section className="space-y-8">
          <div>
            <h1 className="text-4xl font-semibold text-black">Past threads</h1>
            <p className="mt-2 text-lg text-black/70">
              Your visualization history
            </p>
          </div>

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
      </motion.main>
    </FunkyBackgroundFuzz>
  );
}
