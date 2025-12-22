import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { ACCEPTED_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
import { generateVisualizationImage } from "@/lib/gemini";
import { generateRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();

  // Validate request body with Zod
  const validation = generateRequestSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const { blobUrl, outdoor_light, indoor_light, edit_description } =
    validation.data;

  try {
    // Fetch the file from Vercel Blob
    const blobResponse = await fetch(blobUrl);

    if (!blobResponse.ok) {
      throw new Error("Failed to fetch blob.");
    }

    const contentType = blobResponse.headers.get("content-type");
    const contentLength = blobResponse.headers.get("content-length");

    if (!contentType || !ACCEPTED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        {
          error: "Unsupported image format.",
          supported: ACCEPTED_MIME_TYPES,
        },
        { status: 415 },
      );
    }

    if (contentLength && Number(contentLength) > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 20MB." },
        { status: 413 },
      );
    }

    const arrayBuffer = await blobResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Extract filename from URL
    const filename =
      blobUrl.split("/").pop()?.split("?")[0] || "sketchup-render";

    const result = await generateVisualizationImage({
      base64Data,
      mediaType: contentType,
      filename,
      outdoorLight: outdoor_light,
      indoorLight: indoor_light,
      editDescription: edit_description,
    });

    // Delete the temporary blob after processing
    await del(blobUrl);

    return NextResponse.json({
      outputImage: `data:${result.mediaType};base64,${result.data}`,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate image.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
