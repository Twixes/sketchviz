"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Examples } from "@/components/Examples";
import { Hero } from "@/components/Hero";
import { HeroFeatures } from "@/components/HeroFeatures";
import { NeonShapesHero } from "@/components/NeonShapesHero";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { cn } from "@/lib/cn";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

export default function Home() {
  const router = useRouter();
  const { user } = useSession();

  // Zustand store - minimal usage, just for upload
  const { startNewThread } = useThreadEditorStore();

  // TanStack Query mutations
  const uploadMutation = useUploadMutation();

  const handleFileSelected = useCallback(
    (file: File) => {
      const threadId = startNewThread();
      uploadMutation.mutate({ file });
      router.push(`/threads/${threadId}`);
    },
    [uploadMutation, router, startNewThread],
  );

  return (
    <PageWrapper user={user}>
      <section className="grid gap-8 sm:gap-12 items-center lg:grid-cols-[1.1fr_0.9fr]">
        <div className="contents lg:block lg:space-y-8">
          <Hero />
          <div className="order-2 lg:order-0">
            <HeroFeatures />
          </div>
        </div>

        <div
          // For logged-in users, show dropzone up top for convenience
          className={cn("relative lg:order-0", user ? "order-1" : "order-4")}
        >
          <NeonShapesHero />
          <UploadDropzone
            onFileSelected={handleFileSelected}
            className="min-h-[320px] border-dashed rounded-2xl"
          />
        </div>

        <div className="order-3 lg:order-0 lg:col-span-2">
          <Examples />
        </div>
      </section>
    </PageWrapper>
  );
}
