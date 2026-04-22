import { createBlackForestLabs } from "@ai-sdk/black-forest-labs";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { withTracing } from "@posthog/ai";
import { generateImage, generateText, type LanguageModel } from "ai";
import sharp from "sharp";
import {
  type AspectRatio,
  calculateDimensionsForMegapixels,
} from "./aspect-ratio";
import { posthogNode } from "./posthog/server";
import type { IndoorLight, Model, OutdoorLight } from "./schemas";

const googleClient = createGoogleGenerativeAI();
const bflClient = createBlackForestLabs();
const openaiClient = createOpenAI();

const IMAGE_DESCRIPTION_PROMPT = `
Describe this SketchUp render in a brief plain-text title.
Follow the APA style of titles. No period at the end. Up to 12 words.
Start with what the render presents, then more specific details.
Refer to a matching historical or contemporary style of design if relevant (but you must highlight which elements reflect this style).

<example>
Kitchen: Wood Grain, Red Stone, Japenese-Inspired Panels
</example>
`.trim();

type GeneratedImage = {
  base64: string;
  uint8Array: Uint8Array;
  mediaType: string;
};

type GenerateImageParams = {
  imageBuffer: Buffer;
  mediaType: string;
  filename?: string;
  outdoorLight?: OutdoorLight;
  indoorLight?: IndoorLight;
  editDescription?: string | null;
  styleNotes?: string | null;
  model: Model;
  referenceImages?: Array<{ buffer: Buffer; mediaType: string }>;
  aspectRatio?: AspectRatio | null;
  userId: string;
  traceId: string;
};

async function generateImageFromPrompt(
  params: GenerateImageParams,
  prompt: string,
): Promise<GeneratedImage> {
  if (process.env.SKIP_AI === "1") {
    // "Deep fry" the input image with extreme processing
    const deepFriedBuffer = await sharp(params.imageBuffer)
      .modulate({
        saturation: 10, // 1000% saturation
        brightness: 1.2, // 20% brighter
      })
      .linear(1.5, -(128 * 0.5)) // Increase contrast
      .sharpen({ sigma: 2 }) // Heavy sharpening
      .jpeg({ quality: 20 }) // Low quality JPEG for compression artifacts
      .toBuffer();
    const base64 = deepFriedBuffer.toString("base64");
    return {
      mediaType: "image/jpeg",
      base64,
      uint8Array: deepFriedBuffer,
    };
  }

  // Select the model, stripping the provider prefix
  // Also extract imageSize from model name if present (e.g., "gemini-3-pro-image-preview/4k" -> "4k")
  const [modelProvider, modelName, imageSizeFromModel] =
    params.model.split("/");

  // Handle BFL models separately as they use a different API
  if (modelProvider === "bfl") {
    return generateBflImage(params, prompt, modelName, imageSizeFromModel);
  }

  // Handle OpenAI models (gpt-image-2) via generateImage API
  if (modelProvider === "openai") {
    return generateOpenAIImage(params, prompt, modelName, imageSizeFromModel);
  }

  // Google Gemini models
  let imageEditingModel: LanguageModel;
  if (modelProvider === "google") {
    imageEditingModel = googleClient.languageModel(modelName);
  } else {
    throw new Error(`Unsupported model provider: ${modelProvider}`);
  }
  if (posthogNode) {
    imageEditingModel = withTracing(imageEditingModel, posthogNode, {
      posthogDistinctId: params.userId,
      posthogTraceId: params.traceId,
    });
  }

  // Build content array with main image and reference images
  const content: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Buffer; mediaType: string; filename?: string }
  > = [{ type: "text", text: prompt }];

  // Add reference images if provided
  if (params.referenceImages && params.referenceImages.length > 0) {
    for (const refImage of params.referenceImages) {
      content.push({
        type: "file",
        data: refImage.buffer,
        mediaType: refImage.mediaType,
      });
    }
  }
  content.push({
    type: "file",
    data: params.imageBuffer,
    mediaType: params.mediaType,
    filename: params.filename,
  });

  const providerOptions: {
    google: {
      responseModalities: ["IMAGE"];
      imageConfig?: { aspectRatio?: string; imageSize?: "1K" | "2K" | "4K" };
    };
  } = {
    google: {
      responseModalities: ["IMAGE"],
      imageConfig: {},
    },
  };

  // Add imageSize for models that support it (Pro and Standard, but not legacy Flash)
  const supportsImageSize =
    params.model.startsWith("google/gemini-3-pro-image-preview") ||
    params.model.startsWith("google/gemini-3.1-flash-image-preview");
  if (supportsImageSize) {
    providerOptions.google.imageConfig!.imageSize =
      imageSizeFromModel === "4k" ? "4K" : "2K";
  }
  if (params.aspectRatio) {
    providerOptions.google.imageConfig!.aspectRatio = params.aspectRatio;
  }

  const result = await imageEditingModel.doGenerate({
    prompt: [
      {
        role: "user",
        content,
      },
    ],
    providerOptions,
  });

  const imagePart = result.content.find(
    (part) =>
      part.type === "file" &&
      typeof part.data === "string" &&
      part.mediaType.startsWith("image/"),
  );

  if (
    !imagePart ||
    imagePart.type !== "file" ||
    typeof imagePart.data !== "string"
  ) {
    throw new Error("No image returned by Gemini.");
  }

  return {
    mediaType: imagePart.mediaType,
    base64: imagePart.data,
    uint8Array: Buffer.from(imagePart.data, "base64"),
  };
}

