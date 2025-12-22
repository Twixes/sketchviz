"use client";

import { EnterIcon, ExitIcon } from "@radix-ui/react-icons";
import * as Select from "@radix-ui/react-select";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useRef } from "react";
import { Examples } from "@/components/Examples";
import { FunkyBackground } from "@/components/FunkyBackground";
import { useSession } from "@/components/SessionProvider";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import GoogleIcon from "@/icons/google.svg";
import { useUploadStore } from "@/stores/upload-store";

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;
const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

export default function Home() {
  const { user, supabase } = useSession();
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  // Zustand store
  const {
    inputSrc,
    blobUrl,
    lightConditions,
    isGenerating,
    focusUpload,
    setLightConditions,
    reset,
  } = useUploadStore();

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
      lightConditions,
    });
  }, [blobUrl, lightConditions, uploadMutation, generateMutation]);

  return (
    <FunkyBackground>
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-14 lg:px-10"
      >
        <motion.header
          initial={false}
          animate={focusUpload ? { opacity: 0.4, y: -8 } : { opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="flex items-center justify-between"
        >
          <a
            href="/"
            onClick={handleReset}
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
          </a>
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
            >
              <ExitIcon /> Log out
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSignIn}
              className="flex items-center gap-2 rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
            >
              <GoogleIcon className="size-[15px]" /> Log in with Google
            </button>
          )}
        </motion.header>

        <motion.section
          layout
          transition={LAYOUT_TRANSITION}
          className={[
            "grid gap-12",
            focusUpload
              ? "min-h-[60vh] place-items-center"
              : "items-center lg:grid-cols-[1.05fr_0.95fr]",
          ].join(" ")}
        >
          <AnimatePresence initial={false}>
            {!focusUpload ? (
              <motion.div
                key="hero"
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={FADE_TRANSITION}
                className="flex flex-col gap-8"
              >
                <div className="space-y-6">
                  <h1 className="text-4xl font-semibold leading-tight text-black sm:text-5xl">
                    Transform your{" "}
                    <span className="outline-title">SketchUp renders</span> into{" "}
                    <span className="gradient-title">
                      photorealistic visuals
                    </span>
                    .
                  </h1>
                  <p className="max-w-xl text-lg text-black/70">
                    Upload a render and get polished, photorealistic output with
                    refined lighting, realistic materials, and professional
                    depth.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: "Speed",
                      value: "~30 seconds",
                      detail: "From upload to photoreal",
                    },
                    {
                      label: "Materials",
                      value: "Real-world finish",
                      detail: "Refined surfaces & textures",
                    },
                    {
                      label: "Lighting",
                      value: "Natural depth",
                      detail: "Balanced ambient glow",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-left"
                    >
                      <p className="text-xs uppercase tracking-[0.25em] text-black/40">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-black">
                        {item.value}
                      </p>
                      <p className="mt-1 text-xs text-black/50">
                        {item.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.div
            ref={dropzoneRef}
            layout
            transition={LAYOUT_TRANSITION}
            animate={focusUpload ? { scale: 1.03 } : { scale: 1 }}
            className={["relative w-full", focusUpload ? "max-w-3xl" : ""].join(
              " ",
            )}
          >
            {/* Enhanced Memphis decorative shapes */}
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -left-12 -top-12 hidden h-36 w-36 rounded-full bg-[color:var(--accent-sun)] opacity-90 shadow-[0_0_60px_rgba(255,215,0,0.4)] lg:block"
            />
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 top-1/4 hidden h-20 w-20 rounded-full border-4 border-[color:var(--accent-sun)] bg-white/80 lg:block"
            />
            <motion.div
              animate={{ x: [0, 10, 0], rotate: [0, -180, -360] }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -left-6 bottom-1/4 hidden h-16 w-16 bg-black/10 lg:block"
            />
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-0 top-0 hidden h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-black/20 lg:block"
            />
            <UploadDropzone
              onFileSelected={handleFileSelected}
              frame={false}
              className={[
                "min-h-[320px] border bg-white/85",
                !inputSrc ? "border-dashed border-black/20" : "border-black/40",
                focusUpload
                  ? "shadow-[0_40px_90px_-50px_rgba(12,12,12,0.65)]"
                  : "",
              ].join(" ")}
            />

            <AnimatePresence initial={false}>
              {inputSrc && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={FADE_TRANSITION}
                  className="mt-6 flex flex-col gap-4 z-10"
                >
                  <div className="flex items-center gap-4">
                    <label
                      htmlFor="light-conditions"
                      className="text-sm font-semibold text-black"
                    >
                      Light conditions:
                    </label>
                    <Select.Root
                      value={lightConditions ?? "auto"}
                      onValueChange={(value) =>
                        setLightConditions(
                          value === "auto"
                            ? null
                            : (value as "sunny" | "overcast"),
                        )
                      }
                    >
                      <Select.Trigger className="inline-flex items-center justify-between gap-2 rounded-xl border border-black/20 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20 min-w-[140px]">
                        <Select.Value />
                        <Select.Icon className="text-black/60">▼</Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="z-50 overflow-hidden rounded-xl border border-black/20 bg-white shadow-lg">
                          <Select.Viewport className="p-1">
                            <Select.Item
                              value="auto"
                              className="relative flex cursor-pointer items-center rounded-lg px-8 py-2 text-sm text-black outline-none hover:bg-black/5 focus:bg-black/10 data-[state=checked]:font-semibold"
                            >
                              <Select.ItemText>Auto</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="sunny"
                              className="relative flex cursor-pointer items-center rounded-lg px-8 py-2 text-sm text-black outline-none hover:bg-black/5 focus:bg-black/10 data-[state=checked]:font-semibold"
                            >
                              <Select.ItemText>Sunny</Select.ItemText>
                            </Select.Item>
                            <Select.Item
                              value="overcast"
                              className="relative flex cursor-pointer items-center rounded-lg px-8 py-2 text-sm text-black outline-none hover:bg-black/5 focus:bg-black/10 data-[state=checked]:font-semibold"
                            >
                              <Select.ItemText>Overcast</Select.ItemText>
                            </Select.Item>
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <button
                    type="submit"
                    onClick={!user ? handleSignIn : handleGenerate}
                    disabled={isGenerating}
                    className={[
                      "flex items-center gap-2 justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                      isGenerating
                        ? "cursor-not-allowed bg-black/20 text-black/40"
                        : "bg-black text-white hover:scale-[1.02] active:scale-[0.98]",
                    ].join(" ")}
                  >
                    {isGenerating ? (
                      "Generating..."
                    ) : !user ? (
                      <>
                        <EnterIcon /> Log in with Google to complete
                        visualization
                      </>
                    ) : (
                      "Generate"
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        {!focusUpload ? <Examples /> : null}
      </motion.main>
    </FunkyBackground>
  );
}
