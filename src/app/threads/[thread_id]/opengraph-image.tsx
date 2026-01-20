import { createClient } from "@supabase/supabase-js";
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SketchViz thread preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ thread_id: string }>;
}) {
  const { thread_id: threadId } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  );

  const { data: thread } = await supabase
    .from("threads")
    .select("generations(output_url, created_at)")
    .eq("id", threadId)
    .single();

  const latestGeneration = thread?.generations?.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];

  return new ImageResponse(
    latestGeneration?.output_url ? (
      // biome-ignore lint/performance/noImgElement: ImageResponse requires img
      <img
        src={latestGeneration.output_url}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    ) : (
      <div style={{ width: "100%", height: "100%", background: "#1a1a1a" }} />
    ),
    size,
  );
}
