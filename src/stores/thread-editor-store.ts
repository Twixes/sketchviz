import { create } from "zustand";
import type { AspectRatio } from "@/lib/aspect-ratio";
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
  input_url: string;
  output_url: string | null;
  user_params: UserParams;
  created_at: string;
}

export interface Thread {
  id: string;
  title: string | null;
  created_at: string;
  generations: Generation[];
}

interface ThreadEditorState {
  // Thread data
  thread: Thread | null;

  // Layer navigation (0 = original input, 1+ = generation outputs)
  activeLayerIndex: number;

  // Editor state
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  referenceImages: ReferenceImage[];

  // Loading states
  isGenerating: boolean;

  // Computed helpers
  getActiveImageUrl: () => string | null;
  getActiveGeneration: () => Generation | null;
  getLayerCount: () => number;
  canNavigatePrevious: () => boolean;
  canNavigateNext: () => boolean;

  // Actions
  setThread: (thread: Thread) => void;
  addGeneration: (generation: Generation) => void;
  updateGenerationOutput: (generationId: string, outputUrl: string) => void;
  navigateToLayer: (index: number) => void;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToLatest: () => void;
  setOutdoorLight: (light: OutdoorLight) => void;
  setIndoorLight: (light: IndoorLight) => void;
  setEditDescription: (description: string | null) => void;
  setModel: (model: Model) => void;
  setAspectRatio: (ratio: AspectRatio | null) => void;
  addReferenceImage: (localSrc: string, blobUrl: string | null) => void;
  updateReferenceImageBlobUrl: (index: number, blobUrl: string) => void;
  removeReferenceImage: (index: number) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  reset: () => void;
}

const initialState = {
  thread: null as Thread | null,
  activeLayerIndex: 0,
  outdoorLight: null as OutdoorLight,
  indoorLight: null as IndoorLight,
  editDescription: null as string | null,
  model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model,
  aspectRatio: null as AspectRatio | null,
  referenceImages: [] as ReferenceImage[],
  isGenerating: false,
};

export const useThreadEditorStore = create<ThreadEditorState>()((set, get) => ({
  ...initialState,

  // Computed helpers
  getActiveImageUrl: () => {
    const { thread, activeLayerIndex } = get();
    if (!thread || thread.generations.length === 0) return null;

    if (activeLayerIndex === 0) {
      // Return the original input image (first generation's input)
      return thread.generations[0]?.input_url ?? null;
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
    // Navigate to the latest layer when setting thread
    // Latest layer gets fresh/default params (ready for next generation)
    const latestIndex = thread.generations.length;
    set({
      thread,
      activeLayerIndex: latestIndex,
      outdoorLight: null,
      indoorLight: null,
      editDescription: null,
      model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
      aspectRatio: null,
    });
  },

  addGeneration: (generation) => {
    const { thread } = get();
    if (!thread) return;

    const updatedThread = {
      ...thread,
      generations: [...thread.generations, generation],
    };
    // Navigate to the new layer (latest) with fresh params
    set({
      thread: updatedThread,
      activeLayerIndex: updatedThread.generations.length,
      outdoorLight: null,
      indoorLight: null,
      editDescription: null,
      model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
      aspectRatio: null,
    });
  },

  updateGenerationOutput: (generationId, outputUrl) => {
    const { thread } = get();
    if (!thread) return;

    const updatedGenerations = thread.generations.map((gen) =>
      gen.id === generationId ? { ...gen, output_url: outputUrl } : gen,
    );
    set({ thread: { ...thread, generations: updatedGenerations } });
  },

  navigateToLayer: (index) => {
    const { thread } = get();
    if (!thread) return;

    const maxIndex = thread.generations.length;
    const clampedIndex = Math.max(0, Math.min(index, maxIndex));
    const isLatestLayer = clampedIndex === maxIndex;

    if (isLatestLayer) {
      // Latest layer: reset to defaults (ready to configure next generation)
      set({
        activeLayerIndex: clampedIndex,
        outdoorLight: null,
        indoorLight: null,
        editDescription: null,
        model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
        aspectRatio: null,
      });
    } else {
      // Past layers: load the historical params from that generation
      // Layer 0 = original input, use first generation's params
      // Layer N = use generation at index N-1
      const generationIndex = clampedIndex === 0 ? 0 : clampedIndex - 1;
      const generation = thread.generations[generationIndex];

      if (generation?.user_params) {
        const params = generation.user_params;
        set({
          activeLayerIndex: clampedIndex,
          outdoorLight: params.outdoor_light ?? null,
          indoorLight: params.indoor_light ?? null,
          editDescription: params.edit_description ?? null,
          model:
            params.model ??
            `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
          aspectRatio: params.aspect_ratio ?? null,
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

  setOutdoorLight: (light) => set({ outdoorLight: light }),
  setIndoorLight: (light) => set({ indoorLight: light }),
  setEditDescription: (description) => set({ editDescription: description }),
  setModel: (model) => set({ model }),
  setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

  addReferenceImage: (localSrc, blobUrl) => {
    const { referenceImages, aspectRatio } = get();
    if (referenceImages.length < 3) {
      set({ referenceImages: [...referenceImages, { localSrc, blobUrl }] });

      // If this is the first reference image and no aspect ratio is set,
      // default to 16:9 (common for visualizations)
      if (referenceImages.length === 0 && !aspectRatio) {
        set({ aspectRatio: "16:9" });
      }
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

  reset: () => {
    const { referenceImages, model } = get();

    for (const refImage of referenceImages) {
      if (refImage.localSrc.startsWith("blob:")) {
        URL.revokeObjectURL(refImage.localSrc);
      }
    }

    set({ ...initialState, model });
  },
}));
