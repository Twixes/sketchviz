import type { SupabaseClient } from "@supabase/supabase-js";
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
import { determineCreditCostOfImageGeneration } from "@/lib/credits";
import { getCreditsForUser, polar } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import { generateRequestSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  type BUCKET_INPUT_IMAGES,
  BUCKET_OUTPUT_IMAGES,
  downloadFile,
  parseStorageUrl,
  uploadFile,
} from "@/lib/supabase/storage";

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
    outdoor_light,
    indoor_light,
    edit_description,
    model = `${DEFAULT_MODEL_PROVIDER}/${DEFAULT_IMAGE_EDITING_MODEL}`,
    reference_image_urls,
    aspect_ratio,
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
    // Try to parse as Supabase Storage URL first
    const parsed = parseStorageUrl(blobUrl);
    let blob: Blob;
    let contentType: string;

    if (parsed) {
      // Supabase Storage URL - use authenticated download
      blob = await downloadFile({
        supabase,
        bucket: parsed.bucket as typeof BUCKET_INPUT_IMAGES,
        path: parsed.path,
      });
      contentType = blob.type;
    } else {
      // Public URL or legacy Vercel Blob URL - use regular fetch
      const blobResponse = await fetch(blobUrl);
      if (!blobResponse.ok) {
        throw new Error("Failed to fetch file from URL.");
      }
      contentType = blobResponse.headers.get("content-type") || "";
      blob = await blobResponse.blob();
    }

    if (!contentType || !ACCEPTED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: "Unsupported image format.",
          supported: ACCEPTED_MIME_TYPES,
        },
        { status: 415 },
      );
    }

    if (blob.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 20MB." },
        { status: 413 },
      );
    }

    let imageBuffer: Buffer = Buffer.from(await blob.arrayBuffer());

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
      imageBuffer = await sharpImage
        .extract({
          left: cropDimensions.left,
          top: cropDimensions.top,
          width: cropDimensions.width,
          height: cropDimensions.height,
        })
        .toBuffer();
    }

    // Fetch reference images if provided
    const referenceImageBuffers: Array<{
      buffer: Buffer;
      mediaType: string;
    }> = [];

    if (reference_image_urls && reference_image_urls.length > 0) {
      for (const refUrl of reference_image_urls) {
        try {
          // Try to parse as Supabase Storage URL first
          const refParsed = parseStorageUrl(refUrl);
          let refBlob: Blob;
          let refContentType: string;

          if (refParsed) {
            // Supabase Storage URL - use authenticated download
            refBlob = await downloadFile({
              supabase,
              bucket: refParsed.bucket as typeof BUCKET_INPUT_IMAGES,
              path: refParsed.path,
            });
            refContentType = refBlob.type;
          } else {
            // Public URL or legacy Vercel Blob URL - use regular fetch
            const refResponse = await fetch(refUrl);
            if (!refResponse.ok) {
              console.warn(`Failed to fetch reference image: ${refUrl}`);
              continue;
            }

            refContentType = refResponse.headers.get("content-type") || "";
            refBlob = await refResponse.blob();
          }

          if (refContentType && ACCEPTED_MIME_TYPES.includes(refContentType)) {
            const refArrayBuffer = await refBlob.arrayBuffer();
            referenceImageBuffers.push({
              buffer: Buffer.from(refArrayBuffer),
              mediaType: refContentType,
            });
          }
        } catch (error) {
          console.error(`Failed to fetch reference image ${refUrl}:`, error);
          // Continue with other reference images
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

    const creditCost = determineCreditCostOfImageGeneration({ model });

    const creditsAvailable = await getCreditsForUser(userId);
    if (creditsAvailable === null) {
      return NextResponse.json(
        { error: "Failed to fetch available credits" },
        { status: 500 },
      );
    }
    if (creditsAvailable < creditCost) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    await polar.events.ingest({
      events: [
        {
          name: "image_generation_started",
          externalCustomerId: userId,
          metadata: {
            model,
            credit_count: creditCost,
          },
        },
      ],
    });
    posthogNode.capture({
      distinctId: userId,
      event: "image_generation_started",
      properties: {
        model,
        credit_count: creditCost,
      },
    });
    const [result] = await Promise.all([
      generateVisualizationImage({
        imageBuffer,
        mediaType: contentType,
        filename,
        outdoorLight: outdoor_light,
        indoorLight: indoor_light,
        editDescription: edit_description,
        model,
        referenceImages: referenceImageBuffers,
        aspectRatio: aspect_ratio,
        userId,
      }),
      updateThreadWithTitle(supabase, {
        buffer: imageBuffer,
        mediaType: contentType,
        threadId,
        userId,
      }),
    ]);
    const outputFilename = `${filenameWithoutExt}-out-${new Date().toISOString()}.${ext}`;
    const { url: outputUrl } = await uploadFile({
      supabase,
      bucket: BUCKET_OUTPUT_IMAGES,
      path: outputFilename,
      file: Buffer.from(result.uint8Array),
      contentType: result.mediaType,
      userId,
    });

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
    buffer: Buffer;
    mediaType: string;
    threadId: string;
    userId: string;
  },
): Promise<string> {
  const title = await titleVisualizationImage(params);
  await supabase.from("threads").update({ title }).eq("id", params.threadId);
  return title;
}
