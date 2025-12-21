"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { upload } from "@vercel/blob/client";
import * as Select from "@radix-ui/react-select";

import { UploadDropzone } from "@/components/UploadDropzone";

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
      <motion.main
        layout
        transition={LAYOUT_TRANSITION}
        className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-14 lg:px-10"
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
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-semibold text-white">
              SV
            </span>
            <div>
              <p className="text-base font-semibold tracking-tight text-black">
                SketchViz
              </p>
              <p className="text-xs text-black/50">AI visualization studio</p>
            </div>
          </a>
          <div className="hidden items-center gap-3 text-xs text-black/50 sm:flex">
            <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1">
              Gemini 3 Pro
            </span>
            <span className="rounded-full border border-black/10 bg-white/80 px-3 py-1">
              Instant preview
            </span>
          </div>
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
                  <p className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
                    SketchUp to photoreal
                  </p>
                  <h1 className="text-4xl font-semibold leading-tight text-black sm:text-5xl">
                    Turn your{" "}
                    <span className="gradient-title">SketchUp renders</span> into
                    magazine-ready visuals.
                  </h1>
                  <p className="max-w-xl text-lg text-black/70">
                    SketchViz upgrades raw architectural renders into polished 3D
                    visualizations with balanced lighting, richer materials, and
                    interior-design-level polish.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    { label: "Lightning fast", value: "30 sec avg" },
                    { label: "AI lighting", value: "Natural glow" },
                    { label: "File formats", value: acceptedFormats },
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
            <div className="absolute -left-10 -top-10 hidden h-24 w-24 rounded-full bg-[color:var(--accent-sun)] opacity-80 blur-0 lg:block" />
            <div className="absolute -bottom-8 right-10 hidden h-16 w-16 rotate-12 rounded-2xl border-2 border-black/70 bg-white lg:block" />
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
                  className="mt-6 flex flex-col gap-4"
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
                    onClick={handleGenerate}
                    disabled={isUploading || isGenerating}
                    className={[
                      "rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                      isUploading || isGenerating
                        ? "cursor-not-allowed bg-black/20 text-black/40"
                        : "bg-black text-white hover:scale-[1.02] active:scale-[0.98]",
                    ].join(" ")}
                  >
                    {isGenerating ? "Generating..." : isUploading ? "Uploading..." : "Generate"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence initial={false}>
              {!focusUpload ? (
                <motion.div
                  key="how"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={FADE_TRANSITION}
                  className="mt-6 grid gap-3 rounded-2xl border border-black/10 bg-white/80 p-4 text-sm text-black/60"
                >
                  <p className="font-semibold text-black">How it works</p>
                  <p>
                    Upload a render, we send it to Gemini 3 Pro Image Preview, and
                    reveal the photoreal version instantly.
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </motion.section>

        <AnimatePresence initial={false}>
          {!focusUpload ? (
            <motion.section
              key="features"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={FADE_TRANSITION}
              className="grid gap-6 md:grid-cols-3"
            >
              {[
                {
                  title: "Material realism",
                  copy: "Diffuse, glossy, and metal surfaces are rebalanced for real-world finish.",
                },
                {
                  title: "Interior styling",
                  copy: "Adds tasteful ambient lighting and spatial depth for design-forward visuals.",
                },
                {
                  title: "Clean output",
                  copy: "Perfect for decks, listings, and client-facing presentations.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/10 bg-white/75 p-6 shadow-[0_24px_60px_-45px_rgba(12,12,12,0.5)]"
                >
                  <h3 className="text-lg font-semibold text-black">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm text-black/60">{item.copy}</p>
                </div>
              ))}
            </motion.section>
          ) : null}
        </AnimatePresence>
      </motion.main>
    </div>
  );
}
