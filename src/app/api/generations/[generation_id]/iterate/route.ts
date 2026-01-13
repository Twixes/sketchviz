import { NextResponse } from "next/server";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "@/lib/constants";
import { processImageGeneration } from "@/lib/image-generation";
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
    use_base_prompt,
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

  // Fetch the previous generation and verify ownership through RLS
  const { data: previousGeneration, error: fetchError } = await supabase
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

  if (fetchError || !previousGeneration) {
    return NextResponse.json(
      { error: "Generation not found or access denied" },
      { status: 404 },
    );
  }

  // Verify the generation has an output to iterate on
  if (!previousGeneration.output_url) {
    return NextResponse.json(
      { error: "Cannot iterate on a generation that has no output" },
      { status: 400 },
    );
  }

  const threadId = previousGeneration.thread_id;
  const inputUrl = decodeURI(previousGeneration.output_url); // Use previous output as new input

  // Create a new generation record
  const { data: newGeneration, error: generationError } = await supabase
    .from("generations")
    .insert({
      thread_id: threadId,
      input_url: inputUrl,
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
  const newGenerationId = newGeneration.id;

  const traceId = crypto.randomUUID();

  try {
    const { outputUrl, creditCost, width, height } =
      await processImageGeneration({
        supabase,
        user,
        traceId,
        inputUrl,
        outdoorLight: outdoor_light,
        indoorLight: indoor_light,
        editDescription: edit_description,
        model,
        aspectRatio: aspect_ratio,
        referenceImageUrls: reference_image_urls || [],
        generationType: "iteration",
        useBasePrompt: use_base_prompt,
      });

    // Update generation record with output URL and dimensions
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        output_url: outputUrl,
        width,
        height,
      })
      .eq("id", newGenerationId);

    if (updateError) {
      console.error("Failed to update generation:", updateError);
    }

    // Track successful iteration
    posthogNode.capture({
      distinctId: user.id,
      event: "iteration_succeeded",
      properties: {
        thread_id: threadId,
        generation_id: newGenerationId,
        previous_generation_id: generationId,
        model,
        credit_cost: creditCost,
        outdoor_light,
        indoor_light,
        has_edit_description: edit_description !== null,
        aspect_ratio,
        use_base_prompt,
        reference_image_count: reference_image_urls?.length || 0,
      },
    });

    return NextResponse.json({
      outputImage: outputUrl,
      generationId: newGenerationId,
      threadId,
      width,
      height,
    });
  } catch (error) {
    console.error("Iterate endpoint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to iterate on image.";

    // Track failed iteration
    posthogNode.capture({
      distinctId: user.id,
      event: "iteration_failed",
      properties: {
        thread_id: threadId,
        previous_generation_id: generationId,
        model,
        error: message,
        outdoor_light,
        indoor_light,
        has_edit_description: edit_description !== null,
        aspect_ratio,
        use_base_prompt,
        reference_image_count: reference_image_urls?.length || 0,
      },
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
