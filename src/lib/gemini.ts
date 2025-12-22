import { google } from "@ai-sdk/google";

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
  outsideLightConditions?: "sunny" | "overcast" | null;
}): Promise<GeneratedImage> {
  // Build the prompt based on light conditions
  let prompt = BASE_PROMPT;
  if (params.outsideLightConditions === "sunny") {
    prompt += " with sunny outdoor lighting";
  } else if (params.outsideLightConditions === "overcast") {
    prompt += " with overcast outdoor lighting";
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
