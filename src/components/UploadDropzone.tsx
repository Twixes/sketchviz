"use client";

import { UploadIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { frame, motion } from "motion/react";
import type { DragEvent, SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useSignedUrl } from "@/hooks/use-signed-url";
import { parseAspectRatio } from "@/lib/aspect-ratio";
import { cn } from "@/lib/cn";
import { ACCEPTED_MIME_TYPES } from "@/lib/constants";
import { useThreadEditorStore } from "@/stores/thread-editor-store";
import { Hint } from "./Hint";

type UploadDropzoneProps = {
  onFileSelected: (file: File) => void;
  className?: string;
};

export function UploadDropzone({
  onFileSelected,
  className,
}: UploadDropzoneProps) {
  // Get state from Zustand store
  const {
    isBusyForUser,
    error,
    inputSrc,
    setInputImageDimensions,
    aspectRatio: selectedAspectRatio,
  } = useThreadEditorStore();
  const { data: planData } = usePlanQuery();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);

  // Get signed URL for authenticated storage access
  const inputSignedUrl = useSignedUrl(inputSrc);

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

  // Calculate the display aspect ratio
  const displayAspectRatio = selectedAspectRatio
    ? parseAspectRatio(selectedAspectRatio)
    : aspectRatio;

  return (
    <motion.div className="relative w-full text-balance">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: this is a special dropzone use case */}
      <div
        className={cn([
          "group relative flex cursor-pointer flex-col items-center justify-center gap-4 max-h-[75vh] max-w-full mx-auto text-center transition",
          "rounded-xl border border-black/30 bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-lg px-6 py-10 shadow-[0_24px_60px_-40px_rgba(18,18,18,0.45)]",
          isDragging
            ? "border-pink-400 bg-pink-50/80"
            : "hover:border-black/60",
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
        {inputSrc && inputSignedUrl ? (
          <>
            <img
              src={inputSignedUrl}
              alt="Original"
              onLoad={handleInputLoad}
              className="absolute inset-0 h-full w-full bg-black object-cover rounded-xl"
            />
            <Hint position="top-right">Click to replace image</Hint>
          </>
        ) : (
          <>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white shadow-[0_10px_25px_-15px_rgba(0,0,0,0.5)]">
              <UploadIcon className="size-6" />
            </div>
            <div className="space-y-2">
              <p className="text-xl font-semibold text-black">
                Drop or paste your SketchUp render now
              </p>
              <p className="text-sm text-black/60">
                PNG, JPG, WEBP, HEIC, or HEIF – up to 20 MB
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                {isBusyForUser ? "Generating..." : "Choose file"}
              </span>
              <span className="text-xs text-black/40">
                {planData?.planType === "pro"
                  ? "Let's get right into it"
                  : "Try for free"}
              </span>
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
