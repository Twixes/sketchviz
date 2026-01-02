"use client";

import clsx from "clsx";
import { useCallback } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Examples } from "@/components/Examples";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { HeroFeatures } from "@/components/HeroFeatures";
import { useSession } from "@/components/SessionProvider";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { useUploadStore } from "@/stores/upload-store";

export default function Home() {
  const { user } = useSession();

  // Zustand store
  const {
    inputSrc,
    blobUrl,
    outdoorLight,
    indoorLight,
    editDescription,
    model,
    aspectRatio,
    isBusyForUser,
    setIsBusyForUser,
    outputSrc,
    setOutdoorLight,
    setIndoorLight,
    setEditDescription,
    setModel,
    setAspectRatio,
    reset,
  } = useUploadStore();

  const focusUpload = Boolean(inputSrc);

  // TanStack Query mutations
  const uploadMutation = useUploadMutation();
  const generateMutation = useGenerateMutation();

  const handleReset = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      reset();
    },
    [reset],
  );

  const handleFileSelected = useCallback(
    async (file: File) => {
      await uploadMutation.mutateAsync({ file });
    },
    [uploadMutation],
  );

  const handleGenerate = useCallback(async () => {
    setIsBusyForUser(true);
    try {
      // Wait for upload to finish if it's still in progress
      let currentBlobUrl = blobUrl;

      if (uploadMutation.isPending) {
        const uploadedUrl = await uploadMutation.mutateAsync(
          uploadMutation.variables,
        );
        currentBlobUrl = uploadedUrl;
      }

      if (!currentBlobUrl) return;

      await generateMutation.mutateAsync({
        blobUrl: currentBlobUrl,
        outdoorLight,
        indoorLight,
        editDescription,
        model,
        aspectRatio,
      });
    } finally {
      setIsBusyForUser(false);
    }
  }, [
    blobUrl,
    outdoorLight,
    indoorLight,
    editDescription,
    model,
    aspectRatio,
    uploadMutation,
    generateMutation,
    setIsBusyForUser,
  ]);

  return (
    <FunkyBackgroundFuzz>
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10">
        <Header user={user} onLogoClick={handleReset} />

        <section
          className={clsx([
            "grid gap-12",
            focusUpload
              ? "min-h-[60vh] place-items-center"
              : "items-center lg:grid-cols-[1.05fr_0.95fr]",
          ])}
        >
          {!focusUpload ? (
            <div className="contents lg:block lg:space-y-8">
              <Hero />
              <div className="order-2 lg:order-none">
                <HeroFeatures />
              </div>
            </div>
          ) : null}

          <ControlPanel
            className="order-1 lg:order-none"
            user={user}
            inputSrc={inputSrc}
            outdoorLight={outdoorLight}
            indoorLight={indoorLight}
            editDescription={editDescription}
            model={model}
            aspectRatio={aspectRatio}
            isBusyForUser={isBusyForUser}
            outputSrc={outputSrc}
            focusUpload={focusUpload}
            onFileSelected={handleFileSelected}
            onOutdoorLightChange={setOutdoorLight}
            onIndoorLightChange={setIndoorLight}
            onEditDescriptionChange={setEditDescription}
            onModelChange={setModel}
            onAspectRatioChange={setAspectRatio}
            onGenerate={handleGenerate}
          />
        </section>

        {!focusUpload ? <Examples /> : null}
      </main>
    </FunkyBackgroundFuzz>
  );
}
