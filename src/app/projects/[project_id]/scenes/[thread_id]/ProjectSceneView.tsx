"use client";

import { ArrowLeftIcon, CheckCircledIcon } from "@radix-ui/react-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ControlPanel } from "@/components/ControlPanel";
import { CreditBadge, GenerateButton } from "@/components/GenerateButton";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { TimeMachineViewer } from "@/components/TimeMachineViewer";
import { useAcceptStyleMutation } from "@/hooks/use-accept-style-mutation";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useIterateMutation } from "@/hooks/use-iterate-mutation";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useProjectQuery } from "@/hooks/use-project-query";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { useRegenerateMutation } from "@/hooks/use-regenerate-mutation";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { Button } from "@/lib/components/ui/Button";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import type { Model } from "@/lib/schemas";
import {
  type Generation,
  type Thread,
  useThreadEditorStore,
} from "@/stores/thread-editor-store";

interface ProjectSceneViewProps {
  projectId: string;
  threadId: string;
  isSetupMode: boolean;
}

export function ProjectSceneView({
  projectId,
  threadId,
  isSetupMode,
}: ProjectSceneViewProps) {
  const threadEditorStore = useThreadEditorStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, supabase } = useSession();
  const handleSignIn = useSignInCallback();

  const { data: creditsData } = usePlanQuery();
  const { data: project } = useProjectQuery(projectId);

  const generateMutation = useGenerateMutation();
  const iterateMutation = useIterateMutation();
  const regenerateMutation = useRegenerateMutation();
  const referenceUploadMutation = useReferenceUploadMutation();
  const acceptStyleMutation = useAcceptStyleMutation();

  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [autoGenProgress, setAutoGenProgress] = useState({
    completed: 0,
    total: 0,
  });

  // Fetch thread data
  const { data: fetchedThread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threads")
        .select(
          `
          id,
          user_id,
          title,
          input_url,
          created_at,
          generations (
            id,
            output_url,
            user_params,
            created_at,
            width,
            height
          )
        `,
        )
        .eq("id", threadId)
        .single();

      if (error) throw error;

      if (data.generations) {
        data.generations.sort(
          (a: Generation, b: Generation) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }

      return data as Thread;
    },
  });

  useEffect(() => {
    if (fetchedThread) {
      threadEditorStore.setThread(fetchedThread);
    }
  }, [fetchedThread, threadEditorStore.setThread]);

  // Update control panel params when layer changes
  useEffect(() => {
    const thread = threadEditorStore.thread;
    const generations = thread?.generations ?? [];
    if (generations.length === 0) return;

    const activeIndex = threadEditorStore.activeLayerIndex;
    const subsequentGenIndex = activeIndex;

    if (subsequentGenIndex >= 0 && subsequentGenIndex < generations.length) {
      const subsequentGen = generations[subsequentGenIndex];
      if (subsequentGen?.user_params) {
        const params = subsequentGen.user_params;
        threadEditorStore.setOutdoorLight(params.outdoor_light ?? null);
        threadEditorStore.setIndoorLight(params.indoor_light ?? null);
        threadEditorStore.setEditDescription(params.edit_description || "");
        threadEditorStore.setModel(
          params.model ??
            `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
        );
        threadEditorStore.setAspectRatio(null);
      }
    } else {
      const previousGenIndex = activeIndex - 1;
      if (previousGenIndex >= 0 && previousGenIndex < generations.length) {
        const previousGen = generations[previousGenIndex];
        if (previousGen?.user_params) {
          threadEditorStore.setModel(
            previousGen.user_params.model &&
              previousGen.user_params.model !==
                "google/gemini-2.5-flash-image-preview"
              ? previousGen.user_params.model
              : `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
          );
        }
      }
    }
  }, [
    threadEditorStore.activeLayerIndex,
    threadEditorStore.thread,
    threadEditorStore.setOutdoorLight,
    threadEditorStore.setIndoorLight,
    threadEditorStore.setEditDescription,
    threadEditorStore.setModel,
    threadEditorStore.setAspectRatio,
  ]);

  // Handle initial generation
  const handleInitialGenerate = useCallback(async () => {
    const thread = threadEditorStore.thread;
    if (!thread?.input_url || !user) return;

    threadEditorStore.setIsBusyForUser(true);
    try {
      const result = await generateMutation.mutateAsync({
        blobUrl: thread.input_url,
        threadId,
        outdoorLight: threadEditorStore.outdoorLight,
        indoorLight: threadEditorStore.indoorLight,
        editDescription: threadEditorStore.editDescription,
        model: threadEditorStore.model,
        aspectRatio: threadEditorStore.aspectRatio,
      });

      if (result.threadId) {
        const newThread: Thread = {
          id: result.threadId,
          user_id: user.id,
          title: thread.title,
          input_url: thread.input_url,
          created_at: thread.created_at,
          generations: [
            {
              id: result.generationId,
              output_url: result.outputImage,
              user_params: {
                thread_id: result.threadId,
                outdoor_light: threadEditorStore.outdoorLight,
                indoor_light: threadEditorStore.indoorLight,
                edit_description: threadEditorStore.editDescription,
                model: threadEditorStore.model,
                aspect_ratio: threadEditorStore.aspectRatio,
              },
              created_at: new Date().toISOString(),
              width: result.width,
              height: result.height,
            },
          ],
        };
        threadEditorStore.setThread(newThread);
        threadEditorStore.navigateToLayer(1);
      }
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally {
      threadEditorStore.setIsBusyForUser(false);
    }
  }, [threadEditorStore, generateMutation, threadId, user]);

  // Handle iteration
  const handleIterate = useCallback(async () => {
    const activeGen = threadEditorStore.getActiveGeneration();
    if (!activeGen?.id) return;

    threadEditorStore.setIsGenerating(true);
    try {
      const result = await iterateMutation.mutateAsync({
        generationId: activeGen.id,
        outdoorLight: threadEditorStore.outdoorLight,
        indoorLight: threadEditorStore.indoorLight,
        editDescription: threadEditorStore.editDescription,
        model: threadEditorStore.model,
        aspectRatio: threadEditorStore.aspectRatio,
        useBasePrompt: false,
      });

      const newGeneration: Generation = {
        id: result.generationId,
        output_url: result.outputImage,
        user_params: {
          thread_id: threadId,
          outdoor_light: threadEditorStore.outdoorLight,
          indoor_light: threadEditorStore.indoorLight,
          edit_description: threadEditorStore.editDescription,
          model: threadEditorStore.model,
          aspect_ratio: threadEditorStore.aspectRatio,
        },
        created_at: new Date().toISOString(),
        width: result.width,
        height: result.height,
      };
      threadEditorStore.addGeneration(newGeneration);
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
    } finally {
      threadEditorStore.setIsGenerating(false);
    }
  }, [threadEditorStore, iterateMutation, queryClient, threadId]);

  // Handle re-visualize
  const handleVisualizeAgain = useCallback(async () => {
    const thread = threadEditorStore.thread;
    const firstGen = thread?.generations[0];
    if (!firstGen?.id) return;

    await regenerateMutation.mutateAsync({
      generationId: firstGen.id,
      outdoorLight: threadEditorStore.outdoorLight,
      indoorLight: threadEditorStore.indoorLight,
      editDescription: threadEditorStore.editDescription,
      model: threadEditorStore.model,
      aspectRatio: threadEditorStore.aspectRatio,
    });

    queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
  }, [threadEditorStore, regenerateMutation, queryClient, threadId]);

  // Handle "Proceed with this look"
  const handleProceedWithLook = useCallback(async () => {
    const activeGen = threadEditorStore.getActiveGeneration();
    if (!activeGen?.id) {
      toast.error("No generation to use as style source");
      return;
    }

    try {
      const result = await acceptStyleMutation.mutateAsync({
        projectId,
        generationId: activeGen.id,
      });

      toast.success("Style extracted! Generating remaining scenes...");

      // Auto-generate remaining scenes
      if (project) {
        const otherThreads = project.threads.filter(
          (t) => t.id !== threadId && t.generations.length === 0,
        );

        if (otherThreads.length === 0) {
          router.push(`/projects/${projectId}`);
          return;
        }

        setIsAutoGenerating(true);
        setAutoGenProgress({ completed: 0, total: otherThreads.length });

        const defaultModel = `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`;

        for (let i = 0; i < otherThreads.length; i++) {
          const scene = otherThreads[i];
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
            setAutoGenProgress((prev) => ({
              ...prev,
              completed: prev.completed + 1,
            }));
          } catch (error) {
            console.error(`Failed to generate scene ${scene.id}:`, error);
            setAutoGenProgress((prev) => ({
              ...prev,
              completed: prev.completed + 1,
            }));
          }
        }

        setIsAutoGenerating(false);
        queryClient.invalidateQueries({ queryKey: ["project", projectId] });
        router.push(`/projects/${projectId}`);
      }
    } catch (error) {
      console.error("Failed to accept style:", error);
    }
  }, [
    threadEditorStore,
    acceptStyleMutation,
    projectId,
    project,
    threadId,
    queryClient,
    router,
  ]);

  const handleReferenceImageDrop = async (file: File) => {
    if (threadEditorStore.referenceImages.length >= 3) return;
    const localSrc = URL.createObjectURL(file);
    const imageIndex = threadEditorStore.referenceImages.length;
    threadEditorStore.addReferenceImage(localSrc, null);

    try {
      const blobUrl = await referenceUploadMutation.mutateAsync({ file });
      threadEditorStore.updateReferenceImageBlobUrl(imageIndex, blobUrl);
    } catch (error) {
      console.error("Failed to upload reference image:", error);
      threadEditorStore.removeReferenceImage(imageIndex);
    }
  };

  const thread = threadEditorStore.thread;
  const generations = thread?.generations ?? [];
  const hasGenerations = generations.length > 0;
  const activeGeneration = threadEditorStore.getActiveGeneration();
  const canIterate = hasGenerations && !!activeGeneration?.output_url;
  const isGenerating =
    threadEditorStore.isBusyForUser || threadEditorStore.isGenerating;
  const activeLayerIndex = threadEditorStore.activeLayerIndex;

  const handleGenerate =
    activeLayerIndex === 0 && hasGenerations
      ? handleVisualizeAgain
      : activeLayerIndex > 0
        ? handleIterate
        : handleInitialGenerate;

  // Show "Proceed with this look" when in setup mode, project has no style, and we have a generation
  const showProceedButton =
    isSetupMode && project && !project.style_notes && canIterate;

  if (isLoading) {
    return (
      <PageWrapper user={user} gap="small">
        <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Loading scene...</p>
        </div>
      </PageWrapper>
    );
  }

  if (!thread) {
    return (
      <PageWrapper user={user} gap="small">
        <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Scene not found</p>
        </div>
      </PageWrapper>
    );
  }

  // Auto-generation progress overlay
  if (isAutoGenerating) {
    return (
      <PageWrapper user={user} gap="small">
        <motion.section className="space-y-6">
          <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center space-y-4">
            <div className="loading-ring mx-auto" aria-hidden />
            <p className="text-lg font-semibold text-black">
              Generating scene {autoGenProgress.completed + 1} of{" "}
              {autoGenProgress.total}...
            </p>
            <p className="text-sm text-black/50">
              Applying your project style to each scene
            </p>
            <div className="w-full bg-black/10 rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-black h-2 rounded-full transition-all"
                style={{
                  width: `${autoGenProgress.total > 0 ? (autoGenProgress.completed / autoGenProgress.total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </motion.section>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper user={user} gap="small" title={thread.title}>
      <motion.section className="space-y-6">
        {/* Breadcrumb */}
        <Link
          href={`/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-sm text-black/60 hover:text-black transition-colors"
        >
          <ArrowLeftIcon className="size-4" />
          Back to project
        </Link>

        {/* Style indicator */}
        {project?.style_notes && (
          <div className="rounded-lg border border-black/10 bg-white/50 px-3 py-2">
            <p className="text-xs text-black/50">
              <CheckCircledIcon className="inline size-3 mr-1" />
              Project style applied to generations
            </p>
          </div>
        )}

        <div className="relative space-y-6">
          <TimeMachineViewer
            threadId={threadId}
            inputImageUrl={thread.input_url}
            generations={generations}
            activeLayerIndex={threadEditorStore.activeLayerIndex}
            onLayerClick={threadEditorStore.navigateToLayer}
            isGenerating={isGenerating}
            aspectRatio={threadEditorStore.aspectRatio}
            threadTitle={thread.title}
            onNavigatePrevious={threadEditorStore.navigatePrevious}
            onNavigateNext={threadEditorStore.navigateNext}
            isOwner={true}
          />

          <ControlPanel
            variant="editor"
            outdoorLight={threadEditorStore.outdoorLight}
            indoorLight={threadEditorStore.indoorLight}
            editDescription={threadEditorStore.editDescription}
            model={threadEditorStore.model}
            aspectRatio={threadEditorStore.aspectRatio}
            referenceImages={threadEditorStore.referenceImages}
            isLoading={isGenerating}
            onOutdoorLightChange={threadEditorStore.setOutdoorLight}
            onIndoorLightChange={threadEditorStore.setIndoorLight}
            onEditDescriptionChange={threadEditorStore.setEditDescription}
            onModelChange={threadEditorStore.setModel}
            onAspectRatioChange={threadEditorStore.setAspectRatio}
            onReferenceImageDrop={handleReferenceImageDrop}
            onReferenceImageRemove={threadEditorStore.removeReferenceImage}
            onGenerate={handleGenerate}
          />

          {/* Generate and Proceed buttons */}
          <div className="space-y-3">
            <GenerateButton
              user={user}
              model={threadEditorStore.model}
              credits={creditsData?.credits}
              planType={creditsData?.planType}
              isGenerating={isGenerating}
              isIteration={canIterate}
              hasGenerations={hasGenerations}
              referenceImageCount={threadEditorStore.referenceImages.length}
              onGenerate={handleGenerate}
              onSignIn={handleSignIn}
            />

            {showProceedButton && (
              <Button
                variant="primary"
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleProceedWithLook}
                disabled={acceptStyleMutation.isPending || isGenerating}
                leftIcon={<CheckCircledIcon />}
              >
                {acceptStyleMutation.isPending
                  ? "Extracting style..."
                  : "Proceed with this look"}
                {project && (
                  <CreditBadge
                    creditCost={
                      determineCreditCostOfImageGeneration({
                        model: threadEditorStore.model,
                      }) *
                      project.threads.filter(
                        (t) => t.id !== threadId && t.generations.length === 0,
                      ).length
                    }
                    className="absolute top-3 bottom-3 right-3 border-white/60"
                  />
                )}
              </Button>
            )}
          </div>
        </div>
      </motion.section>
    </PageWrapper>
  );
}
