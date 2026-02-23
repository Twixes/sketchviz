"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  ArrowLeftIcon,
  CheckCircledIcon,
  Cross2Icon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { ThreadView } from "@/app/threads/[thread_id]/ThreadView";
import { CreditBadge } from "@/components/GenerateButton";
import { NeonShape } from "@/components/NeonShape";
import { useAcceptStyleMutation } from "@/hooks/use-accept-style-mutation";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";
import { Input } from "@/lib/components/ui/Input";
import { ACCEPTED_MIME_TYPES } from "@/lib/constants";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/stores/project-store";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

const STEP_SLIDE_VARIANTS = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 },
};

const STEPS: Array<{ key: string; label: string }> = [
  { key: "name", label: "New project" },
  { key: "select", label: "Select starting scene" },
  { key: "visualize", label: "Visualize" },
  { key: "extracting-style", label: "Extracting style notes" },
  { key: "review-style", label: "Review style notes" },
];

function getStepLabel(key: string): string {
  return STEPS.find((s) => s.key === key)?.label ?? "";
}

function StepIndicator({ currentStep }: { currentStep: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="flex items-center gap-2">
      {STEPS.map((step, i) => (
        <div
          key={step.key}
          className={clsx(
            "h-1.5 rounded-full transition-all",
            i <= currentIndex ? "bg-black w-8" : "bg-black/15 w-4",
          )}
          title={step.label}
        />
      ))}
    </div>
  );
}

