"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { uuidv7 } from "uuidv7";
import { Examples } from "@/components/Examples";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { FunkyBackgroundShapes1 } from "@/components/FunkyBackgroundMini";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroFeatures } from "@/components/HeroFeatures";
import { useSession } from "@/components/SessionProvider";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { useUploadStore } from "@/stores/upload-store";

export default function Home() {
  const router = useRouter();
  const { user } = useSession();

  // Zustand store - minimal usage, just for reset and upload
  const { reset, setTentativeThreadId } = useUploadStore();

  // TanStack Query mutations
  const uploadMutation = useUploadMutation();

  const handleReset = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      reset();
    },
    [reset],
  );

  const handleFileSelected = useCallback(
    (file: File) => {
      // Generate a tentative thread ID and navigate immediately
      const threadId = uuidv7();
      setTentativeThreadId(threadId);
      // Start upload and navigate - upload continues on the thread page
      uploadMutation.mutate({ file });
      router.push(`/threads/${threadId}`);
    },
    [uploadMutation, router, setTentativeThreadId],
  );

  return (
    <FunkyBackgroundFuzz>
      <main className="relative z-10 mx-auto flex grow w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10">
        <Header user={user} onLogoClick={handleReset} />

        <section className="grid gap-12 items-center lg:grid-cols-[1.05fr_0.95fr]">
          <div className="contents lg:block lg:space-y-8">
            <Hero />
            <div className="order-2 lg:order-none">
              <HeroFeatures />
            </div>
          </div>

          <div className="relative order-1 lg:order-none">
            <FunkyBackgroundShapes1 />
            <UploadDropzone
              onFileSelected={handleFileSelected}
              frame={true}
              className="min-h-[320px] border border-dashed border-black/20 hover:border-black/60 cursor-pointer bg-white/85"
            />
          </div>
        </section>

        <Examples />
      </main>
    </FunkyBackgroundFuzz>
  );
}
