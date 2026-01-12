import type { SupabaseClient, User } from "@supabase/supabase-js";
import sharp from "sharp";
import { generateIterationImage, generateVisualizationImage } from "./ai";
import type { AspectRatio } from "./aspect-ratio";
import { calculateCropDimensions } from "./aspect-ratio";
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from "./constants";
import { determineCreditCostOfImageGeneration } from "./credits";
import { getCreditsForUser, getPlanForUser, polar } from "./polar";
import { posthogNode } from "./posthog/server";
import type { IndoorLight, Model, OutdoorLight } from "./schemas";
import {
  type BUCKET_INPUT_IMAGES,
  BUCKET_OUTPUT_IMAGES,
  downloadFile,
  parseStorageUrl,
  uploadFile,
} from "./supabase/storage";

export interface PreparedImageData {
  imageBuffer: Buffer;
  contentType: string;
  filename: string;
  filenameWithoutExt: string;
  ext: string;
  referenceImageBuffers: Array<{
    buffer: Buffer;
    mediaType: string;
  }>;
}

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
  generationType: "iteration" | "regeneration" | "initial";
  useBasePrompt?: boolean;
}

interface ProcessImageGenerationResult {
  outputUrl: string;
  creditCost: number;
  width: number;
  height: number;
}

/**
 * Prepares an image for generation by downloading, validating, cropping,
 * and fetching reference images.
 */
export async function prepareImageForGeneration({
  supabase,
  inputUrl,
  aspectRatio,
  referenceImageUrls,
}: {
  supabase: SupabaseClient;
  inputUrl: string;
  aspectRatio: AspectRatio | null;
  referenceImageUrls: string[];
}): Promise<PreparedImageData> {
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
  const ext = filenameParts.at(-1) || "";

  return {
    imageBuffer,
    contentType,
    filename,
    filenameWithoutExt,
    ext,
    referenceImageBuffers,
  };
}

/**
 * Generates an image from prepared buffers, handles credits, analytics,
 * AI generation, and uploading.
 */
export async function generateAndUploadImage({
  supabase,
  userId,
  preparedImage,
  outdoorLight,
  indoorLight,
  editDescription,
  model,
  aspectRatio,
  generationType,
  useBasePrompt = false,
}: {
  supabase: SupabaseClient;
  userId: string;
  preparedImage: PreparedImageData;
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  generationType: "iteration" | "regeneration" | "initial";
  useBasePrompt?: boolean;
}): Promise<ProcessImageGenerationResult> {
  const creditCost = determineCreditCostOfImageGeneration({ model });

  const [creditsAvailable, [planType]] = await Promise.all([
    getCreditsForUser(userId),
    getPlanForUser(userId),
  ]);
  if (creditsAvailable === null) {
    throw new Error("Failed to fetch available credits");
  }
  // Only block free users - Pro users are billed for overages
  if (planType === "free" && creditsAvailable < creditCost) {
    throw new Error("Insufficient credits");
  }

  // Track analytics
  const analyticsMetadata = {
    model,
    credit_count: creditCost,
    ...(generationType === "iteration" && { is_iteration: true }),
    ...(generationType === "regeneration" && { is_regeneration: true }),
  };

  await polar.events.ingest({
    events: [
      {
        name: "image_generation_started",
        externalCustomerId: userId,
        metadata: analyticsMetadata,
      },
    ],
  });
  posthogNode.capture({
    distinctId: userId,
    event: "image_generation_started",
    properties: analyticsMetadata,
  });

  // Choose which generation function to use
  // Use the iteration function (no base prompt) when:
  // - It's an iteration AND useBasePrompt is false
  // - It's a regeneration AND useBasePrompt is false (regenerating a non-first generation)
  let generateFn = generateVisualizationImage;
  if (!useBasePrompt && generationType !== "initial") {
    generateFn = generateIterationImage;
  }

  const result = await generateFn({
    imageBuffer: preparedImage.imageBuffer,
    mediaType: preparedImage.contentType,
    filename: preparedImage.filename,
    outdoorLight,
    indoorLight,
    editDescription,
    model,
    referenceImages: preparedImage.referenceImageBuffers,
    aspectRatio,
    userId,
  });

  // Extract dimensions from generated image
  const outputBuffer = Buffer.from(result.uint8Array);
  const outputMetadata = await sharp(outputBuffer).metadata();
  if (!outputMetadata.width || !outputMetadata.height) {
    throw new Error("Unable to read generated image dimensions.");
  }

  const suffixMap = {
    iteration: "iter",
    regeneration: "regen",
    initial: "out",
  };
  const suffix = suffixMap[generationType];
  const outputFilename = `${preparedImage.filenameWithoutExt}-${suffix}-${new Date().toISOString()}.${preparedImage.ext}`;
  const { url: outputUrl } = await uploadFile({
    supabase,
    bucket: BUCKET_OUTPUT_IMAGES,
    path: outputFilename,
    file: outputBuffer,
    contentType: result.mediaType,
    userId,
  });

  return {
    outputUrl,
    creditCost,
    width: outputMetadata.width,
    height: outputMetadata.height,
  };
}

/**
 * Convenience wrapper that prepares and generates an image in one call.
 * For more control (e.g., parallel operations), use prepareImageForGeneration
 * and generateAndUploadImage separately.
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
  const preparedImage = await prepareImageForGeneration({
    supabase,
    inputUrl,
    aspectRatio,
    referenceImageUrls,
  });

  return generateAndUploadImage({
    supabase,
    userId: user.id,
    preparedImage,
    outdoorLight,
    indoorLight,
    editDescription,
    model,
    aspectRatio,
    generationType,
    useBasePrompt,
  });
}
