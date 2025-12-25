import type { SupabaseClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { generateVisualizationImage, titleVisualizationImage } from "@/lib/ai";
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
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

  const { blobUrl, outdoor_light, indoor_light, edit_description, model } =
    validation.data;

  // Get user session
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Cannot use this endpoint unauthenticated"); // TODO: Raise 401 specifically
  }

  // Create a new thread
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .insert({
      user_id: user.id,
      title: "",
    })
    .select("id")
    .single();

  if (threadError) {
    throw threadError;
  }
  const threadId = thread.id;

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
      },
    })
    .select("id")
    .single();

  if (generationError) {
    throw generationError;
  }
  const generationId = generation.id;

  try {
    // Fetch the file from Vercel Blob
    const blobResponse = await fetch(blobUrl);

    if (!blobResponse.ok) {
      throw new Error("Failed to fetch blob.");
    }

    const contentType = blobResponse.headers.get("content-type");
    const contentLength = blobResponse.headers.get("content-length");

    if (!contentType || !ACCEPTED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: "Unsupported image format.",
          supported: ACCEPTED_MIME_TYPES,
        },
        { status: 415 },
      );
    }

    if (contentLength && Number(contentLength) > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 20MB." },
        { status: 413 },
      );
    }

    const arrayBuffer = await blobResponse.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuffer);

    void updateThreadWithTitle(supabase, thread, {
      buffer: imageBuffer,
      mediaType: contentType,
    }); // Update thread with title in background

    // Extract filename from URL
    const filename = blobUrl.split("/").pop()?.split("?")[0];
    if (!filename) {
      throw new Error("");
    }
    const filenameParts = filename.split(".");
    const filenameWithoutExt = filenameParts.slice(0, -1).join(".");
    const ext = filenameParts.at(-1);

    const result = await generateVisualizationImage({
      imageBuffer,
      mediaType: contentType,
      filename,
      outdoorLight: outdoor_light,
      indoorLight: indoor_light,
      editDescription: edit_description,
      model,
    });

    const outputFilename = `${filenameWithoutExt}-out-${new Date().toISOString()}.${ext}`;
    const blob = await put(outputFilename, Buffer.from(result.uint8Array), {
      access: "public",
      contentType: result.mediaType,
    });

    // Update generation record with output URL if available
    if (user && generationId) {
      const { error: updateError } = await supabase
        .from("generations")
        .update({
          output_url: blob.url,
        })
        .eq("id", generationId);

      if (updateError) {
        console.error("Failed to update generation:", updateError);
      }
    }

    return NextResponse.json({
      outputImage: blob.url,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Use Gemini Flash with "describe this image" prompt to generate title and update thread with it */
async function updateThreadWithTitle(
  supabase: SupabaseClient,
  thread: { id: string },
  image: {
    buffer: Buffer;
    mediaType: string;
  },
): Promise<void> {
  const title = await titleVisualizationImage(image);
  await supabase.from("threads").update({ title }).eq("id", thread.id);
}
