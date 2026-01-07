"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type Usable, use, useCallback, useEffect } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { GenerateButton } from "@/components/GenerateButton";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { TimeMachineViewer } from "@/components/TimeMachineViewer";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useIterateMutation } from "@/hooks/use-iterate-mutation";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { useRegenerateMutation } from "@/hooks/use-regenerate-mutation";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import {
  type Generation,
  type Thread,
  useThreadEditorStore,
} from "@/stores/thread-editor-store";
import { ThreadHeader } from "./ThreadHeader";

export default function ThreadDetailPage({
  params,
}: {
  params: Usable<{ thread_id: string }>;
}) {
  const { thread_id: threadId } = use(params);
  const threadEditorStore = useThreadEditorStore();
  const tentativeThreadId = threadEditorStore.tentativeThreadId;
  const isNewThread = threadId === tentativeThreadId;

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, supabase } = useSession();
  const handleSignIn = useSignInCallback();

  const uploadMutation = useUploadMutation();
  const generateMutation = useGenerateMutation();

  // Fetch credits
  const { data: creditsData } = usePlanQuery();

  // Mutations
  const iterateMutation = useIterateMutation();
  const regenerateMutation = useRegenerateMutation();
  const referenceUploadMutation = useReferenceUploadMutation();

  // Redirect to home if not logged in OR if new thread with no image
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    if (
      isNewThread &&
      !threadEditorStore.inputSrc &&
      !uploadMutation.isPending
    ) {
      router.push("/");
    }
  }, [
    user,
    isNewThread,
    threadEditorStore.inputSrc,
    uploadMutation.isPending,
    router,
  ]);

  // Fetch thread data (only for existing threads)
  const { data: fetchedThread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      if (!user || isNewThread) return null;

      const { data, error } = await supabase
        .from("threads")
        .select(
          `
          id,
          title,
          created_at,
          generations (
            id,
            input_url,
            output_url,
            user_params,
            created_at
          )
        `,
        )
        .eq("id", threadId)
        .single();

      if (error) {
        console.error("Failed to fetch thread:", error);
        throw error;
      }

      if (data.generations) {
        data.generations.sort(
          (a: Generation, b: Generation) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
      }

      return data as Thread;
    },
    enabled: !!user && !isNewThread,
  });

  // Update store when thread data is fetched
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
    const subsequentGenIndex = activeIndex; // Layer N shows params from generation N

    // If there's a subsequent generation, load its params
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
        threadEditorStore.setAspectRatio(params.aspect_ratio ?? null);
      }
    } else {
      // For the latest layer (no subsequent generation), use the previous generation's model
      const previousGenIndex = activeIndex - 1;
      if (previousGenIndex >= 0 && previousGenIndex < generations.length) {
        const previousGen = generations[previousGenIndex];
        if (previousGen?.user_params) {
          threadEditorStore.setModel(
            previousGen.user_params.model ??
              `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
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

  const handleBackToThreads = useCallback(() => {
    router.push("/threads");
  }, [router]);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      threadEditorStore.reset();
      router.push("/");
    },
    [threadEditorStore, router],
  );

  // Handle initial generation (new thread)
  const handleInitialGenerate = useCallback(async () => {
    threadEditorStore.setIsBusyForUser(true);
    try {
      let currentBlobUrl = threadEditorStore.blobUrl;

      if (uploadMutation.isPending) {
        const uploadedUrl = await uploadMutation.mutateAsync(
          uploadMutation.variables,
        );
        currentBlobUrl = uploadedUrl;
      }

      if (!currentBlobUrl) return;

      const result = await generateMutation.mutateAsync({
        blobUrl: currentBlobUrl,
        threadId, // Pass the tentative thread ID
        outdoorLight: threadEditorStore.outdoorLight,
        indoorLight: threadEditorStore.indoorLight,
        editDescription: threadEditorStore.editDescription,
        model: threadEditorStore.model,
        aspectRatio: threadEditorStore.aspectRatio,
      });

      if (result.threadId) {
        // Construct thread from data we already have (no fetch needed)
        const newThread: Thread = {
          id: result.threadId,
          title: null, // Will be generated async by the backend
          created_at: new Date().toISOString(),
          generations: [
            {
              id: result.generationId,
              input_url: currentBlobUrl,
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
            },
          ],
        };

        // Transition to thread editor store (this makes isNewThread irrelevant)
        threadEditorStore.setThread(newThread);
        threadEditorStore.navigateToLayer(1); // Navigate to the new generation

        // Clear tentative ID to signal we've transitioned to existing thread
        threadEditorStore.setTentativeThreadId(null);
      }
    } finally {
      threadEditorStore.setIsBusyForUser(false);
    }
  }, [threadEditorStore, uploadMutation, generateMutation, threadId]);

  // Handle iteration (existing thread)
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
        input_url: activeGen.output_url!,
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
      };
      threadEditorStore.addGeneration(newGeneration);
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
    } finally {
      threadEditorStore.setIsGenerating(false);
    }
  }, [threadEditorStore, iterateMutation, queryClient, threadId]);

  const handleVisualizeAgain = useCallback(async () => {
    const activeGen = threadEditorStore.getActiveGeneration();
    if (!activeGen?.id) return;

    threadEditorStore.setIsGenerating(true);
    try {
      await regenerateMutation.mutateAsync({
        generationId: activeGen.id,
        outdoorLight: threadEditorStore.outdoorLight,
        indoorLight: threadEditorStore.indoorLight,
        editDescription: threadEditorStore.editDescription,
        model: threadEditorStore.model,
        aspectRatio: threadEditorStore.aspectRatio,
      });

      // The generation output is already updated by the mutation's onSuccess handler
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
    } finally {
      threadEditorStore.setIsGenerating(false);
    }
  }, [threadEditorStore, regenerateMutation, queryClient, threadId]);

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

  if (!user) {
    return null;
  }

  // Use unified store for both new and existing threads
  const isGenerating = isNewThread
    ? threadEditorStore.isBusyForUser
    : threadEditorStore.isGenerating;
  const outdoorLight = threadEditorStore.outdoorLight;
  const indoorLight = threadEditorStore.indoorLight;
  const editDescription = threadEditorStore.editDescription;
  const model = threadEditorStore.model;
  const aspectRatio = threadEditorStore.aspectRatio;
  const referenceImages = threadEditorStore.referenceImages;

  const setOutdoorLight = threadEditorStore.setOutdoorLight;
  const setIndoorLight = threadEditorStore.setIndoorLight;
  const setEditDescription = threadEditorStore.setEditDescription;
  const setModel = threadEditorStore.setModel;
  const setAspectRatio = threadEditorStore.setAspectRatio;
  const removeReferenceImage = threadEditorStore.removeReferenceImage;

  const thread = threadEditorStore.thread;
  const generations = thread?.generations ?? [];
  const hasGenerations = generations.length > 0;
  const activeGeneration = threadEditorStore.getActiveGeneration();
  const canIterate = hasGenerations && !!activeGeneration?.output_url;

  // Determine the appropriate generate handler
  const handleGenerate = hasGenerations ? handleIterate : handleInitialGenerate;

  // Loading state for existing threads
  if (!isNewThread && isLoading) {
    return (
      <FunkyBackgroundFuzz>
        <motion.main
          transition={LAYOUT_TRANSITION}
          className="relative z-10 mx-auto flex grow w-full max-w-6xl flex-col gap-8 px-6 pb-24 pt-10 lg:px-10"
        >
          <Header user={user} onLogoClick={handleLogoClick} />
          <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
            <p className="text-black/50">Loading thread...</p>
          </div>
        </motion.main>
      </FunkyBackgroundFuzz>
    );
  }

  // Thread not found (only for existing threads that failed to load)
  if (!isNewThread && !thread) {
    return (
      <FunkyBackgroundFuzz>
        <motion.main
          transition={LAYOUT_TRANSITION}
          className="relative z-10 mx-auto flex grow w-full max-w-6xl flex-col gap-8 px-6 pb-24 pt-10 lg:px-10"
        >
          <Header user={user} onLogoClick={handleLogoClick} />
          <motion.section className="space-y-6">
            <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
              <p className="text-black/50">Thread not found</p>
            </div>
          </motion.section>
        </motion.main>
      </FunkyBackgroundFuzz>
    );
  }

  // Unified view for both new and existing threads
  return (
    <FunkyBackgroundFuzz>
      <motion.main
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex grow w-full max-w-6xl flex-col gap-8 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} onLogoClick={handleLogoClick} />

        <motion.section className="space-y-6">
          <div className="space-y-8">
            {thread && (
              <ThreadHeader
                title={thread.title}
                createdAt={thread.created_at}
                onBackClick={handleBackToThreads}
              />
            )}
            <div className="relative space-y-6">
              <TimeMachineViewer
                inputSrc={threadEditorStore.inputSrc}
                generations={generations}
                activeLayerIndex={threadEditorStore.activeLayerIndex}
                onLayerClick={threadEditorStore.navigateToLayer}
                isGenerating={isGenerating}
                onVisualizeAgain={handleVisualizeAgain}
                aspectRatio={aspectRatio}
                threadId={threadId}
                onNavigatePrevious={threadEditorStore.navigatePrevious}
                onNavigateNext={threadEditorStore.navigateNext}
              />

              <ControlPanel
                variant="editor"
                outdoorLight={outdoorLight}
                indoorLight={indoorLight}
                editDescription={editDescription}
                model={model}
                aspectRatio={aspectRatio}
                referenceImages={referenceImages}
                isLoading={isGenerating}
                onOutdoorLightChange={setOutdoorLight}
                onIndoorLightChange={setIndoorLight}
                onEditDescriptionChange={setEditDescription}
                onModelChange={setModel}
                onAspectRatioChange={setAspectRatio}
                onReferenceImageDrop={handleReferenceImageDrop}
                onReferenceImageRemove={removeReferenceImage}
                onGenerate={handleGenerate}
              />

              <GenerateButton
                user={user}
                model={model}
                credits={creditsData?.credits}
                isGenerating={isGenerating}
                isIteration={canIterate}
                onGenerate={handleGenerate}
                onSignIn={handleSignIn}
              />
            </div>
          </div>
        </motion.section>
      </motion.main>
    </FunkyBackgroundFuzz>
  );
}
