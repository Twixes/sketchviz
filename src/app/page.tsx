"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { Examples } from "@/components/Examples";
import { FunkyBackground } from "@/components/FunkyBackground";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { useSession } from "@/components/SessionProvider";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { useUploadStore } from "@/stores/upload-store";

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;

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
    isBusyForUser,
    setIsBusyForUser,
    outputSrc,
    setOutdoorLight,
    setIndoorLight,
    setEditDescription,
    setModel,
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
    uploadMutation,
    generateMutation,
    setIsBusyForUser,
  ]);

  return (
    <FunkyBackground>
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} onLogoClick={handleReset} />

        <motion.section
          layout
          transition={LAYOUT_TRANSITION}
          className={clsx([
            "grid gap-12",
            focusUpload
              ? "min-h-[60vh] place-items-center"
              : "items-center lg:grid-cols-[1.05fr_0.95fr]",
          ])}
        >
          <AnimatePresence initial={false}>
            {!focusUpload ? <Hero /> : null}
          </AnimatePresence>

          <ControlPanel
            user={user}
            inputSrc={inputSrc}
            outdoorLight={outdoorLight}
            indoorLight={indoorLight}
            editDescription={editDescription}
            model={model}
            isBusyForUser={isBusyForUser}
            outputSrc={outputSrc}
            focusUpload={focusUpload}
            onFileSelected={handleFileSelected}
            onOutdoorLightChange={setOutdoorLight}
            onIndoorLightChange={setIndoorLight}
            onEditDescriptionChange={setEditDescription}
            onModelChange={setModel}
            onGenerate={handleGenerate}
          />
        </motion.section>

        {!focusUpload ? <Examples /> : null}
      </motion.main>
    </FunkyBackground>
  );
}
