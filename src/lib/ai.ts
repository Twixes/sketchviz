import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { withTracing } from "@posthog/ai";
import { generateText, type LanguageModel } from "ai";
import sharp from "sharp";
import type { AspectRatio } from "./aspect-ratio";
import { posthogNode } from "./posthog/server";
import type { IndoorLight, Model, OutdoorLight } from "./schemas";

const googleClient = createGoogleGenerativeAI();

const IMAGE_DESCRIPTION_PROMPT =
  "Describe this SketchUp render in a brief title. Refer to a matching historical or contemporary style of design if relevant (but you must highlight which elements reflect this style). Output plain text";

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
  model: Model;
  referenceImages?: Array<{ buffer: Buffer; mediaType: string }>;
  aspectRatio?: AspectRatio | null;
  userId: string;
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

  // Select the model, stripping the provider prefix (google/)
  // Also extract imageSize from model name if present (e.g., "gemini-3-pro-image-preview/4k" -> "4k")
  const [modelProvider, modelName, imageSizeFromModel] =
    params.model.split("/");

  let imageEditingModel: LanguageModel;
  if (modelProvider === "google") {
    imageEditingModel = withTracing(
      googleClient.languageModel(modelName),
      posthogNode,
      {
        posthogDistinctId: params.userId,
      },
    );
  } else {
    throw new Error(`Unsupported model provider: ${modelProvider}`);
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

  // Only add imageSize for pro models (flash model doesn't support it)
  const isProModel = params.model.startsWith(
    "google/gemini-3-pro-image-preview",
  );
  if (isProModel) {
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

export async function generateVisualizationImage(
  params: GenerateImageParams,
): Promise<GeneratedImage> {
  // Build the prompt based on light conditions and edit description
  let prompt =
    "Turn this Sketchup render into a realistic 3D visualization with full lighting";
  // Handle outdoor lighting
  if (params.outdoorLight === "sunny") {
    prompt += " with sunny outdoor light";
  } else if (params.outdoorLight === "overcast") {
    prompt += " with overcast outdoor light";
  } else if (params.outdoorLight === "night") {
    prompt += " with night-time outdoor light";
  } else if (params.outdoorLight) {
    // Custom outdoor lighting description
    prompt += ` with outdoor light as follows: ${params.outdoorLight}`;
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
    ". Use the last image of the first message as the base. Preserve the current perspective unless user asks otherwise";

  if (params.editDescription) {
    prompt += `. Specific requests from the user: ${params.editDescription}`;
  }

  // Add reference to provided reference images
  if (params.referenceImages && params.referenceImages.length > 0) {
    prompt += `. Use the reference image${
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
    "Refine this visualization based on the user's feedback. Preserve the overall style, perspective, and composition unless specifically asked to change them";

  // Handle outdoor lighting
  if (params.outdoorLight === "sunny") {
    prompt += ". Apply sunny outdoor lighting";
  } else if (params.outdoorLight === "overcast") {
    prompt += ". Apply overcast outdoor lighting";
  } else if (params.outdoorLight === "night") {
    prompt += ". Apply night-time outdoor lighting";
  } else if (params.outdoorLight) {
    prompt += `. Apply outdoor lighting as follows: ${params.outdoorLight}`;
  }

  // Handle indoor lighting
  if (params.indoorLight === "all_off") {
    prompt += ", all indoor lights should be off";
  } else if (params.indoorLight === "all_on") {
    prompt += ", all visible indoor lights should be on";
  } else if (params.indoorLight) {
    prompt += `, with indoor lighting as follows: ${params.indoorLight}`;
  }

  if (params.editDescription) {
    prompt += `. User's specific requests: ${params.editDescription}`;
  }

  // Add reference to provided reference images
  if (params.referenceImages && params.referenceImages.length > 0) {
    prompt += `. Use the reference image${
      params.referenceImages.length > 1 ? "s" : ""
    } provided for materials, textures, and style`;
  }

  return generateImageFromPrompt(params, prompt);
}

export async function titleVisualizationImage(params: {
  buffer: Buffer;
  mediaType: string;
  userId: string;
}): Promise<string> {
  if (process.env.SKIP_AI === "1") {
    return "Octocat Test";
  }
  const model = withTracing(
    googleClient.languageModel("gemini-flash-lite-latest"),
    posthogNode,
    {
      posthogDistinctId: params.userId,
    },
  );
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
