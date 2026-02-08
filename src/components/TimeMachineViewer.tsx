"use client";

import { TrashIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import type { SyntheticEvent } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { ExportButton } from "@/components/ExportButton";
import { LayerNavigationControls } from "@/components/LayerNavigationControls";
import { ShareButton } from "@/components/ShareButton";
import { useSignedUrl } from "@/hooks/use-signed-url";
import {
  TIME_MACHINE_CONFIG,
  TIME_MACHINE_LAYER_SPRING,
} from "@/lib/animation-constants";
import type { AspectRatio } from "@/lib/aspect-ratio";
import {
  DropdownMenu,
  DropdownMenuItem,
} from "@/lib/components/ui/DropdownMenu";
import type { Generation, Thread } from "@/stores/thread-editor-store";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-:]/g, "") // Remove punctuation
    .replace(/:/g, "--") // Replace colons with double hyphens
    .replace(/\s+/g, "-"); // Replace spaces with hyphens
}

interface Layer {
  id: string;
  imageUrl: string | null;
  label: string;
  index: number; // 0 = original input, 1+ = generation outputs
}

interface TimeMachineViewerProps {
  /** For new threads without generations yet */
  inputSrc?: string | null;
  /** Original input image URL stored on the thread */
  threadInputUrl?: string | null;
  /** For existing threads with generations */
  generations?: Generation[];
  activeLayerIndex?: number;
  onLayerClick?: (index: number) => void;
  isGenerating?: boolean;
  aspectRatio?: AspectRatio | null;
  threadId: string;
  threadTitle?: string | null;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  /** Whether the current user owns this thread (can delete generations) */
  isOwner?: boolean;
}

