import { NextResponse } from "next/server";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import { processImageGeneration } from "@/lib/image-generation";
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
    outdoor_light,
    indoor_light,
    edit_description,
    model = `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
    reference_image_urls,
    aspect_ratio,
  } = validation.data;

  // Get user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Fetch the current generation and verify ownership through RLS
  const { data: currentGeneration, error: fetchError } = await supabase
    .from("generations")
    .select(
      `
      id,
      thread_id,
      input_url,
      output_url,
      threads!inner (
        id,
        user_id
      )
    `,
    )
    .eq("id", generationId)
    .single();

  if (fetchError || !currentGeneration) {
    return NextResponse.json(
      { error: "Generation not found or access denied" },
      { status: 404 },
    );
  }

  const threadId = currentGeneration.thread_id;

  // For regeneration, we need to find the input that was originally used for this generation
  // This is stored in the current generation's input_url
  const inputUrl = decodeURI(currentGeneration.input_url);

  try {
    const { outputUrl } = await processImageGeneration({
      supabase,
      user,
      inputUrl,
      outdoorLight: outdoor_light,
      indoorLight: indoor_light,
      editDescription: edit_description,
      model,
      aspectRatio: aspect_ratio,
      referenceImageUrls: reference_image_urls || [],
      generationType: "regeneration",
      useBasePrompt: true, // Regeneration always uses base prompt
    });

    // Update the current generation's output (not create a new one)
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        output_url: outputUrl,
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

    return NextResponse.json({
      outputImage: outputUrl,
      generationId,
      threadId,
    });
  } catch (error) {
    console.error("Regenerate endpoint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to regenerate image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
