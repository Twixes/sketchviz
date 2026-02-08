import { create } from "zustand";

export interface ProjectSceneFile {
  file: File;
  localSrc: string;
  blobUrl: string | null;
  threadId: string | null;
}

export type WizardStep =
  | "upload"
  | "select"
  | "visualize"
  | "review-style"
  | "auto-generating";

interface ProjectState {
  // Creation wizard state
  wizardStep: WizardStep;
  sceneFiles: ProjectSceneFile[];
  selectedStartingSceneIndex: number | null;
  extractedStyleNotes: string | null;

  // Auto-generation progress
  autoGenProgress: { completed: number; total: number; failed: string[] };

  // Actions
  setWizardStep: (step: WizardStep) => void;
  addSceneFiles: (files: File[]) => void;
  removeSceneFile: (index: number) => void;
  updateSceneFileBlobUrl: (index: number, blobUrl: string) => void;
  updateSceneFileThreadId: (index: number, threadId: string) => void;
  selectStartingScene: (index: number) => void;
  setExtractedStyleNotes: (notes: string) => void;
  updateAutoGenProgress: (completed: number, failed?: string) => void;
  resetAutoGenProgress: (total: number) => void;
  reset: () => void;
}

const initialState = {
  wizardStep: "upload" as WizardStep,
  sceneFiles: [] as ProjectSceneFile[],
  selectedStartingSceneIndex: null as number | null,
  extractedStyleNotes: null as string | null,
  autoGenProgress: { completed: 0, total: 0, failed: [] as string[] },
};

export const useProjectStore = create<ProjectState>()((set, get) => ({
  ...initialState,

  setWizardStep: (step) => set({ wizardStep: step }),

  addSceneFiles: (files) => {
    const newSceneFiles = files.map((file) => ({
      file,
      localSrc: URL.createObjectURL(file),
      blobUrl: null,
      threadId: null,
    }));
    set((state) => ({
      sceneFiles: [...state.sceneFiles, ...newSceneFiles],
    }));
  },

  removeSceneFile: (index) => {
    const { sceneFiles, selectedStartingSceneIndex } = get();
    const file = sceneFiles[index];
    if (file?.localSrc.startsWith("blob:")) {
      URL.revokeObjectURL(file.localSrc);
    }
    const updated = sceneFiles.filter((_, i) => i !== index);
    let newSelected = selectedStartingSceneIndex;
    if (selectedStartingSceneIndex !== null) {
      if (selectedStartingSceneIndex === index) {
        newSelected = null;
      } else if (selectedStartingSceneIndex > index) {
        newSelected = selectedStartingSceneIndex - 1;
      }
    }
    set({
      sceneFiles: updated,
      selectedStartingSceneIndex: newSelected,
    });
  },

  updateSceneFileBlobUrl: (index, blobUrl) => {
    set((state) => {
      const updated = [...state.sceneFiles];
      if (updated[index]) {
        updated[index] = { ...updated[index], blobUrl };
      }
      return { sceneFiles: updated };
    });
  },

  updateSceneFileThreadId: (index, threadId) => {
    set((state) => {
      const updated = [...state.sceneFiles];
      if (updated[index]) {
        updated[index] = { ...updated[index], threadId };
      }
      return { sceneFiles: updated };
    });
  },

  selectStartingScene: (index) => set({ selectedStartingSceneIndex: index }),

  setExtractedStyleNotes: (notes) => set({ extractedStyleNotes: notes }),

  updateAutoGenProgress: (completed, failed) => {
    set((state) => ({
      autoGenProgress: {
        ...state.autoGenProgress,
        completed,
        failed: failed
          ? [...state.autoGenProgress.failed, failed]
          : state.autoGenProgress.failed,
      },
    }));
  },

  resetAutoGenProgress: (total) => {
    set({ autoGenProgress: { completed: 0, total, failed: [] } });
  },

  reset: () => {
    const { sceneFiles } = get();
    for (const file of sceneFiles) {
      if (file.localSrc.startsWith("blob:")) {
        URL.revokeObjectURL(file.localSrc);
      }
    }
    set(initialState);
  },
}));
