import { create } from "zustand";
import type { IndoorLight, OutdoorLight } from "@/lib/schemas";

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

  // Loading states
  isUploading: boolean;
  isGenerating: boolean;

  // Computed state
  isBusy: boolean;
  focusUpload: boolean;

  // Actions
  setInputSrc: (src: string | null) => void;
  setOutputSrc: (src: string | null) => void;
  setBlobUrl: (url: string | null) => void;
  setError: (error: string | null) => void;
  setOutdoorLight: (light: OutdoorLight) => void;
  setIndoorLight: (light: IndoorLight) => void;
  setEditDescription: (description: string | null) => void;
  setIsUploading: (isUploading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
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
  isUploading: false,
  isGenerating: false,
};

export const useUploadStore = create<UploadState>((set, get) => ({
  ...initialState,

  // Computed values
  get isBusy() {
    return get().isGenerating;
  },
  get focusUpload() {
    return Boolean(get().inputSrc);
  },

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
  setEditDescription: (description) => set({ editDescription: description }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),

  reset: () => {
    const { inputSrc } = get();

    // Clean up blob URL
    if (inputSrc?.startsWith("blob:")) {
      URL.revokeObjectURL(inputSrc);
    }

    set(initialState);
  },
}));
