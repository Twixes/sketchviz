"use client";

import type { DragEvent, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createNoise2D } from "simplex-noise";

const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];

type UploadDropzoneProps = {
  onFileSelected: (file: File) => void;
  isBusy: boolean;
  error?: string | null;
  inputSrc?: string | null;
  outputSrc?: string | null;
  frame?: boolean;
  className?: string;
};

export function UploadDropzone({
  onFileSelected,
  isBusy,
  error,
  inputSrc,
  outputSrc,
  frame = true,
  className,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const outputRef = useRef<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);
  const labels = useMemo(
    () => ({
      input: "SketchUp render",
      output: "Photorealistic result",
    }),
    [],
  );

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file || isBusy) return;
      onFileSelected(file);
    },
    [isBusy, onFileSelected],
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
    }
  }, [inputSrc]);

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
      }
    },
    [],
  );

  return (
    <div className="relative w-full">
      {isBusy ? <div className="loading-ring" aria-hidden /> : null}
      <div
        className={[
          "group relative flex w-full cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden text-center transition",
          frame
            ? "rounded-3xl bg-white/85 px-6 py-10 shadow-[0_24px_60px_-40px_rgba(18,18,18,0.45)]"
            : "rounded-3xl px-6 py-12",
          isDragging
            ? "border-pink-400 bg-pink-50/80"
            : frame
              ? "hover:border-black/30"
              : "",
          className ?? "",
        ].join(" ")}
        style={aspectRatio ? { aspectRatio } : undefined}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
      >
        {inputSrc ? (
          <>
            <img
              src={inputSrc}
              alt={labels.input}
              onLoad={handleInputLoad}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <img
              ref={outputRef}
              src={outputSrc ?? inputSrc}
              alt={labels.output}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300"
            />
            <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-black shadow-sm">
              {labels.input}
            </div>
            {outputSrc ? (
              <div className="absolute right-4 top-4 rounded-full bg-black px-3 py-1 text-xs font-semibold text-white shadow-sm">
                {isReady ? labels.output : "Rendering..."}
              </div>
            ) : null}
            <div className="absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-black shadow-sm">
              Click to replace
            </div>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-[0_10px_25px_-15px_rgba(0,0,0,0.5)]">
              <span className="text-xs font-semibold tracking-[0.3em]">UP</span>
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-black">
                Drop your SketchUp render
              </p>
              <p className="text-sm text-black/60">
                PNG, JPG, WEBP, HEIC, or HEIF · up to 20MB
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                {isBusy ? "Generating..." : "Choose file"}
              </span>
              <span className="text-xs text-black/40">No account required</span>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          disabled={isBusy}
          onChange={(event) => handleFile(event.target.files?.[0] ?? null)}
        />
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      ) : null}
    </div>
  );
}
