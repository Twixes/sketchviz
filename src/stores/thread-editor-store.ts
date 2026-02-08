import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AspectRatio, findClosestAspectRatio } from "@/lib/aspect-ratio";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import type {
  IndoorLight,
  Model,
  OutdoorLight,
  UserParams,
} from "@/lib/schemas";

export interface ReferenceImage {
  localSrc: string;
  blobUrl: string | null;
}

export interface Generation {
  id: string;
  output_url: string | null;
  user_params: UserParams;
  created_at: string;
  width: number | null;
  height: number | null;
}

export interface Thread {
  id: string;
  user_id: string;
  title: string | null;
  input_url: string;
  created_at: string;
  generations: Generation[];
}

interface StartNewThreadOptions {
  initialParams?: {
    inputSrc?: string;
    blobUrl?: string;
    editDescription?: string | null;
    indoorLight?: IndoorLight;
    outdoorLight?: OutdoorLight;
  };
}

interface ThreadEditorState {
  // Thread data
  thread: Thread | null;

  // Layer navigation (0 = original input, 1+ = generation outputs)
  activeLayerIndex: number;

  // Upload state (for new threads)
  inputSrc: string | null;
  blobUrl: string | null;
  inputImageDimensions: { width: number; height: number } | null;
  tentativeThreadId: string | null;

  // Editor state
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  referenceImages: ReferenceImage[];

  // UI state
  error: string | null;
  isComparing: boolean;

  // Loading states
  isUploading: boolean;
  isGenerating: boolean;
  isBusyForUser: boolean;

  // Computed helpers
  getActiveImageUrl: () => string | null;
  getActiveGeneration: () => Generation | null;
  getLayerCount: () => number;
  canNavigatePrevious: () => boolean;
  canNavigateNext: () => boolean;

  // Actions
  setThread: (thread: Thread) => void;
  addGeneration: (generation: Generation) => void;
  updateGenerationOutput: (
    generationId: string,
    outputUrl: string,
    width: number,
    height: number,
  ) => void;
  navigateToLayer: (index: number) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToLatest: () => void;
  setInputSrc: (src: string | null) => void;
  setBlobUrl: (url: string | null) => void;
  setTentativeThreadId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setInputImageDimensions: (
    dimensions: { width: number; height: number } | null,
  ) => void;
  setOutdoorLight: (light: OutdoorLight) => void;
  setIndoorLight: (light: IndoorLight) => void;
  setEditDescription: (description: string | null) => void;
  setModel: (model: Model) => void;
  setAspectRatio: (ratio: AspectRatio | null) => void;
  addReferenceImage: (localSrc: string, blobUrl: string | null) => void;
  updateReferenceImageBlobUrl: (index: number, blobUrl: string) => void;
  removeReferenceImage: (index: number) => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsBusyForUser: (isBusy: boolean) => void;
  setIsComparing: (isComparing: boolean) => void;
  reset: () => void;
  startNewThread: (options?: StartNewThreadOptions) => string;
}

/**
 * Returns a valid aspect ratio given constraints.
 * When using a Google model with reference images, aspectRatio cannot be null.
 */
function getConstrainedAspectRatio(
  desiredRatio: AspectRatio | null,
  model: Model,
  referenceImages: ReferenceImage[],
  inputImageDimensions: { width: number; height: number } | null,
): AspectRatio | null {
  if (
    desiredRatio === null &&
    model.startsWith("google/") &&
    referenceImages.length > 0
  ) {
    if (inputImageDimensions) {
      const imageRatio =
        inputImageDimensions.width / inputImageDimensions.height;
      return findClosestAspectRatio(imageRatio);
    }
    return "4:3";
  }
  return desiredRatio;
}

const initialState = {
  thread: null as Thread | null,
  activeLayerIndex: 0,
  inputSrc: null as string | null,
  blobUrl: null as string | null,
  inputImageDimensions: null as { width: number; height: number } | null,
  tentativeThreadId: null as string | null,
  outdoorLight: null as OutdoorLight,
  indoorLight: null as IndoorLight,
  editDescription: null as string | null,
  model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model,
  aspectRatio: null as AspectRatio | null,
  referenceImages: [] as ReferenceImage[],
  error: null as string | null,
  isComparing: false,
  isUploading: false,
  isGenerating: false,
  isBusyForUser: false,
};