function LayerImage({
  layer,
  isActive,
  relativePosition,
  onClick,
  isGenerating,
  threadId,
  threadTitle,
  isComparing,
  estimatedSeconds,
  isOwner,
  generationId,
  onDeleted,
}: {
  layer: Layer;
  isActive: boolean;
  relativePosition: number; // 0 = active, negative = behind
  onClick: () => void;
  isGenerating?: boolean;
  threadId: string;
  threadTitle?: string | null;
  isComparing?: boolean;
  estimatedSeconds: number;
  isOwner?: boolean;
  generationId?: string;
  onDeleted?: () => void;
}) {
  const signedUrl = useSignedUrl(layer.imageUrl);
  const config = TIME_MACHINE_CONFIG;
  const setInputImageDimensions = useThreadEditorStore(
    (state) => state.setInputImageDimensions,
  );
  const queryClient = useQueryClient();
  const threadQueryKey = ["thread", threadId];

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!generationId) throw new Error("No generation ID");
      const response = await fetch(`/api/generations/${generationId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete generation");
      }
      return response.json();
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: threadQueryKey });

      // Snapshot the previous value
      const previousThread = queryClient.getQueryData<Thread>(threadQueryKey);

      // Optimistically remove the generation from the thread
      queryClient.setQueryData<Thread>(threadQueryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          generations: old.generations.filter((g) => g.id !== generationId),
        };
      });

      // Navigate to previous layer before the UI updates
      onDeleted?.();

      // Return context with the previous value
      return { previousThread };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousThread) {
        queryClient.setQueryData(threadQueryKey, context.previousThread);
      }
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: threadQueryKey });
    },
  });

  const handleDelete = useCallback(() => {
    deleteMutation.mutate();
  }, [deleteMutation]);

  // Store Original layer dimensions when image loads (regardless of active state)
  const originalDimensionsRef = useRef<{
    width: number;
    height: number;
  } | null>(null);

  // Update store when Original layer becomes active and we have dimensions
  useEffect(() => {
    if (isActive && layer.index === 0 && originalDimensionsRef.current) {
      setInputImageDimensions(originalDimensionsRef.current);
    }
  }, [isActive, layer.index, setInputImageDimensions]);

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;
    if (!naturalWidth || !naturalHeight) return;

    // For Original layer, store dimensions in ref and update store if active
    if (layer.index === 0) {
      originalDimensionsRef.current = {
        width: naturalWidth,
        height: naturalHeight,
      };
      if (isActive) {
        setInputImageDimensions({ width: naturalWidth, height: naturalHeight });
      }
    }
  };

  // Calculate visual properties based on position relative to active layer
  const depth = Math.log2(Math.abs(relativePosition) + 1);
  const scale = config.scalePerLayer ** depth;
  const brightness = 1 - depth * config.brightnessPerLayer;
  const yOffset = depth * config.yOffsetPerLayer;
  const zIndex = relativePosition;

  // Only show layers that are behind or at the active position
  // and within the max visible range
  const isVisible =
    relativePosition <= 0 && -relativePosition <= config.maxVisibleLayers;

  if (!isVisible) return null;

  return (
    <motion.div
      onClick={onClick}
      className={clsx(
        "absolute inset-0 w-full rounded-2xl",
        isActive ? "cursor-default" : "cursor-pointer",
      )}
      style={{ zIndex, filter: `brightness(${brightness})` }}
      initial={false}
      animate={{
        scale,
        y: -yOffset,
      }}
      transition={isComparing ? { duration: 0 } : TIME_MACHINE_LAYER_SPRING}
      whileHover={!isActive ? { scale: scale * 1.01 } : undefined}
    >
      <div className="relative w-full h-full bg-white rounded-2xl border border-black/40 overflow-hidden">
        {signedUrl ? (
          <Image
            src={signedUrl}
            alt={layer.label}
            fill
            className="object-cover"
            unoptimized
            priority={isActive}
            onLoad={handleImageLoad}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/5">
            <span className="text-black/30 text-sm">
              {isGenerating && isActive ? "Generating..." : "No image"}
            </span>
          </div>
        )}

        {/* Layer label */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div
            className={clsx(
              "flex items-center h-6 px-2 rounded-lg text-xs font-medium backdrop-blur-sm transition-opacity",
              isActive ? "bg-black/70 text-white" : "bg-white/70 text-black/70",
            )}
          >
            {layer.label}
          </div>
        </div>
        {signedUrl && layer.index > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-2">
            {signedUrl && layer.index > 0 && isOwner && generationId && (
              <DropdownMenu buttonVariant="secondary" dropdownAlign="start">
                <DropdownMenuItem
                  onClick={handleDelete}
                  destructive
                  disabled={deleteMutation.isPending}
                >
                  <TrashIcon className="size-4" />
                  {deleteMutation.isPending
                    ? "Deleting..."
                    : "Delete iteration"}
                </DropdownMenuItem>
              </DropdownMenu>
            )}
            <ShareButton threadId={threadId} />
            <ExportButton
              imageUrl={signedUrl}
              filename={
                threadTitle
                  ? layer.index > 1
                    ? `${toKebabCase(threadTitle)}-${layer.index}.jpeg`
                    : `${toKebabCase(threadTitle)}.jpeg`
                  : `${toKebabCase(layer.label)}.jpeg`
              }
            />
          </div>
        )}
      </div>
      {isActive && isGenerating && (
        <div
          className="loading-ring"
          style={
            {
              "--ring-estimated-seconds": estimatedSeconds,
            } as React.CSSProperties
          }
          aria-hidden
        />
      )}
    </motion.div>
  );
}

export function TimeMachineViewer({
  inputSrc,
  threadInputUrl,
  generations = [],
  activeLayerIndex = 0,
  onLayerClick,
  isGenerating = false,
  aspectRatio,
  threadId,
  threadTitle,
  onNavigatePrevious,
  onNavigateNext,
  isOwner = false,
}: TimeMachineViewerProps) {
  // Get state from store
  const inputImageDimensions = useThreadEditorStore(
    (state) => state.inputImageDimensions,
  );
  const isComparing = useThreadEditorStore((state) => state.isComparing);
  const model = useThreadEditorStore((state) => state.model);
  const estimatedSeconds = model.startsWith("bfl/") ? 7 : 30;

  // Build layers array: original input (index 0) + generation outputs (index 1+)
  const layers = useMemo<Layer[]>(() => {
    // New thread mode: just show input image as "Original"
    if (generations.length === 0) {
      if (!inputSrc) return [];
      return [
        {
          id: "original",
          imageUrl: inputSrc,
          label: "Original",
          index: 0,
        },
      ];
    }

    // Existing thread mode: build from generations
    const result: Layer[] = [];

    // Layer 0: Original input (stored on thread)
    result.push({
      id: "original",
      imageUrl: threadInputUrl ?? null,
      label: "Original",
      index: 0,
    });

    // Layer 1+: Generation outputs
    generations.forEach((gen, i) => {
      result.push({
        id: gen.id,
        imageUrl: gen.output_url,
        label: `Iteration ${i + 1}`,
        index: i + 1,
      });
    });

    return result;
  }, [inputSrc, threadInputUrl, generations]);

  // Calculate CSS aspect ratio for the viewer
  const cssAspectRatio = useMemo(() => {
    if (aspectRatio) {
      // For the initial generation, preview the crop
      return aspectRatio.replace(":", "/");
    } else if (activeLayerIndex > 0) {
      // Layer N (N > 0) = generation at index N-1, use real output dimensions
      const activeGen = generations[activeLayerIndex - 1];
      if (activeGen?.width && activeGen?.height) {
        return `${activeGen.width}/${activeGen.height}`;
      }
    }

    // Use inputImageDimensions from store (set by handleImageLoad when active layer loads)
    // This covers: Layer 0 (original), and old generations without stored dimensions
    if (inputImageDimensions) {
      return `${inputImageDimensions.width}/${inputImageDimensions.height}`;
    }

    // Final fallback
    return "3/2";
  }, [aspectRatio, activeLayerIndex, inputImageDimensions, generations]);

  if (layers.length === 0) {
    return (
      <div
        className="w-full rounded-2xl border border-dashed border-black/20 bg-white/50 flex items-center justify-center"
        style={{ aspectRatio: cssAspectRatio }}
      >
        <span className="text-black/40">No generations yet</span>
      </div>
    );
  }

  const totalLayers = layers.length;
  const hasMultipleLayers = totalLayers > 1;

  return (
    <div>
      {/* Layer navigation - horizontal variant for narrow viewports (<= 75rem) */}
      {hasMultipleLayers && onNavigatePrevious && onNavigateNext && (
        <LayerNavigationControls
          orientation="horizontal"
          currentIndex={activeLayerIndex}
          totalLayers={totalLayers}
          onPrevious={onNavigatePrevious}
          onNext={onNavigateNext}
          disabled={isGenerating}
          className="flex justify-center min-[75rem]:hidden -mt-4 mb-12 relative z-20"
        />
      )}
      {/* Container with dynamic aspect ratio */}
      <div
        className="relative w-auto mx-auto max-h-[calc(90vh-8rem)] z-10"
        style={{ aspectRatio: cssAspectRatio }}
      >
        <AnimatePresence mode="popLayout">
          {layers.map((layer) => {
            const relativePosition = layer.index - activeLayerIndex;
            // Get the generation ID for this layer (layer 0 is original, no generation)
            const generationId =
              layer.index > 0 ? generations[layer.index - 1]?.id : undefined;
            return (
              <LayerImage
                key={layer.id}
                layer={layer}
                isActive={layer.index === activeLayerIndex}
                relativePosition={relativePosition}
                onClick={() => onLayerClick?.(layer.index)}
                isGenerating={isGenerating}
                threadId={threadId}
                threadTitle={threadTitle}
                isComparing={isComparing}
                estimatedSeconds={estimatedSeconds}
                isOwner={isOwner}
                generationId={generationId}
                onDeleted={() => {
                  // Navigate to previous layer if we're on the deleted one
                  if (layer.index === activeLayerIndex && layer.index > 0) {
                    onLayerClick?.(layer.index - 1);
                  }
                }}
              />
            );
          })}
        </AnimatePresence>
        {/* Layer navigation - vertical variant for wide viewports (> 75rem) */}
        {hasMultipleLayers && onNavigatePrevious && onNavigateNext && (
          <LayerNavigationControls
            orientation="vertical"
            currentIndex={activeLayerIndex}
            totalLayers={totalLayers}
            onPrevious={onNavigatePrevious}
            onNext={onNavigateNext}
            disabled={isGenerating}
            className="absolute -right-12 top-0 hidden min-[75rem]:flex"
          />
        )}
      </div>
    </div>
  );
}
