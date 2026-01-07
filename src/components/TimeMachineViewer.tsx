"use client";

import { ReloadIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useMemo } from "react";
import { DownloadButton } from "@/components/DownloadButton";
import { LayerNavigationControls } from "@/components/LayerNavigationControls";
import { useSignedUrl } from "@/hooks/use-signed-url";
import {
  TIME_MACHINE_CONFIG,
  TIME_MACHINE_LAYER_SPRING,
} from "@/lib/animation-constants";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { Generation } from "@/stores/thread-editor-store";

interface Layer {
  id: string;
  imageUrl: string | null;
  label: string;
  index: number; // 0 = original input, 1+ = generation outputs
}

interface TimeMachineViewerProps {
  /** For new threads without generations yet */
  inputSrc?: string | null;
  /** For existing threads with generations */
  generations?: Generation[];
  activeLayerIndex?: number;
  onLayerClick?: (index: number) => void;
  isGenerating?: boolean;
  onVisualizeAgain?: () => void;
  aspectRatio?: AspectRatio | null;
  threadId?: string;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
}

function LayerImage({
  layer,
  isActive,
  relativePosition,
  onClick,
  isGenerating,
  onVisualizeAgain,
  threadId,
}: {
  layer: Layer;
  isActive: boolean;
  relativePosition: number; // 0 = active, negative = behind
  onClick: () => void;
  isGenerating?: boolean;
  onVisualizeAgain?: () => void;
  threadId?: string;
}) {
  const signedUrl = useSignedUrl(layer.imageUrl);
  const config = TIME_MACHINE_CONFIG;

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
    <motion.button
      type="button"
      onClick={onClick}
      className={clsx(
        "absolute inset-0 w-full rounded-3xl",
        isActive ? "cursor-default" : "cursor-pointer",
      )}
      style={{ zIndex, filter: `brightness(${brightness})` }}
      initial={false}
      animate={{
        scale,
        y: -yOffset,
      }}
      transition={TIME_MACHINE_LAYER_SPRING}
      whileHover={!isActive ? { scale: scale * 1.01 } : undefined}
    >
      <div className="relative w-full h-full bg-black/5 rounded-3xl border border-black/20 overflow-hidden">
        {signedUrl ? (
          <Image
            src={signedUrl}
            alt={layer.label}
            fill
            className="object-cover"
            unoptimized
            priority={isActive}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-black/5">
            <span className="text-black/30 text-sm">
              {isGenerating && isActive ? "Generating..." : "No image"}
            </span>
          </div>
        )}

        {/* Layer label and actions */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <div
            className={clsx(
              "px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm transition-opacity",
              isActive ? "bg-black/70 text-white" : "bg-white/70 text-black/70",
            )}
          >
            {layer.label}
          </div>
          {isActive && layer.index > 0 && onVisualizeAgain && !isGenerating && (
            // biome-ignore lint/a11y/useSemanticElements: this must be a div
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                onVisualizeAgain();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  onVisualizeAgain();
                }
              }}
              className={clsx(
                "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium cursor-pointer",
                "bg-white/80 text-black/70 backdrop-blur-sm",
                "hover:bg-white hover:text-black transition-colors",
              )}
            >
              <ReloadIcon className="w-3 h-3" />
              Visualize again
            </div>
          )}
        </div>
        {signedUrl && layer.index > 0 && (
          <div className="absolute bottom-3 right-3">
            <DownloadButton
              imageUrl={signedUrl}
              filename={
                threadId
                  ? `${threadId}-${layer.label.toLowerCase().replace(/\s+/g, "-")}.png`
                  : `${layer.label.toLowerCase().replace(/\s+/g, "-")}.png`
              }
              isActive={isActive}
            />
          </div>
        )}
      </div>
      {isActive && isGenerating && <div className="loading-ring" aria-hidden />}
    </motion.button>
  );
}

export function TimeMachineViewer({
  inputSrc,
  generations = [],
  activeLayerIndex = 0,
  onLayerClick,
  isGenerating = false,
  onVisualizeAgain,
  aspectRatio,
  threadId,
  onNavigatePrevious,
  onNavigateNext,
}: TimeMachineViewerProps) {
  // Convert aspect ratio from "16:9" format to "16/9" for CSS
  const cssAspectRatio = aspectRatio ? aspectRatio.replace(":", "/") : "3/2";

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

    // Layer 0: Original input (first generation's input_url)
    result.push({
      id: "original",
      imageUrl: generations[0]?.input_url ?? null,
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
  }, [inputSrc, generations]);

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
          className="flex justify-center min-[75rem]:hidden -mt-4 mb-12 z-1"
        />
      )}
      <div className="relative w-full">
        {/* Container with dynamic aspect ratio */}
        <div
          className="relative w-full"
          style={{ aspectRatio: cssAspectRatio }}
        >
          <AnimatePresence mode="popLayout">
            {layers.map((layer) => {
              const relativePosition = layer.index - activeLayerIndex;
              return (
                <LayerImage
                  key={layer.id}
                  layer={layer}
                  isActive={layer.index === activeLayerIndex}
                  relativePosition={relativePosition}
                  onClick={() => onLayerClick?.(layer.index)}
                  isGenerating={isGenerating}
                  onVisualizeAgain={onVisualizeAgain}
                  threadId={threadId}
                />
              );
            })}
          </AnimatePresence>
        </div>

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
