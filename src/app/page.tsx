"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { upload } from "@vercel/blob/client";
import * as Select from "@radix-ui/react-select";
import { useSession, signIn, signOut } from "next-auth/react";

import { UploadDropzone } from "@/components/UploadDropzone";
import { Examples } from "@/components/Examples";

const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_UPLOAD_MB = 20;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;
const LAYOUT_TRANSITION = { type: "spring", stiffness: 160, damping: 22 } as const;
const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

export default function Home() {
  const { data: session, status, update } = useSession();
  const [inputSrc, setInputSrc] = useState<string | null>(null);
  const [outputSrc, setOutputSrc] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [lightConditions, setLightConditions] = useState<"sunny" | "overcast" | null>(null);
  const dropzoneRef = useRef<HTMLDivElement | null>(null);

  const acceptedFormats = useMemo(
    () =>
      ACCEPTED_MIME_TYPES.map((type) =>
        type.replace("image/", "").toUpperCase(),
      ).join(", "),
    [],
  );

  const focusUpload = Boolean(inputSrc);

  useEffect(() => {
    return () => {
      if (inputSrc?.startsWith("blob:")) {
        URL.revokeObjectURL(inputSrc);
      }
    };
  }, [inputSrc]);

  // Sync isBusy with uploading or generating states
  useEffect(() => {
    setIsBusy(isUploading || isGenerating);
  }, [isUploading, isGenerating]);

  const handleReset = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setInputSrc(null);
    setOutputSrc(null);
    setError(null);
    setBlobUrl(null);
    setLightConditions(null);
  }, []);

  const handleFileSelected = useCallback(async (file: File) => {
    setError(null);

    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      setError(`Unsupported format. Use ${acceptedFormats}.`);
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`File too large. Max ${MAX_UPLOAD_MB}MB.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setInputSrc(objectUrl);
    setOutputSrc(null);
    setBlobUrl(null);
    setIsUploading(true);

    try {
      // Upload file to Vercel Blob
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      setBlobUrl(blob.url);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsUploading(false);
    }
  }, [acceptedFormats]);

  const handleSignIn = useCallback(async () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      '/auth/signin',
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      // Fallback if popup was blocked
      await signIn("google");
      return;
    }

    // Poll for popup closure and session changes
    const checkInterval = setInterval(async () => {
      if (popup.closed) {
        clearInterval(checkInterval);
        // Refresh session without page reload
        await update();
      }
    }, 500);

    // Cleanup interval after 5 minutes (timeout)
    setTimeout(() => {
      clearInterval(checkInterval);
      if (!popup.closed) {
        popup.close();
      }
    }, 5 * 60 * 1000);
  }, [update]);

  const handleSignOut = useCallback(async () => {
    await signOut();
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!blobUrl) return;

    setError(null);
    setOutputSrc(null);
    setIsGenerating(true);

    try {
      // Send blob URL to generation endpoint
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          blobUrl,
          outside_light_conditions: lightConditions,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Generation failed.");
      }

      setOutputSrc(payload.outputImage as string);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }, [blobUrl, lightConditions]);

  return (
    <div className="memphis-shell min-h-screen">
      {/* Background Memphis shapes - fixed to viewport, won't affect layout */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute left-[10%] top-[20%] h-48 w-48 rounded-full bg-[color:var(--accent-sun)] opacity-20 blur-2xl"
        />
        <motion.div
          animate={{ rotate: -360, y: [0, 50, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[15%] top-[60%] h-64 w-64 rotate-12 border-8 border-black/10 bg-white/50"
        />
        <motion.div
          animate={{ rotate: 360, x: [0, 30, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[5%] h-40 w-40 rounded-3xl bg-black/5"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[5%] top-[10%] h-32 w-32 rounded-full border-4 border-[color:var(--accent-sun)] opacity-40"
        />
      </div>

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
            <img
              src="/icon.png"
              alt="SketchViz"
              className="size-16 -m-1"
            />
            <div>
              <p className="text-base font-semibold tracking-tight text-black">
                SketchViz
              </p>
              <p className="text-xs text-black/50">AI visualization studio</p>
            </div>
          </a>
          {session && (
            <button
              onClick={handleSignOut}
              className="rounded-xl border border-black/20 bg-white/75 px-4 py-2 text-sm font-medium text-black transition-all hover:bg-black/5 hover:border-black/30"
            >
              Log out
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
                <div className="space-y-8">
                  <h1 className="text-4xl font-semibold leading-tight text-black sm:text-5xl">
                    Transform{" "}
                    <span className="gradient-title">SketchUp renders</span> into
                    presentation-ready visuals.
                  </h1>
                  <p className="max-w-xl text-lg text-black/70">
                    Upload a render and get polished, photorealistic output with
                    refined lighting, realistic materials, and professional depth—ready
                    for decks, portfolios, and clients.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Speed", value: "~30 seconds", detail: "From upload to photoreal" },
                    { label: "Materials", value: "Real-world finish", detail: "Refined surfaces & textures" },
                    { label: "Lighting", value: "Natural depth", detail: "Balanced ambient glow" },
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
            className={[
              "relative w-full",
              focusUpload ? "max-w-3xl" : "",
            ].join(" ")}
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
              isBusy={isBusy}
              error={error}
              inputSrc={inputSrc}
              outputSrc={outputSrc}
              frame={false}
              className={[
                "min-h-[320px] border border-dashed border-black/20 bg-white/85",
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
                    <label className="text-sm font-semibold text-black">
                      Light conditions:
                    </label>
                    <Select.Root
                      value={lightConditions ?? "auto"}
                      onValueChange={(value) =>
                        setLightConditions(value === "auto" ? null : value as "sunny" | "overcast")
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
                    onClick={!session ? handleSignIn : handleGenerate}
                    disabled={isUploading || isGenerating || status === "loading"}
                    className={[
                      "rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                      isUploading || isGenerating || status === "loading"
                        ? "cursor-not-allowed bg-black/20 text-black/40"
                        : "bg-black text-white hover:scale-[1.02] active:scale-[0.98]",
                    ].join(" ")}
                  >
                    {isGenerating
                      ? "Generating..."
                      : isUploading
                      ? "Uploading..."
                      : status === "loading"
                      ? "Loading..."
                      : !session
                      ? "Log in with Google"
                      : "Generate"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        {!focusUpload ? <Examples /> : null}
      </motion.main>
    </div>
  );
}
