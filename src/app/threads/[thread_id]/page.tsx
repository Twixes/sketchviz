import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ThreadView } from "./ThreadView";

interface ThreadDetailPageProps {
  params: Promise<{ thread_id: string }>;
}

export async function generateMetadata({
  params,
}: ThreadDetailPageProps): Promise<Metadata> {
  const { thread_id: threadId } = await params;

  // For new/tentative threads (UUIDs that don't exist yet), use generic title
  const supabase = await createClient();
  const { data: thread } = await supabase
    .from("threads")
    .select("title")
    .eq("id", threadId)
    .single();

  return {
    title: thread?.title ? `${thread.title} • SketchViz` : "ThreSketchVizad",
  };
}

export default async function ThreadDetailPage({
  params,
}: ThreadDetailPageProps) {
  const { thread_id: threadId } = await params;
  return <ThreadView threadId={threadId} />;
}
