import {
  DoubleArrowUpIcon,
  EnterIcon,
  ExclamationTriangleIcon,
} from "@radix-ui/react-icons";
import type { User } from "@supabase/supabase-js";
import clsx from "clsx";
import { useRef, useState } from "react";
import { AspectRatioSelector } from "@/components/AspectRatioSelector";
import { FunkyBackgroundShapes1 } from "@/components/FunkyBackgroundMini";
import {
  INDOOR_LIGHT_OPTIONS,
  LightSelector,
  OUTDOOR_LIGHT_OPTIONS,
} from "@/components/LightSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { ReferenceImageUpload } from "@/components/ReferenceImageUpload";
import { UploadDropzone } from "@/components/UploadDropzone";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import type { AspectRatio } from "@/lib/aspect-ratio";
import { Button } from "@/lib/components/ui/Button";
import { PRO_PLAN_PRODUCT_ID } from "@/lib/constants";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";
import { useUploadStore } from "@/stores/upload-store";

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
  className?: string;
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
  className,
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

  const { data: creditsData } = usePlanQuery(!!user);
  const creditCost = determineCreditCostOfImageGeneration({ model });
  const hasInsufficientCredits = !!(
    user &&
    creditsData !== undefined &&
    creditsData.credits !== null &&
    creditsData.credits < creditCost
  );

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
    <div
      ref={dropzoneRef}
      className={clsx([
        "relative w-full min-w-0",
        focusUpload ? "max-w-5xl" : "",
        className,
      ])}
    >
      <FunkyBackgroundShapes1 />
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

      {inputSrc && (
        <div className="relative mt-6 flex flex-col gap-3 z-10">
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
              onChange={(e) => onEditDescriptionChange(e.target.value || null)}
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

          <Button
            type="submit"
            variant="primary"
            size="lg"
            link={hasInsufficientCredits ? "/billing/upgrade" : undefined}
            onClick={
              !user
                ? handleSignIn
                : !hasInsufficientCredits
                  ? onGenerate
                  : undefined
            }
            disabled={isBusyForUser}
            leftIcon={!user && !isBusyForUser ? <EnterIcon /> : undefined}
            className={
              "relative px-20" /* The horizontal padding is for the credit cost to fit */
            }
          >
            {isBusyForUser ? (
              "Visualizing…"
            ) : !user ? (
              "Log in with Google to complete visualization"
            ) : hasInsufficientCredits ? (
              <>
                You're out of free credits – upgrade to SketchViz Pro to
                visualize
                <DoubleArrowUpIcon />
              </>
            ) : outputSrc ? (
              "Visualize again"
            ) : (
              "Visualize"
            )}
            {user && (
              <div className="absolute top-3 bottom-3 right-3 rounded flex items-center px-1 border border-white/60 text-xs">
                {hasInsufficientCredits && (
                  <ExclamationTriangleIcon className="mr-0.5" />
                )}
                {creditCost} credits
              </div>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
