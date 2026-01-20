import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "SketchViz thread preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

interface Props {
  params: Promise<{ thread_id: string }>;
}

export default async function Image({ params }: Props) {
  const { thread_id: threadId } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data: thread } = await supabase
    .from("threads")
    .select(
      `
      generations (
        output_url,
        created_at
      )
    `,
    )
    .eq("id", threadId)
    .single();

  // Get the latest generation's output URL
  const generations = thread?.generations ?? [];
  const latestGeneration = generations.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  const outputUrl = latestGeneration?.output_url;

  // Build icon URL - use VERCEL_URL for preview deployments, production domain otherwise
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://sketchviz.app";
  const iconUrl = `${baseUrl}/icon.png`;

  if (!outputUrl) {
    // Fallback: just show the icon centered
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#1a1a1a",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse requires img */}
        <img src={iconUrl} alt="SketchViz" width={200} height={200} />
      </div>,
      { ...size },
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: ImageResponse requires img */}
      <img
        src={outputUrl}
        alt="Latest generation"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {/* Icon overlay in bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: 24,
          display: "flex",
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: ImageResponse requires img */}
        <img src={iconUrl} alt="SketchViz" width={80} height={80} />
      </div>
    </div>,
    { ...size },
  );
}
