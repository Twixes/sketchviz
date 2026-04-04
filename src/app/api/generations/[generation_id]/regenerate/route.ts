import { NextResponse } from "next/server";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import {
  InsufficientCreditsError,
  processImageGeneration,
} from "@/lib/image-generation";
import { posthogNode } from "@/lib/posthog/server";
import { iterateRequestSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ generation_id: string }> },
) {
  const { generation_id: generationId } = await params;
  const body = await request.json();

  // Validate request body with Zod
  const validation = iterateRequestSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const {
    outdoor_light = null,
    indoor_light = null,
    edit_description = null,
    model = `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
    reference_image_urls,
    aspect_ratio = null,
  } = validation.data;

  // Get user session
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;
  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Fetch the current generation
  const { data: currentGeneration, error: fetchError } = await supabase
    .from("generations")
    .select(
      `
      id,
      thread_id,
      output_url,
      threads!inner (
        id,
        user_id,
        input_url,
        project_id
      )
    `,
    )
    .eq("id", generationId)
    .single();

  if (fetchError || !currentGeneration) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 },
    );
  }

  // Verify ownership (RLS SELECT is public, so we must check explicitly)
  const thread = currentGeneration.threads as unknown as {
    user_id: string;
    input_url: string;
    project_id: string | null;
  };
  if (thread.user_id !== userId) {
    return NextResponse.json(
      { error: "You don't have permission to regenerate this thread" },
      { status: 403 },
    );
  }

  // Fetch project context if thread belongs to a project
  let styleNotes: string | null = null;
  let projectReferenceImageUrls: string[] = [];
  if (thread.project_id) {
    const { data: project } = await supabase
      .from("projects")
      .select("style_notes, reference_image_urls")
      .eq("id", thread.project_id)
      .single();

    if (project) {
      styleNotes = project.style_notes;
      projectReferenceImageUrls =
        (project.reference_image_urls as string[]) || [];
    }
  }

  const allReferenceImageUrls = [
    ...projectReferenceImageUrls,
    ...(reference_image_urls || []),
  ];

  const threadId = currentGeneration.thread_id;

  // Determine if this is the first generation in the thread
  const { data: allGenerations } = await supabase
    .from("generations")
    .select("id, output_url")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  const isFirstGeneration =
    allGenerations && allGenerations.length > 0
      ? allGenerations[0].id === generationId
      : true; // Default to true if we can't determine

  // Derive input URL: first generation uses thread's input_url,
  // later generations use the previous generation's output_url
  let inputUrl: string;
  if (isFirstGeneration) {
    inputUrl = decodeURI(thread.input_url);
  } else if (allGenerations) {
    const currentIndex = allGenerations.findIndex((g) => g.id === generationId);
    const previousGeneration = allGenerations[currentIndex - 1];
    if (!previousGeneration?.output_url) {
      return NextResponse.json(
        { error: "Previous generation has no output to use as input" },
        { status: 400 },
      );
    }
    inputUrl = decodeURI(previousGeneration.output_url);
  } else {
    // Fallback to thread input (shouldn't reach here in practice)
    inputUrl = decodeURI(thread.input_url);
  }

  const traceId = crypto.randomUUID();

  try {
    const { outputUrl, creditCost, width, height } =
      await processImageGeneration({
        supabase,
        userId,
        traceId,
        inputUrl,
        outdoorLight: outdoor_light,
        indoorLight: indoor_light,
        editDescription: edit_description,
        styleNotes,
        model,
        aspectRatio: aspect_ratio,
        referenceImageUrls: allReferenceImageUrls,
        generationType: "regeneration",
        useBasePrompt: isFirstGeneration,
      });

    // Update the current generation's output and dimensions (not create a new one)
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        output_url: outputUrl,
        width,
        height,
        user_params: {
          outdoor_light,
          indoor_light,
          edit_description,
          model,
          aspect_ratio,
        },
      })
      .eq("id", generationId);

    if (updateError) {
      console.error("Failed to update generation:", updateError);
      throw updateError;
    }

    // Track successful regeneration
    posthogNode?.capture({
      distinctId: userId,
      event: "regeneration_succeeded",
      properties: {
        thread_id: threadId,
        generation_id: generationId,
        model,
        credit_cost: creditCost,
        outdoor_light,
        indoor_light,
        has_edit_description: edit_description !== null,
        aspect_ratio,
        is_first_generation: isFirstGeneration,
        reference_image_count: reference_image_urls?.length || 0,
      },
    });

    return NextResponse.json({
      outputImage: outputUrl,
      generationId,
      threadId,
      width,
      height,
    });
  } catch (error) {
    console.error("Regenerate endpoint error:", error);
    const internalMessage =
      error instanceof Error ? error.message : "Failed to regenerate image.";

    // Track failed regeneration
    posthogNode?.capture({
      distinctId: userId,
      event: "regeneration_failed",
      properties: {
        thread_id: threadId,
        generation_id: generationId,
        model,
        error: internalMessage,
        outdoor_light,
        indoor_light,
        has_edit_description: edit_description !== null,
        aspect_ratio,
        is_first_generation: isFirstGeneration,
        reference_image_count: reference_image_urls?.length || 0,
      },
    });

    if (error instanceof InsufficientCreditsError) {
      return NextResponse.json({ error: internalMessage }, { status: 402 });
    }
    return NextResponse.json(
      { error: "Failed to regenerate image." },
      { status: 500 },
    );
  }
}