export const useThreadEditorStore = create<ThreadEditorState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Computed helpers
      getActiveImageUrl: () => {
        const { thread, activeLayerIndex } = get();
        if (!thread || thread.generations.length === 0) return null;

        if (activeLayerIndex === 0) {
          // Return the original input image (stored on thread)
          return thread.input_url ?? null;
        }

        // Return the output of the generation at activeLayerIndex - 1
        const generation = thread.generations[activeLayerIndex - 1];
        return generation?.output_url ?? null;
      },

      getActiveGeneration: () => {
        const { thread, activeLayerIndex } = get();
        if (!thread || activeLayerIndex === 0) return null;
        return thread.generations[activeLayerIndex - 1] ?? null;
      },

      getLayerCount: () => {
        const { thread } = get();
        if (!thread) return 0;
        // +1 for original input layer
        return thread.generations.length + 1;
      },

      canNavigatePrevious: () => {
        const { activeLayerIndex } = get();
        return activeLayerIndex > 0;
      },

      canNavigateNext: () => {
        const { thread, activeLayerIndex } = get();
        if (!thread) return false;
        // Can go to layer N where N = generations.length (latest output)
        return activeLayerIndex < thread.generations.length;
      },

      // Actions
      setThread: (thread) => {
        const { thread: currentThread, referenceImages } = get();
        const isSameThread = currentThread?.id === thread.id;

        if (isSameThread) {
          // Updating existing thread: preserve current layer and params
          set({ thread });
        } else {
          // New thread: Navigate to the latest layer when setting thread
          // Latest layer gets fresh/default params (ready for next generation)
          const latestIndex = thread.generations.length;
          const newModel =
            `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model;
          // inputImageDimensions will be null for new thread, so use default if constrained
          const constrainedRatio = getConstrainedAspectRatio(
            null,
            newModel,
            referenceImages,
            null,
          );
          set({
            thread,
            activeLayerIndex: latestIndex,
            outdoorLight: null,
            indoorLight: null,
            editDescription: null,
            model: newModel,
            aspectRatio: constrainedRatio,
            inputImageDimensions: null, // Clear stale dimensions from previous thread
          });
        }
      },

      addGeneration: (generation) => {
        const { thread, referenceImages, inputImageDimensions } = get();
        if (!thread) return;

        const updatedThread = {
          ...thread,
          generations: [...thread.generations, generation],
        };
        const newModel =
          `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model;
        const constrainedRatio = getConstrainedAspectRatio(
          null,
          newModel,
          referenceImages,
          inputImageDimensions,
        );
        // Navigate to the new layer (latest) with fresh params
        set({
          thread: updatedThread,
          activeLayerIndex: updatedThread.generations.length,
          outdoorLight: null,
          indoorLight: null,
          editDescription: null,
          model: newModel,
          aspectRatio: constrainedRatio,
        });
      },

      updateGenerationOutput: (generationId, outputUrl, width, height) => {
        const { thread } = get();
        if (!thread) return;

        const updatedGenerations = thread.generations.map((gen) =>
          gen.id === generationId
            ? { ...gen, output_url: outputUrl, width, height }
            : gen,
        );
        set({ thread: { ...thread, generations: updatedGenerations } });
      },

      navigateToLayer: (index) => {
        const { thread, referenceImages, inputImageDimensions } = get();
        if (!thread) return;

        const maxIndex = thread.generations.length;
        const clampedIndex = Math.max(0, Math.min(index, maxIndex));
        const isLatestLayer = clampedIndex === maxIndex;

        if (isLatestLayer) {
          // Latest layer: reset to defaults (ready to configure next generation)
          const newModel =
            `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model;
          const constrainedRatio = getConstrainedAspectRatio(
            null,
            newModel,
            referenceImages,
            inputImageDimensions,
          );
          set({
            activeLayerIndex: clampedIndex,
            outdoorLight: null,
            indoorLight: null,
            editDescription: null,
            model: newModel,
            aspectRatio: constrainedRatio,
          });
        } else {
          // Past layers: load the historical params from that generation
          // Layer 0 = original input, use first generation's params
          // Layer N = use generation at index N-1
          const generationIndex = clampedIndex === 0 ? 0 : clampedIndex - 1;
          const generation = thread.generations[generationIndex];

          if (generation?.user_params) {
            const params = generation.user_params;
            const newModel =
              params.model ??
              (`${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model);
            const constrainedRatio = getConstrainedAspectRatio(
              params.aspect_ratio ?? null,
              newModel,
              referenceImages,
              inputImageDimensions,
            );
            set({
              activeLayerIndex: clampedIndex,
              outdoorLight: params.outdoor_light ?? null,
              indoorLight: params.indoor_light ?? null,
              editDescription: params.edit_description ?? null,
              model: newModel,
              aspectRatio: constrainedRatio,
            });
          } else {
            set({ activeLayerIndex: clampedIndex });
          }
        }
      },

      navigatePrevious: () => {
        const { activeLayerIndex, navigateToLayer } = get();
        if (activeLayerIndex > 0) {
          navigateToLayer(activeLayerIndex - 1);
        }
      },

      navigateNext: () => {
        const { thread, activeLayerIndex, navigateToLayer } = get();
        if (!thread) return;
        if (activeLayerIndex < thread.generations.length) {
          navigateToLayer(activeLayerIndex + 1);
        }
      },

      navigateToLatest: () => {
        const { thread, navigateToLayer } = get();
        if (!thread) return;
        navigateToLayer(thread.generations.length);
      },

      setInputSrc: (src) => {
        const prevSrc = get().inputSrc;
        set({ inputSrc: src });

        // Clean up previous blob URL
        if (prevSrc?.startsWith("blob:")) {
          URL.revokeObjectURL(prevSrc);
        }
      },

      setBlobUrl: (url) => set({ blobUrl: url }),
      setTentativeThreadId: (id) => set({ tentativeThreadId: id }),
      setError: (error) => set({ error }),
      setInputImageDimensions: (dimensions) =>
        set({ inputImageDimensions: dimensions }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setIsBusyForUser: (isBusy) => set({ isBusyForUser: isBusy }),

      setOutdoorLight: (light) => set({ outdoorLight: light }),
      setIndoorLight: (light) => set({ indoorLight: light }),
      setEditDescription: (description) =>
        set({ editDescription: description }),
      setModel: (model) => {
        const { aspectRatio, referenceImages, inputImageDimensions } = get();
        const constrainedRatio = getConstrainedAspectRatio(
          aspectRatio,
          model,
          referenceImages,
          inputImageDimensions,
        );
        set({ model, aspectRatio: constrainedRatio });
      },
      setAspectRatio: (ratio) => {
        const { model, referenceImages, inputImageDimensions } = get();
        const constrainedRatio = getConstrainedAspectRatio(
          ratio,
          model,
          referenceImages,
          inputImageDimensions,
        );
        set({ aspectRatio: constrainedRatio });
      },

      addReferenceImage: (localSrc, blobUrl) => {
        const { referenceImages, inputImageDimensions, aspectRatio, model } =
          get();
        if (referenceImages.length < 3) {
          const newReferenceImages = [
            ...referenceImages,
            { localSrc, blobUrl },
          ];
          // If using Google model and aspectRatio is null, auto-select
          const constrainedRatio = getConstrainedAspectRatio(
            aspectRatio,
            model,
            newReferenceImages,
            inputImageDimensions,
          );
          set({
            referenceImages: newReferenceImages,
            aspectRatio: constrainedRatio,
          });
        }
      },

      updateReferenceImageBlobUrl: (index, blobUrl) => {
        const { referenceImages } = get();
        const updatedImages = [...referenceImages];
        if (updatedImages[index]) {
          updatedImages[index] = { ...updatedImages[index], blobUrl };
          set({ referenceImages: updatedImages });
        }
      },

      removeReferenceImage: (index) => {
        const { referenceImages } = get();
        const imageToRemove = referenceImages[index];

        if (imageToRemove?.localSrc.startsWith("blob:")) {
          URL.revokeObjectURL(imageToRemove.localSrc);
        }

        const updatedImages = referenceImages.filter((_, i) => i !== index);
        set({ referenceImages: updatedImages });

        if (updatedImages.length === 0) {
          set({ aspectRatio: null });
        }
      },

      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsComparing: (isComparing) => set({ isComparing }),

      reset: () => {
        const { inputSrc, referenceImages, model } = get();

        // Clean up input image blob URL
        if (inputSrc?.startsWith("blob:")) {
          URL.revokeObjectURL(inputSrc);
        }

        // Clean up reference image blob URLs
        for (const refImage of referenceImages) {
          if (refImage.localSrc.startsWith("blob:")) {
            URL.revokeObjectURL(refImage.localSrc);
          }
        }

        // Reset but preserve model selection
        set({ ...initialState, model });
      },

      startNewThread: (options) => {
        get().reset();
        const threadId = crypto.randomUUID();
        set({ tentativeThreadId: threadId });

        if (options?.initialParams) {
          const {
            inputSrc,
            blobUrl,
            editDescription,
            indoorLight,
            outdoorLight,
          } = options.initialParams;
          if (inputSrc !== undefined) get().setInputSrc(inputSrc);
          if (blobUrl !== undefined) set({ blobUrl });
          if (editDescription !== undefined) set({ editDescription });
          if (indoorLight !== undefined) set({ indoorLight });
          if (outdoorLight !== undefined) set({ outdoorLight });
        }

        return threadId;
      },
    }),
    {
      name: "sketchviz-storage",
      partialize: (state) => ({ model: state.model }),
      migrate: (state, version) => {
        if (typeof state !== "object" || state === null) {
          return state;
        }
        if (
          version === 0 &&
          "model" in state &&
          state.model === "google/gemini-2.5-flash-image-preview"
        ) {
          state.model = `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`;
        }
        return state;
      },
      version: 1,
    },
  ),
);
