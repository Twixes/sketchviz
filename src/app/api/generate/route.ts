import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { titleVisualizationImage } from "@/lib/ai";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import {
  generateAndUploadImage,
  getStyleSourceImages,
  type PreparedImageData,
  prepareImageForGeneration,
  type StyleSourceImages,
} from "@/lib/image-generation";
import { posthogNode } from "@/lib/posthog/server";
import { generateRequestSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();

  // Validate request body with Zod
  const validation = generateRequestSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const {
    input_url: blobUrl,
    thread_id: threadId,
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

  // Create or reuse a thread
  // If a thread with this ID already exists (and has no generations), reuse it
  const { data: existingThread } = await supabase
    .from("threads")
    .select("id, user_id, generations(id)")
    .eq("id", threadId)
    .single();

  if (existingThread) {
    if (existingThread.user_id !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to use this thread" },
        { status: 403 },
      );
    }
    if (existingThread.generations.length > 0) {
      return NextResponse.json(
        { error: "Thread already has generations, use iterate instead" },
        { status: 400 },
      );
    }
    // Update existing thread with input_url
    const { error: updateError } = await supabase
      .from("threads")
      .update({ input_url: blobUrl })
      .eq("id", threadId);
    if (updateError) {
      throw updateError;
    }
  } else {
    const { error: threadError } = await supabase.from("threads").insert({
      id: threadId,
      user_id: userId,
      title: "",
      input_url: blobUrl,
    });
    if (threadError) {
      throw threadError;
    }
  }

  // Check if thread belongs to a project and fetch project context
  let styleSourceImages: StyleSourceImages | null = null;
  let projectReferenceImageUrls: string[] = [];
  const threadForProject = existingThread;
  if (threadForProject) {
    const { data: threadWithProject } = await supabase
      .from("threads")
      .select("project_id")
      .eq("id", threadId)
      .single();

    if (threadWithProject?.project_id) {
      const { data: project } = await supabase
        .from("projects")
        .select("style_source_generation_id, reference_image_urls")
        .eq("id", threadWithProject.project_id)
        .single();

      if (project) {
        if (project.style_source_generation_id) {
          styleSourceImages = await getStyleSourceImages({
            supabase,
            projectId: threadWithProject.project_id,
          });
        }
        projectReferenceImageUrls =
          (project.reference_image_urls as string[]) || [];
      }
    }
  }

  // Merge project reference images with thread reference images
  const allReferenceImageUrls = [
    ...projectReferenceImageUrls,
    ...(reference_image_urls || []),
  ];

  // Create a new generation record
  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .insert({
      thread_id: threadId,
      output_url: null,
      user_params: {
        outdoor_light,
        indoor_light,
        edit_description,
        model,
        aspect_ratio,
      },
    })
    .select("id")
    .single();

  if (generationError) {
    throw generationError;
  }
  const generationId = generation.id;

  try {
    // Prepare image once (download, validate, crop, fetch references)
    const preparedImage = await prepareImageForGeneration({
      supabase,
      inputUrl: blobUrl,
      aspectRatio: aspect_ratio,
      referenceImageUrls: allReferenceImageUrls,
      generationType: "initial",
    });

    const traceId = crypto.randomUUID();

    // Run image generation and title generation in parallel
    const [{ outputUrl, creditCost, width, height }] = await Promise.all([
      generateAndUploadImage({
        supabase,
        userId,
        preparedImage,
        outdoorLight: outdoor_light,
        indoorLight: indoor_light,
        editDescription: edit_description,
        styleSourceImages,
        model,
        aspectRatio: aspect_ratio,
        generationType: "initial",
        traceId,
      }),
      updateThreadWithTitle(supabase, {
        preparedImage,
        threadId,
        userId,
        traceId,
      }),
    ]);

    // Update generation record with output URL and dimensions
    if (userId && generationId) {
      const { error: updateError } = await supabase
        .from("generations")
        .update({
          output_url: outputUrl,
          width,
          height,
        })
        .eq("id", generationId);

      if (updateError) {
        console.error("Failed to update generation:", updateError);
      }
    }

    // Track successful generation
    posthogNode?.capture({
      distinctId: userId,
      event: "generation_succeeded",
      properties: {
        thread_id: threadId,
        generation_id: generationId,
        model,
        credit_cost: creditCost,
        outdoor_light,
        indoor_light,
        has_edit_description: edit_description !== null,
        aspect_ratio,
        reference_image_count: reference_image_urls?.length || 0,
      },
    });

    return NextResponse.json({
      outputImage: outputUrl,
      threadId,
      generationId,
      width,
      height,
    });
  } catch (error) {
    console.error("Generate endpoint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image.";

    // Track failed generation
    posthogNode?.capture({
      distinctId: userId,
      event: "generation_failed",
      properties: {
        thread_id: threadId,
        generation_id: generationId,
        model,
        error: message,
        outdoor_light,
        indoor_light,
        has_edit_description: edit_description !== null,
        aspect_ratio,
        reference_image_count: reference_image_urls?.length || 0,
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Use Gemini Flash with "describe this image" prompt to generate title and update thread with it */
async function updateThreadWithTitle(
  supabase: SupabaseClient,
  params: {
    preparedImage: PreparedImageData;
    threadId: string;
    userId: string;
    traceId: string;
  },
): Promise<string> {
  const title = await titleVisualizationImage({
    buffer: params.preparedImage.imageBuffer,
    mediaType: params.preparedImage.contentType,
    userId: params.userId,
    traceId: params.traceId,
  });
  await supabase.from("threads").update({ title }).eq("id", params.threadId);
  return title;
}
