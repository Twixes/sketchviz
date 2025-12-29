import type { SupabaseClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateVisualizationImage, titleVisualizationImage } from "@/lib/ai";
import { calculateCropDimensions } from "@/lib/aspect-ratio";
import {
  ACCEPTED_MIME_TYPES,
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
  MAX_UPLOAD_BYTES,
} from "@/lib/constants";
import { polar } from "@/lib/polar";
import { generateRequestSchema, type Model } from "@/lib/schemas";
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
    blobUrl,
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
    let imageBuffer: Buffer = Buffer.from(arrayBuffer);

    // Crop image if aspect ratio is specified
    if (aspect_ratio) {
      const sharpImage = sharp(imageBuffer);
      const metadata = await sharpImage.metadata();

      if (!metadata.width || !metadata.height) {
        throw new Error("Unable to read image dimensions.");
      }

      const cropDimensions = calculateCropDimensions({
        imageWidth: metadata.width,
        imageHeight: metadata.height,
        targetRatio: aspect_ratio,
      });

      imageBuffer = Buffer.from(
        await sharpImage
          .extract({
            left: cropDimensions.left,
            top: cropDimensions.top,
            width: cropDimensions.width,
            height: cropDimensions.height,
          })
          .toBuffer(),
      );
    }

    void updateThreadWithTitle(supabase, {
      buffer: imageBuffer,
      mediaType: contentType,
      threadId,
      userId: user.id,
    }); // Update thread with title in background

    // Fetch reference images if provided
    const referenceImageBuffers: Array<{
      buffer: Buffer;
      mediaType: string;
    }> = [];

    if (reference_image_urls && reference_image_urls.length > 0) {
      for (const refUrl of reference_image_urls) {
        const refResponse = await fetch(refUrl);
        if (refResponse.ok) {
          const refContentType = refResponse.headers.get("content-type");
          if (refContentType && ACCEPTED_MIME_TYPES.includes(refContentType)) {
            const refArrayBuffer = await refResponse.arrayBuffer();
            referenceImageBuffers.push({
              buffer: Buffer.from(refArrayBuffer),
              mediaType: refContentType,
            });
          }
        }
      }
    }

    // Extract filename from URL
    const filename = blobUrl.split("/").pop()?.split("?")[0];
    if (!filename) {
      throw new Error("");
    }
    const filenameParts = filename.split(".");
    const filenameWithoutExt = filenameParts.slice(0, -1).join(".");
    const ext = filenameParts.at(-1);

    await polar.events.ingest({
      events: [
        {
          name: "image_generation_started",
          externalCustomerId: user.id,
          metadata: {
            route: "/api/generate",
            model,
            credit_count: determineCreditCostOfImageGeneration({ model }),
          },
        },
      ],
    });
    const result = await generateVisualizationImage({
      imageBuffer,
      mediaType: contentType,
      filename,
      outdoorLight: outdoor_light,
      indoorLight: indoor_light,
      editDescription: edit_description,
      model,
      referenceImages: referenceImageBuffers,
      aspectRatio: aspect_ratio,
      userId: user.id,
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
  params: {
    buffer: Buffer;
    mediaType: string;
    threadId: string;
    userId: string;
  },
): Promise<void> {
  const title = await titleVisualizationImage(params);
  await supabase.from("threads").update({ title }).eq("id", params.threadId);
}

function determineCreditCostOfImageGeneration({
  model,
}: {
  model: Model;
}): number {
  // Each credit costs the user 0.015 USD, but our calculation is `cost_of_image_output / 0.01` for a general 50% margin
  if (model === "google/gemini-3-pro-image-preview") {
    return 14; // Each 2K output image is 0.139 USD
  }
  if (model === "google/gemini-2.5-flash-image-preview") {
    return 4; // Each output image is 0.04 USD
  }
  return 0;
}