async function generateBflImage(
  params: GenerateImageParams,
  prompt: string,
  modelName: string,
  imageSizeFromModel: string | undefined,
): Promise<GeneratedImage> {
  // Determine aspect ratio: use provided or calculate from input image
  let aspectRatio: AspectRatio | number;
  if (params.aspectRatio) {
    aspectRatio = params.aspectRatio;
  } else {
    // Calculate aspect ratio from input image dimensions
    const metadata = await sharp(params.imageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Could not determine input image dimensions");
    }
    aspectRatio = metadata.width / metadata.height;
  }

  // Calculate dimensions: 1MP for 1K, 2MP for 1.5K (BFL max dimension is 1920)
  const megapixels = imageSizeFromModel === "1.5k" ? 2 : 1;
  const { width, height } = calculateDimensionsForMegapixels({
    aspectRatio,
    megapixels,
    maxDimension: 1920,
  });

  // Build images array: reference images + input image (as Buffers)
  const images: Buffer[] = [];
  if (params.referenceImages && params.referenceImages.length > 0) {
    for (const refImage of params.referenceImages) {
      images.push(refImage.buffer);
    }
  }
  // Add the input image as the primary reference
  images.push(params.imageBuffer);

  // Use the BFL image model (tracing not supported for image models)
  const bflModel = bflClient.image(modelName);

  const result = await generateImage({
    model: bflModel,
    prompt: {
      text: prompt,
      images,
    },
    providerOptions: {
      blackForestLabs: {
        width,
        height,
      },
    },
  });

  if (!result.images || result.images.length === 0) {
    throw new Error("No image returned by Black Forest Labs.");
  }

  const generatedImage = result.images[0];
  const uint8Array = generatedImage.uint8Array;
  const base64 = Buffer.from(uint8Array).toString("base64");

  return {
    mediaType: "image/png",
    base64,
    uint8Array,
  };
}

async function generateOpenAIImage(
  params: GenerateImageParams,
  prompt: string,
  modelName: string,
  imageSizeFromModel: string | undefined,
): Promise<GeneratedImage> {
  // Determine aspect ratio: use provided or calculate from input image
  let aspectRatio: AspectRatio | number;
  if (params.aspectRatio) {
    aspectRatio = params.aspectRatio;
  } else {
    const metadata = await sharp(params.imageBuffer).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error("Could not determine input image dimensions");
    }
    aspectRatio = metadata.width / metadata.height;
  }

  // Calculate dimensions: ~8MP for 4K, ~4MP for 2K
  // gpt-image-2 constraints: max edge 3840px, both edges multiples of 16, ratio ≤3:1, 655K–8.3M total px
  const megapixels = imageSizeFromModel === "4k" ? 8 : 4;
  let { width, height } = calculateDimensionsForMegapixels({
    aspectRatio,
    megapixels,
    maxDimension: 3840,
  });
  // OpenAI requires dimensions to be multiples of 16
  width = Math.round(width / 16) * 16;
  height = Math.round(height / 16) * 16;

  // Enforce gpt-image-2 constraints: ratio ≤3:1, total pixels 655,360–8,294,400
  const currentRatio = Math.max(width, height) / Math.min(width, height);
  if (currentRatio > 3) {
    // Shrink the long edge to satisfy the 3:1 constraint
    if (width > height) {
      width = Math.round((height * 3) / 16) * 16;
    } else {
      height = Math.round((width * 3) / 16) * 16;
    }
  }
  const totalPixels = width * height;
  if (totalPixels < 655_360) {
    // Scale up proportionally to hit minimum
    const scale = Math.sqrt(655_360 / totalPixels);
    width = Math.ceil((width * scale) / 16) * 16;
    height = Math.ceil((height * scale) / 16) * 16;
  } else if (totalPixels > 8_294_400) {
    // Scale down proportionally to hit maximum
    const scale = Math.sqrt(8_294_400 / totalPixels);
    width = Math.floor((width * scale) / 16) * 16;
    height = Math.floor((height * scale) / 16) * 16;
  }

  // Build images array: reference images + input image
  const images: Buffer[] = [];
  if (params.referenceImages && params.referenceImages.length > 0) {
    for (const refImage of params.referenceImages) {
      images.push(refImage.buffer);
    }
  }
  images.push(params.imageBuffer);

  const openaiModel = openaiClient.image(modelName);

  const result = await generateImage({
    model: openaiModel,
    prompt: {
      text: prompt,
      images,
    },
    size: `${width}x${height}`,
    providerOptions: {
      openai: {
        quality: "high",
      },
    },
  });

  if (!result.images || result.images.length === 0) {
    throw new Error("No image returned by OpenAI.");
  }

  const generatedImage = result.images[0];
  const uint8Array = generatedImage.uint8Array;
  const base64 = Buffer.from(uint8Array).toString("base64");

  return {
    mediaType: "image/png",
    base64,
    uint8Array,
  };
}

