"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { ControlPanel } from "@/components/ControlPanel";
import { GenerateButton } from "@/components/GenerateButton";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { TimeMachineViewer } from "@/components/TimeMachineViewer";
import { useGenerateMutation } from "@/hooks/use-generate-mutation";
import { useIterateMutation } from "@/hooks/use-iterate-mutation";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { useRegenerateMutation } from "@/hooks/use-regenerate-mutation";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
  PENDING_GENERATION_POLL_MS,
} from "@/lib/constants";
import { isLatestGenerationActivelyPending } from "@/lib/pending-generation";
import {
  type Generation,
  type Thread,
  useThreadEditorStore,
} from "@/stores/thread-editor-store";

export function ThreadView({
  threadId,
  embedded = false,
}: {
  threadId: string;
  embedded?: boolean;
}) {
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
  const titleUpdateMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update title");
      }
      return response.json();
    },
    onMutate: (newTitle) => {
      const thread = threadEditorStore.thread;
      const previousTitle = thread?.title;
      if (thread) {
        threadEditorStore.setThread({ ...thread, title: newTitle });
      }
      return { previousTitle };
    },
    onError: (_error, _newTitle, context) => {
      const thread = threadEditorStore.thread;
      if (thread && context?.previousTitle) {
        threadEditorStore.setThread({
          ...thread,
          title: context.previousTitle,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["recent-threads"] });
    },
  });

  // Redirect to home if new thread with no image (nothing to show)
  useEffect(() => {
    if (embedded) return;
    if (
      isNewThread &&
      !threadEditorStore.inputSrc &&
      !uploadMutation.isPending
    ) {
      router.push("/");
    }
  }, [
    embedded,
    isNewThread,
    threadEditorStore.inputSrc,
    uploadMutation.isPending,
    router,
  ]);

  // Fetch thread data (only for existing threads - works for anyone due to public RLS)
  const { data: fetchedThread, isLoading } = useQuery({
    queryKey: ["thread", threadId],
    queryFn: async () => {
      if (isNewThread) return null;

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
    enabled: !isNewThread,
    // Poll while the latest generation is still actively pending (no output, within stale window)
    refetchInterval: (query) => {
      const thread = query.state.data;
      if (!thread?.generations?.length) return false;
      const latest = thread.generations[thread.generations.length - 1];
      return isLatestGenerationActivelyPending(latest)
        ? PENDING_GENERATION_POLL_MS
        : false;
    },
  });

  // Track whether a generation is pending from the server (e.g. after page refresh)
  const latestFetchedGeneration = fetchedThread?.generations?.length
    ? fetchedThread.generations[fetchedThread.generations.length - 1]
    : undefined;
  const hasPendingGeneration = isLatestGenerationActivelyPending(
    latestFetchedGeneration,
  );

  // Derive ownership and read-only state
  const isOwner = user?.id === fetchedThread?.user_id;
  const isReadOnly = !isNewThread && !isOwner;

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

    // If there's a subsequent generation, load its params (except aspectRatio)
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
        // Don't load historical aspectRatio - it would override the viewer's
        // actual dimensions. Only user selection should set aspectRatio.
        threadEditorStore.setAspectRatio(null);
      }
    } else {
      // For the latest layer (no subsequent generation), use the previous generation's model
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

  // Handle initial generation (new thread or existing thread without generations)
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

      // Fall back to thread's input_url for existing threads (e.g. embedded in project modal)
      if (!currentBlobUrl) {
        currentBlobUrl = threadEditorStore.thread?.input_url ?? null;
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

      if (result.threadId && user) {
        // Construct thread from data we already have (no fetch needed)
        const newThread: Thread = {
          id: result.threadId,
          user_id: user.id,
          title: null, // Will be generated async by the backend
          input_url: currentBlobUrl,
          created_at: new Date().toISOString(),
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

        // Transition to thread editor store (this makes isNewThread irrelevant)
        threadEditorStore.setThread(newThread);
        threadEditorStore.navigateToLayer(1); // Navigate to the new generation

        // Clear tentative ID to signal we've transitioned to existing thread
        threadEditorStore.setTentativeThreadId(null);
      }
    } catch (error) {
      console.error("Failed to generate initial image:", error);
    } finally {
      threadEditorStore.setIsBusyForUser(false);
    }
  }, [threadEditorStore, uploadMutation, generateMutation, threadId, user]);

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

  // Re-visualize the initial layer (layer 0) with current parameters
  const handleVisualizeAgain = useCallback(async () => {
    const thread = threadEditorStore.thread;
    const generations = thread?.generations ?? [];
    const firstGen = generations[0];

    if (!firstGen?.id) return;

    // The mutation handles setIsGenerating automatically
    await regenerateMutation.mutateAsync({
      generationId: firstGen.id,
      outdoorLight: threadEditorStore.outdoorLight,
      indoorLight: threadEditorStore.indoorLight,
      editDescription: threadEditorStore.editDescription,
      model: threadEditorStore.model,
      aspectRatio: threadEditorStore.aspectRatio,
    });

    // The generation output is already updated by the mutation's onSuccess handler
    queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
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

  // Use unified store for both new and existing threads
  const isGenerating = isNewThread
    ? threadEditorStore.isBusyForUser
    : threadEditorStore.isGenerating || hasPendingGeneration;
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
  const activeLayerIndex = threadEditorStore.activeLayerIndex;
  const handleGenerate =
    activeLayerIndex === 0 && hasGenerations
      ? handleVisualizeAgain
      : activeLayerIndex > 0
        ? handleIterate
        : handleInitialGenerate;

  // Loading state for existing threads
  if (!isNewThread && isLoading) {
    const loadingContent = (
      <div className="rounded-xl border border-black/10 bg-white/75 p-8 text-center">
        <p className="text-black/50">Loading thread...</p>
      </div>
    );
    if (embedded) return loadingContent;
    return (
      <PageWrapper user={user} gap="small">
        {loadingContent}
      </PageWrapper>
    );
  }

  // Thread not found (only for existing threads that failed to load)
  if (!isNewThread && !thread) {
    const notFoundContent = (
      <motion.section className="space-y-6">
        <div className="rounded-xl border border-black/10 bg-white/75 p-8 text-center">
          <p className="text-black/50">Thread not found</p>
        </div>
      </motion.section>
    );
    if (embedded) return notFoundContent;
    return (
      <PageWrapper user={user} gap="small">
        {notFoundContent}
      </PageWrapper>
    );
  }

  // Format date for description
  const formattedDate = thread
    ? new Date(thread.created_at).toLocaleString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
      })
    : undefined;

  const mainContent = (
    <motion.section className="space-y-6">
      <div className="relative space-y-6">
        <TimeMachineViewer
          threadId={threadId}
          inputImageUrl={thread?.input_url ?? threadEditorStore.inputSrc}
          generations={generations}
          activeLayerIndex={threadEditorStore.activeLayerIndex}
          onLayerClick={threadEditorStore.navigateToLayer}
          isGenerating={isGenerating}
          aspectRatio={aspectRatio}
          threadTitle={thread?.title}
          onNavigatePrevious={threadEditorStore.navigatePrevious}
          onNavigateNext={threadEditorStore.navigateNext}
          isOwner={embedded || isOwner}
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
          disabled={!embedded && isReadOnly}
          onOutdoorLightChange={setOutdoorLight}
          onIndoorLightChange={setIndoorLight}
          onEditDescriptionChange={setEditDescription}
          onModelChange={setModel}
          onAspectRatioChange={setAspectRatio}
          onReferenceImageDrop={handleReferenceImageDrop}
          onReferenceImageRemove={removeReferenceImage}
          onGenerate={handleGenerate}
          proOnlyModel={embedded}
        />

        {!embedded && isReadOnly ? (
          <div className="rounded-xl border border-black/10 bg-white/75 p-4 text-center">
            <p className="text-sm text-black/60 cursor-default">
              You're viewing a shared thread. Log in as the owner to iterate.
            </p>
          </div>
        ) : (
          <GenerateButton
            user={user}
            model={model}
            credits={creditsData?.credits}
            planType={creditsData?.planType}
            isGenerating={isGenerating}
            isIteration={canIterate}
            hasGenerations={hasGenerations}
            referenceImageCount={referenceImages.length}
            onGenerate={handleGenerate}
            onSignIn={handleSignIn}
          />
        )}
      </div>
    </motion.section>
  );

  if (embedded) return mainContent;

  // Unified view for both new and existing threads
  return (
    <PageWrapper
      user={user}
      gap="small"
      title={thread?.title}
      onTitleSave={
        isOwner ? (newTitle) => titleUpdateMutation.mutate(newTitle) : undefined
      }
      description={formattedDate}
    >
      {mainContent}
    </PageWrapper>
  );
}
