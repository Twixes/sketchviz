import { NextResponse } from "next/server";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ project_id: string; thread_id: string }> },
) {
  const { project_id: projectId, thread_id: threadId } = await params;

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
    .select("id, user_id")
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

  // Verify thread belongs to this project
  const { data: thread, error: threadError } = await supabase
    .from("threads")
    .select("id, project_id")
    .eq("id", threadId)
    .single();

  if (threadError || !thread) {
    return NextResponse.json({ error: "Scene not found" }, { status: 404 });
  }

  if (thread.project_id !== projectId) {
    return NextResponse.json(
      { error: "Scene does not belong to this project" },
      { status: 400 },
    );
  }

  // Delete the thread (generations cascade)
  const { error: deleteError } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId);

  if (deleteError) {
    console.error("Failed to delete scene:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete scene" },
      { status: 500 },
    );
  }

  posthogNode?.capture({
    distinctId: userId,
    event: "project_scene_removed",
    properties: {
      project_id: projectId,
      thread_id: threadId,
    },
  });

  return NextResponse.json({ success: true });
}
