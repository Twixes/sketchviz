import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { titleVisualizationImage } from "@/lib/ai";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import {
  generateAndUploadImage,
  type PreparedImageData,
  prepareImageForGeneration,
} from "@/lib/image-generation";
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

  // Create a new thread (use client-provided ID if available)
  const { error: threadError } = await supabase.from("threads").insert({
    id: threadId,
    user_id: userId,
    title: "",
  });

  if (threadError) {
    throw threadError;
  }

  // Create a new generation record
  const { data: generation, error: generationError } = await supabase
    .from("generations")
    .insert({
      thread_id: threadId,
      input_url: blobUrl,
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
      referenceImageUrls: reference_image_urls || [],
    });

    // Run image generation and title generation in parallel
    const [{ outputUrl }] = await Promise.all([
      generateAndUploadImage({
        supabase,
        userId,
        preparedImage,
        outdoorLight: outdoor_light,
        indoorLight: indoor_light,
        editDescription: edit_description,
        model,
        aspectRatio: aspect_ratio,
        generationType: "initial",
      }),
      updateThreadWithTitle(supabase, {
        preparedImage,
        threadId,
        userId,
      }),
    ]);

    // Update generation record with output URL if available
    if (userId && generationId) {
      const { error: updateError } = await supabase
        .from("generations")
        .update({
          output_url: outputUrl,
        })
        .eq("id", generationId);

      if (updateError) {
        console.error("Failed to update generation:", updateError);
      }
    }

    return NextResponse.json({
      outputImage: outputUrl,
      threadId,
      generationId,
    });
  } catch (error) {
    console.error("Generate endpoint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to generate image.";

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
  },
): Promise<string> {
  const title = await titleVisualizationImage({
    buffer: params.preparedImage.imageBuffer,
    mediaType: params.preparedImage.contentType,
    userId: params.userId,
  });
  await supabase.from("threads").update({ title }).eq("id", params.threadId);
  return title;
}
