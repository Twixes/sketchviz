import type { SupabaseClient, User } from "@supabase/supabase-js";
import sharp from "sharp";
import { generateIterationImage, generateVisualizationImage } from "./ai";
import type { AspectRatio } from "./aspect-ratio";
import { calculateCropDimensions } from "./aspect-ratio";
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import { determineCreditCostOfImageGeneration } from "./credits";
import { getCreditsForUser, polar } from "./polar";
import { posthogNode } from "./posthog/server";
import type { IndoorLight, Model, OutdoorLight } from "./schemas";
import {
  type BUCKET_INPUT_IMAGES,
  BUCKET_OUTPUT_IMAGES,
  downloadFile,
  parseStorageUrl,
  uploadFile,
} from "./supabase/storage";

interface ProcessImageGenerationParams {
  supabase: SupabaseClient;
  user: User;
  inputUrl: string;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  referenceImageUrls: string[];
  generationType: "iteration" | "regeneration";
  useBasePrompt?: boolean;
}

interface ProcessImageGenerationResult {
  outputUrl: string;
  creditCost: number;
}

/**
 * Shared logic for processing image generation (both iteration and regeneration).
 * Handles downloading input, validation, cropping, reference images, credits,
 * AI generation, and uploading the result.
 */
export async function processImageGeneration({
  supabase,
  user,
  inputUrl,
  outdoorLight,
  indoorLight,
  editDescription,
  model,
  aspectRatio,
  referenceImageUrls,
  generationType,
  useBasePrompt = false,
}: ProcessImageGenerationParams): Promise<ProcessImageGenerationResult> {
  // Download the input image
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
    throw new Error(
      `Unsupported image format. Supported: ${ACCEPTED_MIME_TYPES.join(", ")}`,
    );
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error("File too large. Max 20MB.");
  }

  const arrayBuffer = await blob.arrayBuffer();
  let imageBuffer: Buffer = Buffer.from(arrayBuffer);

  // Crop image if aspect ratio is specified
  if (aspectRatio) {
    const sharpImage = sharp(imageBuffer);
    const metadata = await sharpImage.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to read image dimensions.");
    }

    const cropDimensions = calculateCropDimensions({
      imageWidth: metadata.width,
      imageHeight: metadata.height,
      targetRatio: aspectRatio,
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

  if (referenceImageUrls && referenceImageUrls.length > 0) {
    for (const refUrl of referenceImageUrls) {
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
    throw new Error("Failed to fetch available credits");
  }
  if (creditsAvailable < creditCost) {
    throw new Error("Insufficient credits");
  }

  // Track analytics
  const analyticsMetadata = {
    model,
    credit_count: creditCost,
    ...(generationType === "iteration"
      ? { is_iteration: true }
      : { is_regeneration: true }),
  };

  await polar.events.ingest({
    events: [
      {
        name: "image_generation_started",
        externalCustomerId: user.id,
        metadata: analyticsMetadata,
      },
    ],
  });
  posthogNode.capture({
    distinctId: user.id,
    event: "image_generation_started",
    properties: analyticsMetadata,
  });

  // Choose which generation function to use
  let generateFn = generateVisualizationImage;
  if (generationType === "iteration" && !useBasePrompt) {
    generateFn = generateIterationImage;
  }

  const result = await generateFn({
    imageBuffer,
    mediaType: contentType,
    filename,
    outdoorLight,
    indoorLight,
    editDescription,
    model,
    referenceImages: referenceImageBuffers,
    aspectRatio,
    userId: user.id,
  });

  const suffix = generationType === "iteration" ? "iter" : "regen";
  const outputFilename = `${filenameWithoutExt}-${suffix}-${new Date().toISOString()}.${ext}`;
  const { url: outputUrl } = await uploadFile({
    supabase,
    bucket: BUCKET_OUTPUT_IMAGES,
    path: outputFilename,
    file: Buffer.from(result.uint8Array),
    contentType: result.mediaType,
    userId: user.id,
  });

  return {
    outputUrl,
    creditCost,
  };
}
