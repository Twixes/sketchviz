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
  const { user, supabase } = useSession();

  // Zustand store
  const {
    inputSrc,
    blobUrl,
    outdoorLight,
    indoorLight,
    editDescription,
    isBusyForUser,
    setIsBusyForUser,
    outputSrc,
    setOutdoorLight,
    setIndoorLight,
    setEditDescription,
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

  const handleSignIn = useCallback(async () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      "/auth/signin",
      "Google Sign In",
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`,
    );

    if (!popup) {
      // Fallback if popup was blocked
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return;
    }

    // Poll for popup closure - session will be updated automatically via auth state change listener
    const checkInterval = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkInterval);
      }
    }, 500);

    // Cleanup interval after 5 minutes (timeout)
    setTimeout(
      () => {
        clearInterval(checkInterval);
        if (!popup.closed) {
          popup.close();
        }
      },
      5 * 60 * 1000,
    );
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

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
      });
    } finally {
      setIsBusyForUser(false);
    }
  }, [
    blobUrl,
    outdoorLight,
    indoorLight,
    editDescription,
    uploadMutation,
    generateMutation,
    setIsBusyForUser,
  ]);

  return (
    <FunkyBackground>
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-14 lg:px-10"
      >
        <Header
          user={user}
          onReset={handleReset}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />

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
            isBusyForUser={isBusyForUser}
            outputSrc={outputSrc}
            focusUpload={focusUpload}
            onFileSelected={handleFileSelected}
            onOutdoorLightChange={setOutdoorLight}
            onIndoorLightChange={setIndoorLight}
            onEditDescriptionChange={setEditDescription}
            onGenerate={handleGenerate}
            onSignIn={handleSignIn}
          />
        </motion.section>

        {!focusUpload ? <Examples /> : null}
      </motion.main>
    </FunkyBackground>
  );
}
