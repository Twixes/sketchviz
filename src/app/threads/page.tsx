"use client";

import { ExitIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { FunkyBackground } from "@/components/FunkyBackground";
import { useSession } from "@/components/SessionProvider";
import type { UserParams } from "@/lib/schemas";

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

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;

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
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch threads:", error);
        throw error;
      }

      return data as Thread[];
    },
    enabled: !!user,
  });

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    router.push("/");
  }, [supabase, router]);

  const handleBackHome = useCallback(() => {
    router.push("/");
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <FunkyBackground>
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-14 lg:px-10"
      >
        <motion.header className="flex items-center justify-between">
          <button
            type="button"
            onClick={handleBackHome}
            className="flex items-center gap-4 cursor-pointer"
          >
            <Image
              src="/icon.png"
              alt="SketchViz"
              className="size-16 -m-1"
              width={64}
              height={64}
            />
            <div>
              <p className="text-base font-semibold tracking-tight text-black">
                SketchViz
              </p>
              <p className="text-xs text-black/50">AI visualization studio</p>
            </div>
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
          >
            <ExitIcon /> Log out
          </button>
        </motion.header>

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
            <div className="space-y-6">
              {threads.map((thread) => (
                <motion.div
                  key={thread.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-black">
                        {thread.title}
                      </h2>
                      <p className="mt-1 text-sm text-black/50">
                        {new Date(thread.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {thread.generations?.map((generation) => (
                      <div
                        key={generation.id}
                        className="rounded-xl border border-black/10 bg-white/50 p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Input Image */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
                              Input
                            </p>
                            <div className="overflow-hidden rounded-lg border border-black/10 bg-black/5">
                              <img
                                src={generation.input_url}
                                alt="Input"
                                className="h-auto w-full object-contain"
                              />
                            </div>
                          </div>

                          {/* Output Image */}
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
                              Output
                            </p>
                            {generation.output_url ? (
                              <div className="overflow-hidden rounded-lg border border-black/10 bg-black/5">
                                <img
                                  src={generation.output_url}
                                  alt="Output"
                                  className="h-auto w-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-black/20 bg-black/5">
                                <p className="text-sm text-black/40">
                                  No output generated
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Parameters */}
                        {(generation.user_params.outdoor_light ||
                          generation.user_params.indoor_light ||
                          generation.user_params.edit_description) && (
                          <div className="mt-4 space-y-2 rounded-lg bg-black/5 p-3">
                            <p className="text-xs font-semibold uppercase tracking-widest text-black/40">
                              Parameters
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {generation.user_params.outdoor_light && (
                                <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black">
                                  Outdoor:{" "}
                                  {generation.user_params.outdoor_light}
                                </span>
                              )}
                              {generation.user_params.indoor_light && (
                                <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black">
                                  Indoor: {generation.user_params.indoor_light}
                                </span>
                              )}
                            </div>
                            {generation.user_params.edit_description && (
                              <p className="text-sm text-black/70">
                                {generation.user_params.edit_description}
                              </p>
                            )}
                          </div>
                        )}

                        <p className="mt-3 text-xs text-black/40">
                          {new Date(generation.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-black/20 bg-white/75 p-12 text-center">
              <p className="text-lg text-black/50">No threads yet</p>
              <p className="mt-2 text-sm text-black/40">
                Start by creating your first visualization
              </p>
              <button
                type="button"
                onClick={handleBackHome}
                className={clsx([
                  "mt-6 inline-flex items-center gap-2 justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                  "bg-black text-white hover:scale-[1.02] active:scale-[0.98]",
                ])}
              >
                Create visualization
              </button>
            </div>
          )}
        </motion.section>
      </motion.main>
    </FunkyBackground>
  );
}
