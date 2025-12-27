"use client";

import { Half2Icon, UploadIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { motion } from "motion/react";
import type { DragEvent, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createNoise2D } from "simplex-noise";
import { parseAspectRatio } from "@/lib/aspect-ratio";
import { ACCEPTED_MIME_TYPES } from "@/lib/constants";
import { useUploadStore } from "@/stores/upload-store";

type UploadDropzoneProps = {
  onFileSelected: (file: File) => void;
  frame?: boolean;
  className?: string;
};

export function UploadDropzone({
  onFileSelected,
  frame = true,
  className,
}: UploadDropzoneProps) {
  // Get state from Zustand store
  const {
    isBusyForUser,
    error,
    inputSrc,
    outputSrc,
    setInputImageDimensions,
    aspectRatio: selectedAspectRatio,
  } = useUploadStore();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file || isBusyForUser) return;
      onFileSelected(file);
    },
    [isBusyForUser, onFileSelected],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer.files?.[0];
      handleFile(file ?? null);
    },
    [handleFile],
  );

  useEffect(() => {
    if (!inputSrc) {
      setAspectRatio(null);
      setInputImageDimensions(null);
    }
  }, [inputSrc, setInputImageDimensions]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && ACCEPTED_MIME_TYPES.includes(item.type)) {
          event.preventDefault();
          handleFile(item.getAsFile() ?? null);
        }
      }
    };
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("paste", handlePaste);
    };
  }, [handleFile]);

  useEffect(() => {
    const outputEl = outputRef.current;
    if (!outputEl || !outputSrc) return;

    let rafId = 0;
    setIsReady(false);
    const size = 180;
    const durationMs = 800;
    const noise2D = createNoise2D();
    const noise = new Uint8Array(size * size);
    const scale = 0.05; // Controls frequency of the noise pattern
    for (let i = 0; i < noise.length; i += 1) {
      const x = i % size;
      const y = Math.floor(i / size);
      // Simplex noise returns values in [-1, 1], normalize to [0, 255]
      const value = noise2D(x * scale, y * scale);
      noise[i] = Math.floor(((value + 1) / 2) * 256);
    }

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    if (!ctx) {
      outputEl.style.opacity = "1";
      return;
    }

    outputEl.style.opacity = "1";

    const start = performance.now();
    const renderMask = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const threshold = Math.floor(progress * 256);
      const imageData = ctx.createImageData(size, size);

      for (let i = 0; i < noise.length; i += 1) {
        const alpha = noise[i] < threshold ? 255 : 0;
        const offset = i * 4;
        imageData.data[offset] = 0;
        imageData.data[offset + 1] = 0;
        imageData.data[offset + 2] = 0;
        imageData.data[offset + 3] = alpha;
      }

      ctx.putImageData(imageData, 0, 0);
      const maskUrl = canvas.toDataURL("image/png");
      outputEl.style.maskImage = `url(${maskUrl})`;
      outputEl.style.webkitMaskImage = `url(${maskUrl})`;
      outputEl.style.maskRepeat = "no-repeat";
      outputEl.style.webkitMaskRepeat = "no-repeat";
      outputEl.style.maskSize = "100% 100%";
      outputEl.style.webkitMaskSize = "100% 100%";

      if (progress < 1) {
        rafId = requestAnimationFrame(renderMask);
      } else {
        outputEl.style.maskImage = "none";
        outputEl.style.webkitMaskImage = "none";
        setIsReady(true);
      }
    };

    rafId = requestAnimationFrame(renderMask);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [outputSrc]);

  const handleInputLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = event.currentTarget;
      if (naturalWidth && naturalHeight) {
        setAspectRatio(naturalWidth / naturalHeight);
        setInputImageDimensions({
          width: naturalWidth,
          height: naturalHeight,
        });
      }
    },
    [setInputImageDimensions],
  );

  const handleCompareStart = useCallback((event: React.PointerEvent) => {
    event.stopPropagation();
    setIsComparing(true);
  }, []);
  const handleCompareEnd = useCallback(() => {
    setIsComparing(false);
  }, []);

  // Calculate the display aspect ratio
  const displayAspectRatio = selectedAspectRatio
    ? parseAspectRatio(selectedAspectRatio)
    : aspectRatio;

  return (
    <motion.div className="relative w-full">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: this is a special dropzone use case */}
      <div
        className={clsx([
          "group relative flex cursor-pointer flex-col items-center justify-center gap-4 max-h-[75vh] mx-auto text-center transition",
          frame
            ? "rounded-3xl bg-white/85 px-6 py-10 shadow-[0_24px_60px_-40px_rgba(18,18,18,0.45)]"
            : "rounded-3xl px-6 py-12",
          isDragging
            ? "border-pink-400 bg-pink-50/80"
            : frame
              ? "hover:border-black/30"
              : "",
          className,
        ])}
        style={
          displayAspectRatio ? { aspectRatio: displayAspectRatio } : undefined
        }
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {isBusyForUser ? <div className="loading-ring" aria-hidden /> : null}
        {inputSrc ? (
          <>
            <img
              src={inputSrc}
              alt="Original"
              onLoad={handleInputLoad}
              className="absolute inset-0 h-full w-full object-cover rounded-3xl"
            />
            {outputSrc && (
              <>
                <img
                  ref={outputRef}
                  src={outputSrc}
                  alt="Result"
                  className="absolute inset-0 h-full w-full object-cover rounded-3xl opacity-0 transition-opacity duration-300"
                  style={isComparing ? { visibility: "hidden" } : undefined}
                />
                <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-2">
                  <div
                    className={clsx(
                      "whitespace-nowrap rounded-lg px-2 py-1 text-xs font-semibold backdrop-blur-sm shadow-sm",
                      !isComparing
                        ? "bg-black/80 text-white"
                        : "bg-white/80 text-black",
                    )}
                  >
                    {isComparing
                      ? "Original"
                      : isReady
                        ? "Result"
                        : "Rendering..."}
                  </div>
                  {isReady ? (
                    <button
                      type="button"
                      onPointerDown={handleCompareStart}
                      onPointerUp={handleCompareEnd}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      title="Compare with original"
                      className={clsx(
                        "flex rounded-full p-1 text-xs backdrop-blur-sm shadow-sm hover:rotate-45 cursor-pointer touch-none",
                        !isComparing
                          ? "bg-black/80 text-white"
                          : "bg-white/80 text-black",
                      )}
                    >
                      <Half2Icon className="size-4" />
                    </button>
                  ) : null}
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-[0_10px_25px_-15px_rgba(0,0,0,0.5)]">
              <UploadIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-black">
                Drop or paste your SketchUp render
              </p>
              <p className="text-sm text-black/60">
                PNG, JPG, WEBP, HEIC, or HEIF – up to 20 MB
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                {isBusyForUser ? "Generating..." : "Choose file"}
              </span>
              <span className="text-xs text-black/40">Try for free</span>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={isBusyForUser}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </motion.div>
  );
}