export async function generateVisualizationImage(
  params: GenerateImageParams,
): Promise<GeneratedImage> {
  // Build the prompt based on light conditions and edit description
  let prompt =
    "Turn this Sketchup render into a realistic 3D visualization with full lighting";

  // Inject project style notes for visual consistency across scenes
  if (params.styleNotes) {
    prompt += `\n\nIMPORTANT - Match this project style precisely:\n${params.styleNotes}`;
  }

  // Handle outdoor lighting
  if (params.outdoorLight === "sunny") {
    prompt += ", with sunny outdoor light";
  } else if (params.outdoorLight === "overcast") {
    prompt += ", with overcast outdoor light";
  } else if (params.outdoorLight === "night") {
    prompt += ", with night-time outdoor light";
  } else if (params.outdoorLight) {
    // Custom outdoor lighting description
    prompt += `, with outdoor light as follows: ${params.outdoorLight}`;
  }

  // Handle indoor lighting
  if (params.indoorLight === "all_off") {
    prompt += ", all indoor lights are off";
  } else if (params.indoorLight === "all_on") {
    prompt += ", all visible indoor lights are on";
  } else if (params.indoorLight) {
    // Custom indoor lighting description
    prompt += `, with indoor lighting as follows: ${params.indoorLight}`;
  }
  prompt +=
    ".\nIf shadows are present, keep them and use the same light direction. Use the last image of the first message as the base. Only make the image photo-realistic and high-resolution, without changing any of the details (unless the user asks otherwise).";

  if (params.editDescription) {
    prompt += `\n\nSpecific requests from the user:\n${params.editDescription}`;
  }

  // Add reference to provided reference images
  if (params.referenceImages && params.referenceImages.length > 0) {
    prompt += `\n\nUse the reference image${
      params.referenceImages.length > 1 ? "s" : ""
    } provided for materials, textures, and style`;
  }

  return generateImageFromPrompt(params, prompt);
}

/**
 * Generate an iteration of an existing visualization.
 * Unlike generateVisualizationImage, this doesn't include the "Turn this SketchUp render..." prompt,
 * as the input is already a visualization that needs refinement.
 */
export async function generateIterationImage(
  params: GenerateImageParams,
): Promise<GeneratedImage> {
  // Build the prompt for iteration - no "Turn this SketchUp render" prefix
  let prompt =
    "Refine this visualization based on the user's feedback. Preserve the overall style, perspective, and composition unless specifically asked to change them.";

  // Inject project style notes for visual consistency across scenes
  if (params.styleNotes) {
    prompt += `\n\nIMPORTANT - Match this project style precisely:\n${params.styleNotes}`;
  }

  // Handle outdoor lighting
  if (params.outdoorLight === "sunny") {
    prompt += " Apply sunny outdoor lighting.";
  } else if (params.outdoorLight === "overcast") {
    prompt += " Apply overcast outdoor lighting.";
  } else if (params.outdoorLight === "night") {
    prompt += " Apply night-time outdoor lighting.";
  } else if (params.outdoorLight) {
    prompt += ` Apply outdoor lighting as follows: ${params.outdoorLight}.`;
  }

  // Handle indoor lighting
  if (params.indoorLight === "all_off") {
    prompt += " All indoor lights should be off.";
  } else if (params.indoorLight === "all_on") {
    prompt += " All visible indoor lights should be on.";
  } else if (params.indoorLight) {
    prompt += ` Make the indoor lighting as follows: ${params.indoorLight}.`;
  }

  if (params.editDescription) {
    prompt += `\n\nUser's specific requests:\n${params.editDescription}\n\n`;
  }

  // Add reference to provided reference images
  if (params.referenceImages && params.referenceImages.length > 0) {
    prompt += `\n\nUse the reference image${
      params.referenceImages.length > 1 ? "s" : ""
    } provided for materials, textures, and style.`;
  }

  return generateImageFromPrompt(params, prompt);
}

