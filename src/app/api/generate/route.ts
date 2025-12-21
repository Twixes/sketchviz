import { NextResponse } from "next/server";

import { generateVisualizationImage } from "@/lib/gemini";

const ACCEPTED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing image upload." },
      { status: 400 },
    );
  }

  if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        error: "Unsupported image format.",
        supported: ACCEPTED_MIME_TYPES,
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "File too large. Max 20MB." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString("base64");

  try {
    const result = await generateVisualizationImage({
      base64Data,
      mediaType: file.type,
      filename: file.name || "sketchup-render",
    });

    return NextResponse.json({
      outputImage: `data:${result.mediaType};base64,${result.data}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
