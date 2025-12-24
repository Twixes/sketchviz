import fs from "node:fs/promises";
import { google } from "@ai-sdk/google";
import { generateImage, generateText, ImageModel, LanguageModel } from "ai";
import type { IndoorLight, OutdoorLight } from "./schemas";

const IMAGE_EDITING_MODEL = google("gemini-3-pro-image-preview");
const IMAGE_EDITING_BASE_PROMPT =
  "Turn this Sketchup render into a realistic 3D visualization with full lighting";

const IMAGE_DESCRIPTION_MODEL = google("gemini-flash-lite-latest");
const IMAGE_DESCRIPTION_PROMPT =
  "Describe this SketchUp render in a brief title. Refer to a matching historical or contemporary style of design if relevant. Output plain text";

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
  let prompt = IMAGE_EDITING_BASE_PROMPT;
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

  if (params.editDescription) {
    prompt += `. ${params.editDescription}`;
  }
  const result = await IMAGE_EDITING_MODEL.doGenerate({
    prompt: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            data: params.imageBuffer,
            mediaType: params.mediaType,
            filename: params.filename,
          },
        ],
      },
    ],
    providerOptions: {
      google: {
        responseModalities: ["IMAGE"],
      },
    },
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
