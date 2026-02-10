import { NextResponse } from "next/server";
import { titleVisualizationImage } from "@/lib/ai";
import { posthogNode } from "@/lib/posthog/server";
import { addScenesSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { downloadFile, parseStorageUrl } from "@/lib/supabase/storage";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> },
) {
  const { project_id: projectId } = await params;

  const body = await request.json();
  const validation = addScenesSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const { input_urls } = validation.data;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Verify project ownership
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, user_id, style_notes")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (project.user_id !== userId) {
    return NextResponse.json(
      { error: "You don't have permission to modify this project" },
      { status: 403 },
    );
  }

  // Create thread records
  const threadInserts = input_urls.map((url) => ({
    user_id: userId,
    title: "",
    input_url: url,
    project_id: projectId,
  }));

  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .insert(threadInserts)
    .select("id, input_url");

  if (threadsError) {
    console.error("Failed to create scene threads:", threadsError);
    return NextResponse.json(
      { error: "Failed to create scene threads" },
      { status: 500 },
    );
  }

  // Generate titles in background
  for (const thread of threads) {
    generateThreadTitle(supabase, thread, userId).catch((err) =>
      console.error(`Failed to title thread ${thread.id}:`, err),
    );
  }

  posthogNode?.capture({
    distinctId: userId,
    event: "project_scenes_added",
    properties: {
      project_id: projectId,
      scene_count: input_urls.length,
    },
  });

  return NextResponse.json({
    threads: threads.map((t) => ({ id: t.id, input_url: t.input_url })),
    has_style: !!project.style_notes,
  });
}

async function generateThreadTitle(
  supabase: ReturnType<typeof createClient> extends Promise<infer T>
    ? T
    : never,
  thread: { id: string; input_url: string },
  userId: string,
) {
  const parsed = parseStorageUrl(thread.input_url);
  if (!parsed) return;

  const blob = await downloadFile({
    supabase,
    bucket: parsed.bucket as "input-images",
    path: parsed.path,
  });
  const buffer = Buffer.from(await blob.arrayBuffer());
  const title = await titleVisualizationImage({
    buffer,
    mediaType: blob.type,
    userId,
    traceId: crypto.randomUUID(),
  });
  await supabase.from("threads").update({ title }).eq("id", thread.id);
}
