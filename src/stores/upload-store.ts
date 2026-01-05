import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type AspectRatio, findClosestAspectRatio } from "@/lib/aspect-ratio";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";

export interface ReferenceImage {
  localSrc: string; // Local blob URL for preview
  blobUrl: string | null; // Uploaded blob URL (null while uploading)
}

interface UploadState {
  // Image sources
  inputSrc: string | null;
  blobUrl: string | null;
  referenceImages: ReferenceImage[];
  inputImageDimensions: { width: number; height: number } | null;

  // Thread state
  tentativeThreadId: string | null;

  // UI state
  error: string | null;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;

  // Loading states
  isUploading: boolean;
  isGenerating: boolean;
  isBusyForUser: boolean;

  // Actions
  setInputSrc: (src: string | null) => void;
  setBlobUrl: (url: string | null) => void;
  setTentativeThreadId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setOutdoorLight: (light: OutdoorLight) => void;
  setIndoorLight: (light: IndoorLight) => void;
  setEditDescription: (description: string | null) => void;
  setModel: (model: Model) => void;
  setAspectRatio: (ratio: AspectRatio | null) => void;
  setInputImageDimensions: (
    dimensions: { width: number; height: number } | null,
  ) => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsBusyForUser: (isBusy: boolean) => void;
  addReferenceImage: (localSrc: string, blobUrl: string | null) => void;
  updateReferenceImageBlobUrl: (index: number, blobUrl: string) => void;
  removeReferenceImage: (index: number) => void;
  reset: () => void;
}

const initialState = {
  inputSrc: null,
  blobUrl: null,
  referenceImages: [] as ReferenceImage[],
  inputImageDimensions: null,
  tentativeThreadId: null,
  error: null,
  outdoorLight: null as OutdoorLight,
  indoorLight: null as IndoorLight,
  editDescription: null,
  model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model,
  aspectRatio: null as AspectRatio | null,
  isUploading: false,
  isGenerating: false,
  isBusyForUser: false,
};

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Actions
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
      setOutdoorLight: (light) => set({ outdoorLight: light }),
      setIndoorLight: (light) => set({ indoorLight: light }),
      setEditDescription: (description) =>
        set({ editDescription: description }),
      setModel: (model: Model) => set({ model }),
      setAspectRatio: (ratio: AspectRatio | null) =>
        set({ aspectRatio: ratio }),
      setInputImageDimensions: (dimensions) =>
        set({ inputImageDimensions: dimensions }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsBusyForUser: (isBusy) => set({ isBusyForUser: isBusy }),

      addReferenceImage: (localSrc, blobUrl) => {
        const { referenceImages, inputImageDimensions, aspectRatio } = get();
        if (referenceImages.length < 3) {
          set({ referenceImages: [...referenceImages, { localSrc, blobUrl }] });

          // If this is the first reference image and we have input dimensions,
          // auto-select the closest aspect ratio
          if (
            referenceImages.length === 0 &&
            inputImageDimensions &&
            !aspectRatio
          ) {
            const imageRatio =
              inputImageDimensions.width / inputImageDimensions.height;
            const closestRatio = findClosestAspectRatio(imageRatio);
            set({ aspectRatio: closestRatio });
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

        // Clean up local blob URL
        if (imageToRemove?.localSrc.startsWith("blob:")) {
          URL.revokeObjectURL(imageToRemove.localSrc);
        }

        const updatedImages = referenceImages.filter((_, i) => i !== index);
        set({ referenceImages: updatedImages });

        // If all reference images are removed, reset aspect ratio to null (Preserve)
        if (updatedImages.length === 0) {
          set({ aspectRatio: null });
        }
      },

      reset: () => {
        const { inputSrc, referenceImages, model } = get();

        // Clean up blob URL
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
    }),
    {
      name: "sketchviz-storage",
      partialize: (state) => ({ model: state.model }),
    },
  ),
);
