"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type Usable, use, useCallback, useEffect } from "react";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import type { UserParams } from "@/lib/schemas";
import { GenerationCard } from "./GenerationCard";
import { ThreadHeader } from "./ThreadHeader";

interface Generation {
  id: string;
  input_url: string;
  output_url: string | null;
  user_params: UserParams;
  created_at: string;
}

interface Thread {
  id: string;
  title: string;
  created_at: string;
  generations: Generation[];
}

export default function ThreadDetailPage({
  params,
}: {
  params: Usable<{ thread_id: string }>;
}) {
  const { thread_id: threadId } = use(params);

  const router = useRouter();
  const { user, supabase } = useSession();

  // Redirect to home if not logged in
  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  const { data: thread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("threads")
        .select(
          `
          id,
          title,
          created_at,
          generations (
            id,
            input_url,
            output_url,
            user_params,
            created_at
          )
        `,
        )
        .eq("id", threadId)
        .single();

      if (error) {
        console.error("Failed to fetch thread:", error);
        throw error;
      }

      // Sort generations by created_at ascending (first to last)
      if (data.generations) {
        data.generations.sort(
          (a: Generation, b: Generation) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }

      return data as Thread;
    },
    enabled: !!user && !!threadId,
  });

  const handleBackToThreads = useCallback(() => {
    router.push("/threads");
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
          {isLoading ? (
            <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
              <p className="text-black/50">Loading thread...</p>
            </div>
          ) : thread ? (
            <div className="space-y-8">
              <ThreadHeader
                title={thread.title}
                createdAt={thread.created_at}
                onBackClick={handleBackToThreads}
              />

              {thread.generations && thread.generations.length > 0 ? (
                <div className="space-y-6">
                  {thread.generations.map((generation, index) => (
                    <GenerationCard
                      key={generation.id}
                      generation={generation}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/20 bg-white/75 p-12 text-center">
                  <p className="text-lg text-black/50">
                    No generations in this thread
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
              <p className="text-black/50">Thread not found</p>
            </div>
          )}
        </motion.section>
      </motion.main>
    </FunkyBackgroundFuzz>
  );
}
