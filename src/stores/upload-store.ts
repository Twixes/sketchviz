import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";

interface UploadState {
  // Image sources
  inputSrc: string | null;
  outputSrc: string | null;
  blobUrl: string | null;

  // UI state
  error: string | null;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;

  // Loading states
  isUploading: boolean;
  isGenerating: boolean;
  isBusyForUser: boolean;

  // Actions
  setInputSrc: (src: string | null) => void;
  setOutputSrc: (src: string | null) => void;
  setBlobUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  setOutdoorLight: (light: OutdoorLight) => void;
  setIndoorLight: (light: IndoorLight) => void;
  setEditDescription: (description: string | null) => void;
  setModel: (model: Model) => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setIsBusyForUser: (isBusy: boolean) => void;
  reset: () => void;
}

const initialState = {
  inputSrc: null,
  outputSrc: null,
  blobUrl: null,
  error: null,
  outdoorLight: null as OutdoorLight,
  indoorLight: null as IndoorLight,
  editDescription: null,
  model: `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}` as Model,
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

      setOutputSrc: (src) => set({ outputSrc: src }),
      setBlobUrl: (url) => set({ blobUrl: url }),
      setError: (error) => set({ error }),
      setOutdoorLight: (light) => set({ outdoorLight: light }),
      setIndoorLight: (light) => set({ indoorLight: light }),
      setEditDescription: (description) =>
        set({ editDescription: description }),
      setModel: (model: Model) => set({ model }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setIsBusyForUser: (isBusy) => set({ isBusyForUser: isBusy }),

      reset: () => {
        const { inputSrc, model } = get();

        // Clean up blob URL
        if (inputSrc?.startsWith("blob:")) {
          URL.revokeObjectURL(inputSrc);
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