function NameAndUploadStep() {
  const store = useProjectStore();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);

  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  const uploadSceneFile = useCallback(
    async (
      supabase: ReturnType<typeof createClient>,
      file: File,
      index: number,
    ) => {
      const timestamp = new Date().toISOString();
      const filenameParts = file.name.split(".");
      const ext = filenameParts.at(-1);
      const baseName = filenameParts.slice(0, -1).join(".") || "scene";
      const filename = ext
        ? `${baseName}-${timestamp}.${ext}`
        : `${baseName}-${timestamp}`;

      const { data, error } = await supabase.storage
        .from("input-images")
        .upload(filename, file, { contentType: file.type, upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("input-images").getPublicUrl(data.path);

      store.updateSceneFileBlobUrl(index, publicUrl);
    },
    [store],
  );

  const handleFilesSelected = useCallback(
    (files: FileList | File[]) => {
      const validFiles = Array.from(files).filter((f) =>
        ACCEPTED_MIME_TYPES.includes(f.type),
      );
      if (validFiles.length === 0) {
        toast.error("No valid image files selected");
        return;
      }

      const currentLength = store.sceneFiles.length;
      store.addSceneFiles(validFiles);

      const supabase = createClient();
      for (let i = 0; i < validFiles.length; i++) {
        uploadSceneFile(supabase, validFiles[i], currentLength + i);
      }
    },
    [store, uploadSceneFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    },
    [handleFilesSelected],
  );

  const hasScenes = store.sceneFiles.length > 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-black">
          {getStepLabel("name")}
        </h2>
        <p className="mt-1 text-sm text-black/60">
          Name your project and upload scene images
        </p>
      </div>

      <Input
        ref={nameInputRef}
        type="text"
        value={store.projectTitle}
        onChange={(e) => store.setProjectTitle(e.target.value)}
        placeholder="Project name"
      />

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {!hasScenes && (
        /* biome-ignore lint/a11y/noStaticElementInteractions: dropzone */
        /* biome-ignore lint/a11y/useKeyWithClickEvents: dropzone */
        <div
          className={clsx(
            "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            "border-black/20 hover:border-black/40 cursor-pointer",
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <UploadIcon className="mx-auto size-8 text-black/40 mb-3" />
          <p className="text-sm text-black/60">
            Drop or click to upload scene images
          </p>
        </div>
      )}

      {hasScenes && (
        /* biome-ignore lint/a11y/noStaticElementInteractions: dropzone */
        <div
          className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {store.sceneFiles.map((scene, index) => (
            <SceneThumbnail
              key={scene.localSrc}
              scene={scene}
              index={index}
              onRemove={() => store.removeSceneFile(index)}
            />
          ))}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: add more button */}
          {/* biome-ignore lint/a11y/noStaticElementInteractions: add more button */}
          <div
            className="aspect-video rounded-lg border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:border-black/40 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <PlusIcon className="size-6 text-black/40" />
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={!store.projectTitle.trim() || !hasScenes}
          tooltip={
            !store.projectTitle.trim()
              ? "Please enter a project name"
              : !hasScenes
                ? "Please upload at least one scene image"
                : undefined
          }
          onClick={() => store.setWizardStep("select")}
        >
          Next
        </Button>
      </div>
    </div>
  );
}

function SceneThumbnail({
  scene,
  index,
  isSelected,
  onSelect,
  onRemove,
}: {
  scene: { localSrc: string; blobUrl: string | null };
  index: number;
  isSelected?: boolean;
  onSelect?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative group">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: thumbnail button */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: thumbnail button */}
      <div
        className={clsx(
          "aspect-video rounded-lg overflow-hidden border-2 transition-all",
          onSelect && "cursor-pointer",
          isSelected
            ? "border-black ring-2 ring-black/20"
            : "border-black/20 hover:border-black/40",
        )}
        onClick={onSelect}
      >
        <img
          src={scene.localSrc}
          alt={`Scene ${index + 1}`}
          className="h-full w-full object-cover"
        />
        {!scene.blobUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="loading-ring" aria-hidden />
          </div>
        )}
        {isSelected && (
          <div className="absolute top-2 left-2">
            <CheckCircledIcon className="size-5 text-black bg-white rounded-full" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-2 -right-2 p-1 rounded-full bg-white border border-black/20 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
      >
        <TrashIcon className="size-3 text-red-600" />
      </button>
      <p className="mt-1 text-xs text-black/50 text-center">
        Scene {index + 1}
      </p>
    </div>
  );
}

function SelectStep() {
  const store = useProjectStore();
  const [isCreating, setIsCreating] = useState(false);

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      const sceneFiles = store.sceneFiles;
      const allUploaded = sceneFiles.every((f) => f.blobUrl !== null);
      if (!allUploaded) {
        throw new Error("Some files are still uploading");
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: store.projectTitle || "Untitled Project",
          scene_input_urls: sceneFiles.map((f) => f.blobUrl),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      for (let i = 0; i < data.project.threads.length; i++) {
        store.updateSceneFileThreadId(i, data.project.threads[i].id);
      }

      return data.project as {
        id: string;
        title: string;
        threads: Array<{ id: string; input_url: string }>;
      };
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to create project";
      toast.error(message);
      setIsCreating(false);
    },
  });

  const handleStartVisualizing = useCallback(async () => {
    if (store.selectedStartingSceneIndex === null) {
      toast.error("Please select a starting scene");
      return;
    }

    setIsCreating(true);
    try {
      const project = await createProjectMutation.mutateAsync();
      store.setProjectId(project.id);

      const startingThread =
        project.threads[store.selectedStartingSceneIndex ?? 0];
      if (startingThread) {
        store.setStartingSceneThreadId(startingThread.id);
        store.setWizardStep("visualize");
      }
    } catch {
      setIsCreating(false);
    }
  }, [store, createProjectMutation]);

  const allUploaded = store.sceneFiles.every((f) => f.blobUrl !== null);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-black">
          {getStepLabel("select")}
        </h2>
        <p className="mt-1 text-sm text-black/60">
          Pick a scene to visualize first. Its look will be applied to all other
          scenes.
        </p>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {store.sceneFiles.map((scene, index) => (
          <SceneThumbnail
            key={scene.localSrc}
            scene={scene}
            index={index}
            isSelected={store.selectedStartingSceneIndex === index}
            onSelect={() => store.selectStartingScene(index)}
            onRemove={() => store.removeSceneFile(index)}
          />
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="secondary"
          leftIcon={<ArrowLeftIcon />}
          onClick={() => store.setWizardStep("name")}
        >
          Back
        </Button>
        <Button
          variant="primary"
          disabled={
            store.selectedStartingSceneIndex === null ||
            !allUploaded ||
            isCreating
          }
          loading={isCreating}
          onClick={handleStartVisualizing}
        >
          Start visualizing
        </Button>
      </div>
    </div>
  );
}

function VisualizeStep() {
  const store = useProjectStore();
  const threadEditorStore = useThreadEditorStore();
  const acceptStyleMutation = useAcceptStyleMutation();
  const [isAccepting, setIsAccepting] = useState(false);

  // Force Pro model for style consistency in the project wizard
  const currentModel = threadEditorStore.model;
  const setModel = threadEditorStore.setModel;
  useEffect(() => {
    if (!currentModel.startsWith("google/")) {
      setModel("google/gemini-3-pro-image-preview");
    }
  }, [currentModel, setModel]);

  const threadId = store.startingSceneThreadId;
  const activeGeneration = threadEditorStore.getActiveGeneration();
  const hasGeneration = !!activeGeneration?.output_url;
  const model = threadEditorStore.model;

  const remainingScenes =
    store.sceneFiles.length > 1 ? store.sceneFiles.length - 1 : 0;

  const handleAcceptLook = useCallback(async () => {
    const activeGen = threadEditorStore.getActiveGeneration();
    if (!activeGen?.id || !store.projectId) return;

    setIsAccepting(true);
    store.setWizardStep("extracting-style");

    try {
      const result = await acceptStyleMutation.mutateAsync({
        projectId: store.projectId,
        generationId: activeGen.id,
      });
      store.setExtractedStyleNotes(result.style_notes);
      store.setWizardStep("review-style");
    } catch {
      store.setWizardStep("visualize");
      setIsAccepting(false);
    }
  }, [threadEditorStore, store, acceptStyleMutation]);

  if (!threadId) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-3">
        <p className="text-sm text-blue-800">
          Visualize, re-visualize, and iterate until you're happy with the look
          – then accept it. The accepted style will be applied to all other
          scenes.
        </p>
      </div>

      <ThreadView threadId={threadId} embedded />

      {hasGeneration && (
        <Button
          variant="primary"
          size="lg"
          className="w-full bg-emerald-600 hover:bg-emerald-700 relative"
          onClick={handleAcceptLook}
          disabled={
            isAccepting ||
            threadEditorStore.isGenerating ||
            threadEditorStore.isBusyForUser
          }
          leftIcon={<CheckCircledIcon />}
        >
          Accept this look
          {remainingScenes > 0 && (
            <CreditBadge
              creditCost={
                determineCreditCostOfImageGeneration({ model }) *
                remainingScenes
              }
              className="absolute top-3 bottom-3 right-3 border-white/60"
            />
          )}
        </Button>
      )}
    </div>
  );
}

function useAnimatedEllipsis(intervalMs = 500) {
  const [dotCount, setDotCount] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setDotCount((prev) => (prev + 1) % 4);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return ".".repeat(dotCount);
}

function ExtractingStyleStep() {
  const ellipsis = useAnimatedEllipsis();

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="relative">
        <NeonShape
          shape="spiral"
          color="pink"
          size="xl"
          animation="breathing"
        />
        <NeonShape
          shape="diamond"
          color="turquoise"
          size="lg"
          animation="drift"
          className="absolute -right-8 -bottom-4"
        />
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-black">
          {getStepLabel("extracting-style")}
          {ellipsis}
        </p>
        <p className="text-sm text-black/60">
          Analyzing your visualization to capture the look. This may take 30-60
          seconds.
        </p>
      </div>
    </div>
  );
}

function ReviewStyleStep() {
  const store = useProjectStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState(store.extractedStyleNotes ?? "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setNotes(store.extractedStyleNotes ?? "");
  }, [store.extractedStyleNotes]);

  const handleAccept = useCallback(async () => {
    if (!store.projectId) return;

    setIsSaving(true);
    try {
      // If user edited the notes, save them
      if (notes !== store.extractedStyleNotes) {
        const response = await fetch(`/api/projects/${store.projectId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ style_notes: notes }),
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to save style notes");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["projects"] });
      store.closeModal();
      router.push(`/projects/${store.projectId}?autoGenerate=true`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save style notes",
      );
      setIsSaving(false);
    }
  }, [store, notes, queryClient, router]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-black">
          {getStepLabel("review-style")}
        </h2>
        <p className="mt-1 text-sm text-black/60">
          These notes describe the visual style that will be applied to all
          scenes. You can edit them.
        </p>
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={8}
        className="w-full rounded-xl border border-black/20 bg-white px-3 py-2.5 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 resize-y"
      />

      <div className="flex justify-between">
        <Button
          variant="secondary"
          leftIcon={<ArrowLeftIcon />}
          onClick={() => store.setWizardStep("visualize")}
        >
          Back to visualizing
        </Button>
        <Button
          variant="primary"
          onClick={handleAccept}
          loading={isSaving}
          disabled={isSaving}
        >
          Accept & visualize all scenes
        </Button>
      </div>
    </div>
  );
}

export function NewProjectModal() {
  const store = useProjectStore();
  const threadEditorStore = useThreadEditorStore();
  const queryClient = useQueryClient();

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        // Cleanup on close
        if (
          store.projectId &&
          store.wizardStep !== "auto-generating" &&
          store.wizardStep !== "review-style"
        ) {
          // Fire-and-forget delete of unfinished project
          fetch(`/api/projects/${store.projectId}`, {
            method: "DELETE",
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["projects"] });
          });
        }
        threadEditorStore.reset();
        store.reset();
        store.closeModal();
      }
    },
    [store, threadEditorStore, queryClient],
  );

  return (
    <DialogPrimitive.Root
      open={store.isModalOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay asChild>
          <motion.div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content
          asChild
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => {
            // Let individual steps handle focus
            e.preventDefault();
          }}
        >
          <motion.div className="fixed left-1/2 top-1/2 z-50 w-full max-w-5xl max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
            <DialogPrimitive.Title className="sr-only">
              New Project
            </DialogPrimitive.Title>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <StepIndicator currentStep={store.wizardStep} />
              <DialogPrimitive.Close asChild>
                <Button
                  variant="icon"
                  size="sm"
                  colorScheme="light"
                  aria-label="Close"
                >
                  <Cross2Icon className="size-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>

            {/* Step content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={store.wizardStep}
                variants={STEP_SLIDE_VARIANTS}
                animate="center"
                exit="exit"
                transition={LAYOUT_TRANSITION}
              >
                {store.wizardStep === "name" && <NameAndUploadStep />}
                {store.wizardStep === "select" && <SelectStep />}
                {store.wizardStep === "visualize" && <VisualizeStep />}
                {store.wizardStep === "extracting-style" && (
                  <ExtractingStyleStep />
                )}
                {store.wizardStep === "review-style" && <ReviewStyleStep />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
