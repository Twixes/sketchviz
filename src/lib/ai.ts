import fs from "node:fs/promises";
import { google } from "@ai-sdk/google";
import { generateText, type LanguageModel } from "ai";
import type { AspectRatio } from "./aspect-ratio";
import {
  DEFAULT_IMAGE_EDITING_MODEL,
  DEFAULT_MODEL_PROVIDER,
} from "./constants";
import type { IndoorLight, Model, OutdoorLight } from "./schemas";

const IMAGE_DESCRIPTION_MODEL = google("gemini-flash-lite-latest");
const IMAGE_DESCRIPTION_PROMPT =
  "Describe this SketchUp render in a brief title. Refer to a matching historical or contemporary style of design if relevant (but you must highlight which elements reflect this style). Output plain text";

type GeneratedImage = {
  base64: string;
  uint8Array: Uint8Array;
  mediaType: string;
};

export async function generateVisualizationImage(params: {
  imageBuffer: Buffer;
  mediaType: string;
  filename?: string;
  outdoorLight?: OutdoorLight;
  indoorLight?: IndoorLight;
  editDescription?: string | null;
  model?: Model;
  referenceImages?: Array<{ buffer: Buffer; mediaType: string }>;
  aspectRatio?: AspectRatio | null;
}): Promise<GeneratedImage> {
  if (process.env.SKIP_AI === "1") {
    const base64 = await fs.readFile(
      `src/test-data/octocat-base64-png.txt`,
      "utf8",
    );
    return {
      mediaType: "image/png",
      base64,
      uint8Array: Buffer.from(base64, "base64"),
    };
  }

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
    prompt += ", all indoor lights are on";
  } else if (params.indoorLight) {
    // Custom indoor lighting description
    prompt += `, with indoor lighting as follows: ${params.indoorLight}`;
  }
  prompt +=
    ". Use the last image of the first message as the base. Preserve the current perspective unless user asks otherwise. Use the other reference images provided for materials, textures, and items to use";

  if (params.editDescription) {
    prompt += `. Specific requests from the user: ${params.editDescription}`;
  }

  // Add reference to provided reference images
  if (params.referenceImages && params.referenceImages.length > 0) {
    prompt += `. Use the reference image${
      params.referenceImages.length > 1 ? "s" : ""
    } provided for materials, textures, and style`;
  }

  // Select the model, stripping the provider prefix (google/)
  const [modelProvider, modelName] = params.model?.split("/") || [
    DEFAULT_MODEL_PROVIDER,
    DEFAULT_IMAGE_EDITING_MODEL,
  ];
  let imageEditingModel: LanguageModel;
  if (modelProvider === "google") {
    imageEditingModel = google(modelName);
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
      imageConfig?: { aspectRatio: string };
    };
  } = {
    google: {
      responseModalities: ["IMAGE"],
    },
  };

  // Only add imageConfig if aspect ratio is specified
  if (params.aspectRatio) {
    providerOptions.google.imageConfig = { aspectRatio: params.aspectRatio };
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

export async function titleVisualizationImage(params: {
  buffer: Buffer;
  mediaType: string;
}): Promise<string> {
  if (process.env.SKIP_AI === "1") {
    return "Octocat Test";
  }
  const result = await generateText({
    model: IMAGE_DESCRIPTION_MODEL,
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
