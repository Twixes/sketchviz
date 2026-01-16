"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { uuidv7 } from "uuidv7";
import { Examples } from "@/components/Examples";
import { Hero } from "@/components/Hero";
import { HeroFeatures } from "@/components/HeroFeatures";
import { NeonShapesHero } from "@/components/NeonShapesHero";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

export default function Home() {
  const router = useRouter();
  const { user } = useSession();

  // Zustand store - minimal usage, just for upload
  const { setTentativeThreadId } = useThreadEditorStore();

  // TanStack Query mutations
  const uploadMutation = useUploadMutation();

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
    <PageWrapper user={user}>
      <section className="grid gap-8 sm:gap-12 items-center lg:grid-cols-[1.05fr_0.95fr]">
        <div className="contents lg:block lg:space-y-8">
          <Hero />
          <div className="order-2 lg:order-0">
            <HeroFeatures />
          </div>
        </div>

        <div className="relative order-4 lg:order-0">
          <NeonShapesHero />
          <UploadDropzone
            onFileSelected={handleFileSelected}
            className="min-h-[320px] border border-dashed border-black/20 hover:border-black/60 cursor-pointer bg-white/85"
          />
        </div>

        <div className="order-3 lg:order-0 lg:col-span-2">
          <Examples />
        </div>
      </section>
    </PageWrapper>
  );
}