export async function cleanUpEditDescription(params: {
  editDescription: string;
  userId: string;
  traceId: string;
}): Promise<string> {
  if (process.env.SKIP_AI === "1") {
    return params.editDescription;
  }
  let model = googleClient.languageModel("gemini-2.5-flash-lite");
  if (posthogNode) {
    model = withTracing(model, posthogNode, {
      posthogDistinctId: params.userId,
      posthogTraceId: params.traceId,
    });
  }
  const prompt = `
Polish the following description of changes to an image that were requested by the user, so that we have a clear list of bullet points in English:
<user_request>
${params.editDescription}
</user_request>

Notes: If the user said "this" or "that", they're likely referring to the image they're editing, or their reference images.
Output ONLY the final list of clear and actionable bullet points.
`.trim();
  const result = await generateText({
    model,
    prompt: [
      {
        role: "user",
        content: [{ type: "text", text: prompt }],
      },
    ],
  });
  return result.text;
}

const STYLE_EXTRACTION_PROMPT = `
Analyze this photorealistic architectural visualization. Write a detailed style guide that will be used to ensure visual consistency when generating visualizations of OTHER rooms/spaces in the same project.

Describe in clear, instructive language (as if directing an AI image generator):

MATERIALS & SURFACES: Every distinct material visible - wood grain direction/tone, stone texture/finish, metal treatment (brushed/polished/matte), fabric weave, paint finish, floor/wall/ceiling materials. Specify how exactly to map the raw SketchUp image's materials to the photorealistic visualization's materials.

LIGHTING QUALITY: Overall light character - color temperature, contrast level, shadow softness, ambient fill, any color cast or atmospheric haze. Where the light is coming from, and how it's distributed.

COLOR PALETTE: Dominant and accent colors. Overall warmth/coolness.

RENDERING STYLE: Photographic quality - depth of field, contrast curve, saturation level, any post-processing aesthetic.

MOOD: One sentence capturing the overall feeling and design style.

Write concisely but precisely. Do not specify "left" or "right", as other scenes might be from different perspectives or rooms. Focus on reproducible visual details and be specific.
`.trim();

export async function extractStyleNotes(params: {
  preImageBuffer: Buffer;
  postImageBuffer: Buffer;
  preMediaType: string;
  postMediaType: string;
  userId: string;
  traceId: string;
}): Promise<string> {
  if (process.env.SKIP_AI === "1") {
    return "Test style notes: warm wood tones, soft ambient lighting, modern minimalist aesthetic.";
  }
  let model = googleClient.languageModel("gemini-3-pro-preview");
  if (posthogNode) {
    model = withTracing(model, posthogNode, {
      posthogDistinctId: params.userId,
      posthogTraceId: params.traceId,
    });
  }
  const result = await generateText({
    model,
    prompt: [
      {
        role: "user",
        content: [
          { type: "text", text: STYLE_EXTRACTION_PROMPT },
          {
            type: "file",
            data: params.preImageBuffer,
            mediaType: params.preMediaType,
          },
          {
            type: "file",
            data: params.postImageBuffer,
            mediaType: params.postMediaType,
          },
        ],
      },
    ],
  });
  return result.text;
}

export async function titleVisualizationImage(params: {
  buffer: Buffer;
  mediaType: string;
  userId: string;
  traceId: string;
}): Promise<string> {
  if (process.env.SKIP_AI === "1") {
    return "Octocat Test";
  }
  let model = googleClient.languageModel("gemini-flash-lite-latest");
  if (posthogNode) {
    model = withTracing(model, posthogNode, {
      posthogDistinctId: params.userId,
    });
  }
  const result = await generateText({
    model,
    prompt: [
      {
        role: "user",
        content: [
          { type: "text", text: IMAGE_DESCRIPTION_PROMPT },
          {
            type: "file",
            data: params.buffer,
            mediaType: params.mediaType,
          },
        ],
      },
    ],
  });
  return result.text;
}
