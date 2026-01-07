"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { type Usable, use, useCallback, useEffect } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { GenerateButton } from "@/components/GenerateButton";
import { Header } from "@/components/Header";
import { LayerNavigationControls } from "@/components/LayerNavigationControls";
import { useSession } from "@/components/SessionProvider";
import { TimeMachineViewer } from "@/components/TimeMachineViewer";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useIterateMutation } from "@/hooks/use-iterate-mutation";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { LAYOUT_TRANSITION } from "@/lib/animation-constants";
import {
  type Generation,
  type Thread,
  useThreadEditorStore,
} from "@/stores/thread-editor-store";
import { useUploadStore } from "@/stores/upload-store";
import { ThreadHeader } from "./ThreadHeader";

export default function ThreadDetailPage({
  params,
}: {
  params: Usable<{ thread_id: string }>;
}) {
  const { thread_id: threadId } = use(params);
  const tentativeThreadId = useUploadStore((state) => state.tentativeThreadId);
  const isNewThread = threadId === tentativeThreadId;

  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, supabase } = useSession();
  const handleSignIn = useSignInCallback();

  // Upload store (for new threads)
  const uploadStore = useUploadStore();
  const uploadMutation = useUploadMutation();
  const generateMutation = useGenerateMutation();

  // Thread editor store (for existing threads)
  const threadEditorStore = useThreadEditorStore();

  // Fetch credits
  const { data: creditsData } = usePlanQuery();

  // Mutations
  const iterateMutation = useIterateMutation();
  const referenceUploadMutation = useReferenceUploadMutation();

  // Redirect to home if not logged in OR if new thread with no image
  useEffect(() => {
    if (!user) {
      router.push("/");
      return;
    }
    if (isNewThread && !uploadStore.inputSrc && !uploadMutation.isPending) {
      router.push("/");
    }
  }, [
    user,
    isNewThread,
    uploadStore.inputSrc,
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

  const handleBackToThreads = useCallback(() => {
    router.push("/threads");
  }, [router]);

  const handleLogoClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      uploadStore.reset();
      threadEditorStore.reset();
      router.push("/");
    },
    [uploadStore, threadEditorStore, router],
  );

  // Handle initial generation (new thread)
  const handleInitialGenerate = useCallback(async () => {
    uploadStore.setIsBusyForUser(true);
    try {
      let currentBlobUrl = uploadStore.blobUrl;

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
        outdoorLight: uploadStore.outdoorLight,
        indoorLight: uploadStore.indoorLight,
        editDescription: uploadStore.editDescription,
        model: uploadStore.model,
        aspectRatio: uploadStore.aspectRatio,
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
                outdoor_light: uploadStore.outdoorLight,
                indoor_light: uploadStore.indoorLight,
                edit_description: uploadStore.editDescription,
                model: uploadStore.model,
                aspect_ratio: uploadStore.aspectRatio,
              },
              created_at: new Date().toISOString(),
            },
          ],
        };

        // Transition to thread editor store (this makes isNewThread irrelevant)
        threadEditorStore.setThread(newThread);
        threadEditorStore.navigateToLayer(1); // Navigate to the new generation

        // Clear tentative ID to switch from uploadStore to threadEditorStore
        uploadStore.setTentativeThreadId(null);
      }
    } finally {
      uploadStore.setIsBusyForUser(false);
    }
  }, [
    uploadStore,
    uploadMutation,
    generateMutation,
    threadId,
    threadEditorStore,
  ]);

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
      const result = await iterateMutation.mutateAsync({
        generationId: activeGen.id,
        outdoorLight: threadEditorStore.outdoorLight,
        indoorLight: threadEditorStore.indoorLight,
        editDescription: threadEditorStore.editDescription,
        model: threadEditorStore.model,
        aspectRatio: threadEditorStore.aspectRatio,
        useBasePrompt: true,
      });

      const newGeneration: Generation = {
        id: result.generationId,
        input_url: activeGen.output_url!,
        output_url: result.outputImage,
        user_params: {
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

  const handleReferenceImageDrop = async (file: File) => {
    const store = isNewThread ? uploadStore : threadEditorStore;
    if (store.referenceImages.length >= 3) return;

    const localSrc = URL.createObjectURL(file);
    const imageIndex = store.referenceImages.length;
    store.addReferenceImage(localSrc, null);

    try {
      const blobUrl = await referenceUploadMutation.mutateAsync({ file });
      store.updateReferenceImageBlobUrl(imageIndex, blobUrl);
    } catch (error) {
      console.error("Failed to upload reference image:", error);
      store.removeReferenceImage(imageIndex);
    }
  };

  if (!user) {
    return null;
  }

  // Determine which state to use
  const isGenerating = isNewThread
    ? uploadStore.isBusyForUser
    : threadEditorStore.isGenerating;
  const outdoorLight = isNewThread
    ? uploadStore.outdoorLight
    : threadEditorStore.outdoorLight;
  const indoorLight = isNewThread
    ? uploadStore.indoorLight
    : threadEditorStore.indoorLight;
  const editDescription = isNewThread
    ? uploadStore.editDescription
    : threadEditorStore.editDescription;
  const model = isNewThread ? uploadStore.model : threadEditorStore.model;
  const aspectRatio = isNewThread
    ? uploadStore.aspectRatio
    : threadEditorStore.aspectRatio;
  const referenceImages = isNewThread
    ? uploadStore.referenceImages
    : threadEditorStore.referenceImages;

  const setOutdoorLight = isNewThread
    ? uploadStore.setOutdoorLight
    : threadEditorStore.setOutdoorLight;
  const setIndoorLight = isNewThread
    ? uploadStore.setIndoorLight
    : threadEditorStore.setIndoorLight;
  const setEditDescription = isNewThread
    ? uploadStore.setEditDescription
    : threadEditorStore.setEditDescription;
  const setModel = isNewThread
    ? uploadStore.setModel
    : threadEditorStore.setModel;
  const setAspectRatio = isNewThread
    ? uploadStore.setAspectRatio
    : threadEditorStore.setAspectRatio;
  const removeReferenceImage = isNewThread
    ? uploadStore.removeReferenceImage
    : threadEditorStore.removeReferenceImage;

  const thread = threadEditorStore.thread;
  const generations = thread?.generations ?? [];
  const hasGenerations = generations.length > 0;
  const activeGeneration = threadEditorStore.getActiveGeneration();
  const canIterate = hasGenerations && !!activeGeneration?.output_url;
  const layerCount = threadEditorStore.getLayerCount();

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
          <motion.section className="space-y-6">
            <div className="space-y-6">
              <div className="h-[72px]" />
              <div className="rounded-2xl border border-black/10 bg-white/75 p-8 text-center">
                <p className="text-black/50">Loading thread...</p>
              </div>
            </div>
          </motion.section>
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
          <div className="space-y-6">
            {/* ThreadHeader or placeholder */}
            {thread ? (
              <ThreadHeader
                title={thread.title}
                createdAt={thread.created_at}
                onBackClick={handleBackToThreads}
              />
            ) : (
              <div className="h-[72px]" />
            )}

            <div className="relative space-y-6">
              {/* TimeMachineViewer handles both new (inputSrc) and existing (generations) */}
              <TimeMachineViewer
                inputSrc={uploadStore.inputSrc}
                generations={generations}
                activeLayerIndex={threadEditorStore.activeLayerIndex}
                onLayerClick={threadEditorStore.navigateToLayer}
                isGenerating={isGenerating}
                onVisualizeAgain={handleVisualizeAgain}
                aspectRatio={aspectRatio}
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

              {/* Layer navigation - only show when there are generations */}
              {hasGenerations && (
                <div className="absolute right-0 top-0 -mr-16">
                  <LayerNavigationControls
                    currentIndex={threadEditorStore.activeLayerIndex}
                    totalLayers={layerCount}
                    onPrevious={threadEditorStore.navigatePrevious}
                    onNext={threadEditorStore.navigateNext}
                    disabled={isGenerating}
                  />
                </div>
              )}
            </div>
          </div>
        </motion.section>
      </motion.main>
    </FunkyBackgroundFuzz>
  );
}
