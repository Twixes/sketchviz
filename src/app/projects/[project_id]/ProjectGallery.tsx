"use client";

import { PlusIcon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { PageWrapper } from "@/components/PageWrapper";
import { SceneCard } from "@/components/SceneCard";
import type { SessionUser } from "@/components/SessionProvider";
import { StyleNotesPanel } from "@/components/StyleNotesPanel";
import { useProjectQuery } from "@/hooks/use-project-query";
import { Button } from "@/lib/components/ui/Button";
import {
  ACCEPTED_MIME_TYPES,
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

interface ProjectGalleryProps {
  projectId: string;
  user: SessionUser;
}

export function ProjectGallery({ projectId, user }: ProjectGalleryProps) {
  const { data: project, isLoading } = useProjectQuery(projectId);
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const shouldAutoGenerate = searchParams.get("autoGenerate") === "true";
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const accept = useMemo(() => ACCEPTED_MIME_TYPES.join(","), []);
  const [isUploadingScenes, setIsUploadingScenes] = useState(false);

  // Auto-generation state
  const autoGenStartedRef = useRef(false);
  const [autoGenState, setAutoGenState] = useState<{
    isRunning: boolean;
    completed: number;
    total: number;
    generatingThreadIds: Set<string>;
  }>({
    isRunning: false,
    completed: 0,
    total: 0,
    generatingThreadIds: new Set(),
  });

  // Auto-generate remaining scenes when redirected with ?autoGenerate=true
  useEffect(() => {
    if (!shouldAutoGenerate || !project || autoGenStartedRef.current) return;

    const threadsToGenerate = project.threads.filter(
      (t) => t.generations.length === 0,
    );
    if (threadsToGenerate.length === 0) {
      window.history.replaceState({}, "", `/projects/${projectId}`);
      return;
    }

    autoGenStartedRef.current = true;
    const threadIds = new Set(threadsToGenerate.map((t) => t.id));
    setAutoGenState({
      isRunning: true,
      completed: 0,
      total: threadsToGenerate.length,
      generatingThreadIds: threadIds,
    });

    const defaultModel = `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`;

    Promise.allSettled(
      threadsToGenerate.map(async (scene) => {
        try {
          await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input_url: scene.input_url,
              thread_id: scene.id,
              model: defaultModel,
            }),
          });
        } finally {
          setAutoGenState((prev) => {
            const newIds = new Set(prev.generatingThreadIds);
            newIds.delete(scene.id);
            return {
              ...prev,
              completed: prev.completed + 1,
              generatingThreadIds: newIds,
            };
          });
        }
      }),
    ).then(() => {
      setAutoGenState((prev) => ({ ...prev, isRunning: false }));
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      window.history.replaceState({}, "", `/projects/${projectId}`);
    });
  }, [shouldAutoGenerate, project, projectId, queryClient]);

  const titleMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update title");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
  });

  const handleAddScenes = useCallback(
    async (files: FileList) => {
      setIsUploadingScenes(true);
      try {
        const supabase = createClient();
        const uploadedUrls: string[] = [];

        for (const file of Array.from(files)) {
          if (!ACCEPTED_MIME_TYPES.includes(file.type)) continue;

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
            console.error(`Failed to upload ${file.name}:`, error);
            continue;
          }

          const {
            data: { publicUrl },
          } = supabase.storage.from("input-images").getPublicUrl(data.path);
          uploadedUrls.push(publicUrl);
        }

        if (uploadedUrls.length === 0) {
          toast.error("No files were uploaded successfully");
          return;
        }

        const response = await fetch(`/api/projects/${projectId}/scenes`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input_urls: uploadedUrls }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Failed to add scenes");
        }

        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        toast.success(`Added ${uploadedUrls.length} scene(s)`);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to add scenes",
        );
      } finally {
        setIsUploadingScenes(false);
      }
    },
    [projectId, queryClient],
  );

  if (isLoading) {
    return (
      <PageWrapper user={user} gap="small" documentTitle="Project">
        <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Loading project...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!project) {
    return (
      <PageWrapper user={user} gap="small" documentTitle="Project">
        <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Project not found</p>
        </div>
      </PageWrapper>
    );
  }

  const isInSetup = !project.style_notes;

  return (
    <PageWrapper
      user={user}
      gap="small"
      title={project.title || "Untitled Project"}
      onTitleSave={(newTitle) => titleMutation.mutate(newTitle)}
      documentTitle={project.title || "Project"}
    >
      <motion.section className="space-y-8">
        {/* Auto-generation progress */}
        {autoGenState.isRunning && (
          <div className="rounded-xl border border-black/10 bg-white/75 p-4 space-y-3">
            <p className="text-sm font-medium text-black">
              Generating {autoGenState.completed}/{autoGenState.total} scenes...
            </p>
            <div className="w-full bg-black/10 rounded-full h-2">
              <div
                className="bg-black h-2 rounded-full transition-all"
                style={{
                  width: `${autoGenState.total > 0 ? (autoGenState.completed / autoGenState.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Setup Banner */}
        {isInSetup && (
          <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-4">
            <p className="text-sm text-amber-800">
              <strong>Project in setup:</strong> Open a scene below, visualize
              it, then click "Proceed with this look" to set the project style.
              Other scenes will then auto-generate with the same look.
            </p>
          </div>
        )}

        {/* Style Notes */}
        <StyleNotesPanel
          projectId={projectId}
          styleNotes={project.style_notes}
        />

        {/* Scenes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-black">Scenes</h2>
            <Button
              variant="secondary"
              leftIcon={<PlusIcon />}
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingScenes}
            >
              {isUploadingScenes ? "Adding..." : "Add scenes"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleAddScenes(e.target.files);
                  e.target.value = "";
                }
              }}
            />
          </div>

          {project.threads.length > 0 ? (
            <div className="grid gap-6 grid-cols-2">
              {project.threads.map((thread) => (
                <SceneCard
                  key={thread.id}
                  thread={thread}
                  projectId={projectId}
                  isGenerating={autoGenState.generatingThreadIds.has(thread.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-black/20 bg-white/50 p-8 text-center">
              <p className="text-sm text-black/50">No scenes yet</p>
            </div>
          )}
        </div>
      </motion.section>
    </PageWrapper>
  );
}
