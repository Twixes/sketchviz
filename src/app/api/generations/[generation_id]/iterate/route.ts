import { NextResponse } from "next/server";
import sharp from "sharp";
import { generateIterationImage, generateVisualizationImage } from "@/lib/ai";
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
import { iterateRequestSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import {
  type BUCKET_INPUT_IMAGES,
  BUCKET_OUTPUT_IMAGES,
  downloadFile,
  parseStorageUrl,
  uploadFile,
} from "@/lib/supabase/storage";

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

  try {
    // Download the input image (previous output)
    const parsed = parseStorageUrl(inputUrl);
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
      // Public URL - use regular fetch
      const blobResponse = await fetch(inputUrl);
      if (!blobResponse.ok) {
        throw new Error("Failed to fetch file from URL.");
      }
      contentType = blobResponse.headers.get("content-type") || "";
      const blobArrayBuffer = await blobResponse.arrayBuffer();
      blob = new Blob([blobArrayBuffer], { type: contentType });
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

    // Fetch reference images if provided
    const referenceImageBuffers: Array<{
      buffer: Buffer;
      mediaType: string;
    }> = [];

    if (reference_image_urls && reference_image_urls.length > 0) {
      for (const refUrl of reference_image_urls) {
        try {
          const refParsed = parseStorageUrl(refUrl);
          let refBlob: Blob;
          let refContentType: string;

          if (refParsed) {
            refBlob = await downloadFile({
              supabase,
              bucket: refParsed.bucket as typeof BUCKET_INPUT_IMAGES,
              path: refParsed.path,
            });
            refContentType = refBlob.type;
          } else {
            const refResponse = await fetch(refUrl);
            if (!refResponse.ok) {
              console.warn(`Failed to fetch reference image: ${refUrl}`);
              continue;
            }
            refContentType = refResponse.headers.get("content-type") || "";
            const refArrayBuffer = await refResponse.arrayBuffer();
            refBlob = new Blob([refArrayBuffer], { type: refContentType });
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
        }
      }
    }

    // Extract filename from URL
    const filename = inputUrl.split("/").pop()?.split("?")[0];
    if (!filename) {
      throw new Error("Could not extract filename from URL");
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
            model,
            credit_count: creditCost,
            is_iteration: true,
          },
        },
      ],
    });
    posthogNode.capture({
      distinctId: user.id,
      event: "image_generation_started",
      properties: {
        model,
        credit_count: creditCost,
        is_iteration: true,
      },
    });

    // Choose which generation function to use based on use_base_prompt flag
    const generateFn = use_base_prompt
      ? generateVisualizationImage
      : generateIterationImage;

    const result = await generateFn({
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

    const outputFilename = `${filenameWithoutExt}-iter-${new Date().toISOString()}.${ext}`;
    const { url: outputUrl } = await uploadFile({
      supabase,
      bucket: BUCKET_OUTPUT_IMAGES,
      path: outputFilename,
      file: Buffer.from(result.uint8Array),
      contentType: result.mediaType,
      userId: user.id,
    });

    // Update generation record with output URL
    const { error: updateError } = await supabase
      .from("generations")
      .update({
        output_url: outputUrl,
      })
      .eq("id", newGenerationId);

    if (updateError) {
      console.error("Failed to update generation:", updateError);
    }

    return NextResponse.json({
      outputImage: outputUrl,
      generationId: newGenerationId,
      threadId,
    });
  } catch (error) {
    console.error("Iterate endpoint error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to iterate on image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
