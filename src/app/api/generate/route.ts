import { NextResponse } from "next/server";
import { del } from "@vercel/blob";

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
  const body = await request.json();
  const { blobUrl, outside_light_conditions } = body;

  if (!blobUrl || typeof blobUrl !== "string") {
    return NextResponse.json(
      { error: "Missing blob URL." },
      { status: 400 },
    );
  }

  // Validate outside_light_conditions if provided
  if (
    outside_light_conditions !== undefined &&
    outside_light_conditions !== null &&
    outside_light_conditions !== "sunny" &&
    outside_light_conditions !== "overcast"
  ) {
    return NextResponse.json(
      { error: "Invalid outside_light_conditions. Must be 'sunny', 'overcast', or null." },
      { status: 400 },
    );
  }

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

    if (contentLength && parseInt(contentLength) > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 20MB." },
        { status: 413 },
      );
    }

    const arrayBuffer = await blobResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    // Extract filename from URL
    const filename = blobUrl.split("/").pop()?.split("?")[0] || "sketchup-render";

    const result = await generateVisualizationImage({
      base64Data,
      mediaType: contentType,
      filename,
      outsideLightConditions: outside_light_conditions,
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
