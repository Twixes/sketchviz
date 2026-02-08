"use client";

import {
  CheckCircledIcon,
  PlusIcon,
  TrashIcon,
  UploadIcon,
} from "@radix-ui/react-icons";
import { useMutation } from "@tanstack/react-query";
import clsx from "clsx";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PageWrapper } from "@/components/PageWrapper";
import type { SessionUser } from "@/components/SessionProvider";
import { Button } from "@/lib/components/ui/Button";
import { ACCEPTED_MIME_TYPES } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useProjectStore } from "@/stores/project-store";

export function ProjectCreationWizard({ user }: { user: SessionUser }) {
  const router = useRouter();
  const store = useProjectStore();
  const [title, setTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);

  // Reset store on mount
  useEffect(() => {
    store.reset();
  }, [store.reset]);

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
      store.addSceneFiles(validFiles);

      // Upload each file to Supabase Storage
      const supabase = createClient();
      for (
        let i = store.sceneFiles.length;
        i < store.sceneFiles.length + validFiles.length;
        i++
      ) {
        const file = validFiles[i - store.sceneFiles.length];
        uploadSceneFile(supabase, file, i);
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

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      // Wait for all uploads to complete
      const sceneFiles = store.sceneFiles;
      const allUploaded = sceneFiles.every((f) => f.blobUrl !== null);
      if (!allUploaded) {
        throw new Error("Some files are still uploading");
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Untitled Project",
          scene_input_urls: sceneFiles.map((f) => f.blobUrl),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      // Update store with thread IDs
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

  const handleCreateAndSelectScene = useCallback(async () => {
    if (store.selectedStartingSceneIndex === null) {
      toast.error("Please select a starting scene");
      return;
    }

    setIsCreating(true);
    try {
      const project = await createProjectMutation.mutateAsync();
      const startingThread =
        project.threads[store.selectedStartingSceneIndex ?? 0];

      if (startingThread) {
        router.push(
          `/projects/${project.id}/scenes/${startingThread.id}?setup=true`,
        );
      }
    } catch {
      setIsCreating(false);
    }
  }, [store, createProjectMutation, router]);

  const allUploaded = store.sceneFiles.every((f) => f.blobUrl !== null);
  const hasScenes = store.sceneFiles.length > 0;

  return (
    <PageWrapper
      user={user}
      gap="small"
      title="New Project"
      description="Upload scenes and create a consistent multi-scene visualization"
      documentTitle="New Project"
    >
      <motion.section className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <label
            htmlFor="project-title"
            className="text-sm font-medium text-black"
          >
            Project name
          </label>
          <input
            id="project-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Downtown Apartment"
            className="w-full rounded-xl border border-black/20 bg-white px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        {/* Scene Upload Area */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-black">
            Upload scenes
            {store.sceneFiles.length > 0 && (
              <span className="ml-2 text-sm font-normal text-black/50">
                ({store.sceneFiles.length} scene
                {store.sceneFiles.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>

          {/* biome-ignore lint/a11y/noStaticElementInteractions: dropzone */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: dropzone */}
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
            <p className="text-xs text-black/40 mt-1">
              Each image = one room/angle to visualize
            </p>
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
          </div>

          {/* Scene Grid */}
          {store.sceneFiles.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm text-black/60">
                Select which scene to visualize first:
              </p>
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
                {/* Add more button */}
                {/* biome-ignore lint/a11y/useKeyWithClickEvents: thumbnail button */}
                {/* biome-ignore lint/a11y/noStaticElementInteractions: thumbnail button */}
                <div
                  className="aspect-video rounded-lg border-2 border-dashed border-black/20 flex items-center justify-center cursor-pointer hover:border-black/40 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <PlusIcon className="size-6 text-black/40" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={
            !hasScenes ||
            !allUploaded ||
            store.selectedStartingSceneIndex === null ||
            isCreating
          }
          onClick={handleCreateAndSelectScene}
        >
          {isCreating
            ? "Creating project..."
            : !hasScenes
              ? "Upload at least one scene"
              : !allUploaded
                ? "Uploading..."
                : store.selectedStartingSceneIndex === null
                  ? "Select a starting scene"
                  : "Start visualizing"}
        </Button>
      </motion.section>
    </PageWrapper>
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
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="relative group">
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: thumbnail button */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: thumbnail button */}
      <div
        className={clsx(
          "aspect-video rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
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
