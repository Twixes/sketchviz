import { google } from "@ai-sdk/google";
import type { IndoorLight, OutdoorLight } from "./schemas";

const MODEL_ID = "gemini-3-pro-image-preview";
const BASE_PROMPT =
  "Turn this Sketchup render into a realistic 3D visualization with full lighting";

type GeneratedImage = {
  data: string;
  mediaType: string;
};

export async function generateVisualizationImage(params: {
  base64Data: string;
  mediaType: string;
  filename?: string;
  outdoorLight?: OutdoorLight;
  indoorLight?: IndoorLight;
  editDescription?: string | null;
}): Promise<GeneratedImage> {
  // Build the prompt based on light conditions and edit description
  let prompt = BASE_PROMPT;

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
  const model = google(MODEL_ID);
  const result = await model.doGenerate({
    prompt: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            data: params.base64Data,
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
    data: imagePart.data,
    mediaType: imagePart.mediaType,
  };
}
