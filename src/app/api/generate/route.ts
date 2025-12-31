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
    // Parse storage URL to extract bucket and path
    const parsed = parseStorageUrl(blobUrl);
    if (!parsed) {
      console.error("Failed to parse storage URL:", blobUrl);
      throw new Error(`Invalid storage URL format: ${blobUrl}`);
    }

    console.log("Downloading file from storage:", {
      bucket: parsed.bucket,
      path: parsed.path,
    });

    // Download file from Supabase Storage with authentication
    const blob = await downloadFile({
      supabase,
      bucket: parsed.bucket as typeof BUCKET_INPUT_IMAGES,
      path: parsed.path,
    });

    const contentType = blob.type;

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

    const arrayBuffer = await blob.arrayBuffer();
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
        try {
          // Parse storage URL to extract bucket and path
          const refParsed = parseStorageUrl(refUrl);
          if (!refParsed) {
            console.warn(`Invalid reference image URL: ${refUrl}`);
            continue;
          }

          // Download file from Supabase Storage with authentication
          const refBlob = await downloadFile({
            supabase,
            bucket: refParsed.bucket as typeof BUCKET_INPUT_IMAGES,
            path: refParsed.path,
          });

          const refContentType = refBlob.type;
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

    const creditsAvailable = await getCreditsForUser(user.id);
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
          externalCustomerId: user.id,
          metadata: {
            route: "/api/generate",
            model,
            credit_count: creditCost,
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
    const { url: outputUrl } = await uploadFile({
      supabase,
      bucket: BUCKET_OUTPUT_IMAGES,
      path: outputFilename,
      file: Buffer.from(result.uint8Array),
      contentType: result.mediaType,
      userId: user.id,
    });

    // Update generation record with output URL if available
    if (user && generationId) {
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
): Promise<void> {
  const title = await titleVisualizationImage(params);
  await supabase.from("threads").update({ title }).eq("id", params.threadId);
}
