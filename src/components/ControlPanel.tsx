import { EnterIcon } from "@radix-ui/react-icons";
import type { User } from "@supabase/supabase-js";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { AspectRatioSelector } from "@/components/AspectRatioSelector";
import {
  INDOOR_LIGHT_OPTIONS,
  LightSelector,
  OUTDOOR_LIGHT_OPTIONS,
} from "@/components/LightSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { ReferenceImageUpload } from "@/components/ReferenceImageUpload";
import { UploadDropzone } from "@/components/UploadDropzone";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { Model } from "@/lib/schemas";
import { useUploadStore } from "@/stores/upload-store";

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;
const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

interface ControlPanelProps {
  user: User | null;
  inputSrc: string | null;
  outdoorLight: string | null;
  indoorLight: string | null;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  isBusyForUser: boolean;
  outputSrc: string | null;
  focusUpload: boolean;
  onFileSelected: (file: File) => Promise<void>;
  onOutdoorLightChange: (value: string | null) => void;
  onIndoorLightChange: (value: string | null) => void;
  onEditDescriptionChange: (value: string | null) => void;
  onModelChange: (value: Model) => void;
  onAspectRatioChange: (value: AspectRatio | null) => void;
  onGenerate: () => Promise<void>;
}

export function ControlPanel({
  user,
  inputSrc,
  outdoorLight,
  indoorLight,
  editDescription,
  model,
  aspectRatio,
  isBusyForUser,
  outputSrc,
  focusUpload,
  onFileSelected,
  onOutdoorLightChange,
  onIndoorLightChange,
  onEditDescriptionChange,
  onModelChange,
  onAspectRatioChange,
  onGenerate,
}: ControlPanelProps) {
  const dropzoneRef = useRef<HTMLDivElement | null>(null);
  const handleSignIn = useSignInCallback();
  const referenceUploadMutation = useReferenceUploadMutation();
  const {
    referenceImages,
    addReferenceImage,
    updateReferenceImageBlobUrl,
    removeReferenceImage,
  } = useUploadStore();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleReferenceImageDrop = async (file: File) => {
    if (referenceImages.length >= 3) {
      return;
    }

    // Create local preview immediately
    const localSrc = URL.createObjectURL(file);

    // Add to store with null blobUrl (loading state)
    const imageIndex = referenceImages.length;
    addReferenceImage(localSrc, null);

    try {
      // Upload to Vercel Blob
      const blobUrl = await referenceUploadMutation.mutateAsync({ file });

      // Update the blobUrl once upload completes
      updateReferenceImageBlobUrl(imageIndex, blobUrl);
    } catch (error) {
      console.error("Failed to upload reference image:", error);
      // Remove the failed upload
      removeReferenceImage(imageIndex);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the textarea itself, not a child
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      void handleReferenceImageDrop(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // Check if the item is an image
      if (item.type.startsWith("image/")) {
        e.preventDefault();

        const file = item.getAsFile();
        if (file) {
          void handleReferenceImageDrop(file);
        }
        break;
      }
    }
  };

  return (
    <motion.div
      ref={dropzoneRef}
      layout
      transition={LAYOUT_TRANSITION}
      className={clsx([
        "relative w-full min-w-0",
        focusUpload ? "max-w-5xl" : "",
      ])}
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
        onFileSelected={onFileSelected}
        frame={false}
        className={clsx([
          "min-h-[320px] border bg-white/85",
          !inputSrc
            ? "border-dashed border-black/20 hover:border-black/60 cursor-pointer"
            : "border-black/40",
          focusUpload && "shadow-[0_40px_90px_-50px_rgba(12,12,12,0.65)]",
        ])}
      />

      <AnimatePresence initial={false}>
        {inputSrc && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={FADE_TRANSITION}
            className="relative mt-6 flex flex-col gap-3 z-10"
          >
            <div className="flex items-center flex-wrap gap-x-4 gap-y-2 whitespace-nowrap *:shrink">
              <LightSelector
                label="Outdoor light"
                value={outdoorLight}
                options={OUTDOOR_LIGHT_OPTIONS}
                onChange={onOutdoorLightChange}
              />
              <LightSelector
                label="Indoor lighting"
                value={indoorLight}
                options={INDOOR_LIGHT_OPTIONS}
                onChange={onIndoorLightChange}
              />
              <AspectRatioSelector
                value={aspectRatio}
                onChange={onAspectRatioChange}
                hasReferenceImages={referenceImages.length > 0}
              />
              <ModelSelector value={model} onChange={onModelChange} />
            </div>

            <div className="flex relative">
              <textarea
                id="edit-description"
                value={editDescription ?? ""}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    onGenerate();
                  }
                }}
                onChange={(e) =>
                  onEditDescriptionChange(e.target.value || null)
                }
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onPaste={handlePaste}
                placeholder="Request edits or specify materials (optional)"
                rows={2}
                className={clsx([
                  "w-full rounded-xl border bg-white px-3 pt-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none transition-colors",
                  referenceImages.length > 0 ? "pb-16" : "pb-6",
                  isDraggingOver
                    ? "border-black/60 bg-black/5"
                    : "border-black/20",
                ])}
              />
              <ReferenceImageUpload disabled={isBusyForUser} />
            </div>

            <button
              type="submit"
              onClick={!user ? handleSignIn : onGenerate}
              disabled={isBusyForUser}
              className={clsx([
                "flex items-center gap-2 justify-center rounded-xl px-6 py-3 text-sm font-semibold transition-all",
                isBusyForUser
                  ? "cursor-not-allowed bg-black/20 text-black/40"
                  : "bg-black text-white hover:scale-[1.02] active:scale-[0.98]",
              ])}
            >
              {isBusyForUser ? (
                "Visualizing…"
              ) : !user ? (
                <>
                  <EnterIcon /> Log in with Google to complete visualization
                </>
              ) : outputSrc ? (
                "Visualize again"
              ) : (
                "Visualize"
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
