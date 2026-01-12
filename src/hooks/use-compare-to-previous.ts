import { useCallback, useEffect, useRef } from "react";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

interface UseCompareToPreviousResult {
  handlePointerDown: (e: React.PointerEvent) => void;
  handlePointerUp: () => void;
}

export function useCompareToPrevious(): UseCompareToPreviousResult {
  const activeLayerIndex = useThreadEditorStore(
    (state) => state.activeLayerIndex,
  );
  const isGenerating = useThreadEditorStore((state) => state.isGenerating);
  const navigateToLayer = useThreadEditorStore(
    (state) => state.navigateToLayer,
  );
  const setIsComparing = useThreadEditorStore((state) => state.setIsComparing);

  const canCompare = activeLayerIndex > 0 && !isGenerating;
  const originalIndexRef = useRef<number | null>(null);

  // Handle pointer up anywhere to exit compare mode
  const handlePointerUp = useCallback(() => {
    if (originalIndexRef.current !== null) {
      setIsComparing(false);
      navigateToLayer(originalIndexRef.current);
      originalIndexRef.current = null;
    }
  }, [navigateToLayer, setIsComparing]);

  useEffect(() => {
    // Listen for both pointer and mouse events to ensure we catch the release
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("mouseup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [handlePointerUp]);

  // Handle pointer down to enter compare mode
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (canCompare && originalIndexRef.current === null) {
        e.preventDefault();
        originalIndexRef.current = activeLayerIndex;
        setIsComparing(true);
        navigateToLayer(activeLayerIndex - 1);
      }
    },
    [canCompare, activeLayerIndex, navigateToLayer, setIsComparing],
  );

  return { handlePointerDown, handlePointerUp };
}
