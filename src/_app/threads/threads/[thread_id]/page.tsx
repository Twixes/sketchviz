"use client";

import { ArrowLeftIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-globe-gen";
import { type Usable, use, useCallback, useEffect } from "react";
import { FunkyBackground } from "@/components/FunkyBackground";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/lib/components/ui/Button";
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

export default function ThreadDetailPage({
  params,
}: {
  params: Usable<{ thread_id: string }>;
}) {
  const { thread_id: threadId } = use(params);

  const t = useTranslations();
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
    <FunkyBackground>
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} />

        <motion.section className="space-y-8">
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackToThreads}
              leftIcon={<ArrowLeftIcon />}
            >
              {t("thread.backToThreads")}
            </Button>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
              <p className="text-black/50">{t("thread.loading")}</p>
            </div>
          ) : thread ? (
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl font-semibold text-black">
                  {thread.title}
                </h1>
                <p className="mt-2 text-lg text-black/70">
                  {new Date(thread.created_at).toLocaleString()}
                </p>
              </div>

              {thread.generations && thread.generations.length > 0 ? (
                <div className="space-y-6">
                  {thread.generations.map((generation, index) => (
                    <motion.div
                      key={generation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border border-black/10 bg-white/75 p-6 shadow-sm"
                    >
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-black/60">
                          {t("thread.generationNumber", { number: index + 1 })}
                        </p>
                        <p className="text-xs text-black/40">
                          {new Date(generation.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        {/* Input Image */}
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
                            {t("thread.input")}
                          </p>
                          <div className="overflow-hidden rounded-lg border border-black/10 bg-black/5">
                            <img
                              src={generation.input_url}
                              alt={t("thread.input")}
                              width={600}
                              height={400}
                              className="h-auto w-full object-contain"
                            />
                          </div>
                        </div>

                        {/* Output Image */}
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
                            {t("thread.output")}
                          </p>
                          {generation.output_url ? (
                            <div className="overflow-hidden rounded-lg border border-black/10 bg-black/5">
                              <img
                                src={generation.output_url}
                                alt={t("thread.output")}
                                width={600}
                                height={400}
                                className="h-auto w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-black/20 bg-black/5">
                              <p className="text-sm text-black/40">
                                {t("thread.noOutput")}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parameters */}
                      {(generation.user_params.outdoor_light ||
                        generation.user_params.indoor_light ||
                        generation.user_params.edit_description ||
                        generation.user_params.model) && (
                        <div className="mt-4 space-y-2 rounded-lg bg-black/5 p-3">
                          <p className="text-xs font-semibold uppercase tracking-widest text-black/40">
                            {t("thread.parameters")}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {generation.user_params.outdoor_light && (
                              <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black">
                                {t("thread.paramOutdoor", {
                                  value: generation.user_params.outdoor_light,
                                })}
                              </span>
                            )}
                            {generation.user_params.indoor_light && (
                              <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black">
                                {t("thread.paramIndoor", {
                                  value: generation.user_params.indoor_light,
                                })}
                              </span>
                            )}
                            {generation.user_params.model && (
                              <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black">
                                {t("thread.paramModel", {
                                  value: generation.user_params.model,
                                })}
                              </span>
                            )}
                            {generation.user_params.aspect_ratio && (
                              <span className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs text-black">
                                {t("thread.paramAspectRatio", {
                                  value:
                                    generation.user_params.aspect_ratio ||
                                    t("aspectRatio.preserve"),
                                })}
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
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-black/20 bg-white/75 p-12 text-center">
                  <p className="text-lg text-black/50">
                    {t("thread.noGenerations")}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
              <p className="text-black/50">{t("thread.notFound")}</p>
            </div>
          )}
        </motion.section>
      </motion.main>
    </FunkyBackground>
  );
}
