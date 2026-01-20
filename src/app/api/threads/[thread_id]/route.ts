import { NextResponse } from "next/server";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ thread_id: string }> },
) {
  const { thread_id: threadId } = await params;

  // Get user session
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Fetch the thread to verify ownership
  const { data: thread, error: fetchError } = await supabase
    .from("threads")
    .select("id, user_id")
    .eq("id", threadId)
    .single();

  if (fetchError || !thread) {
    return NextResponse.json({ error: "Thread not found" }, { status: 404 });
  }

  // Verify ownership (RLS SELECT is public, so we must check explicitly)
  if (thread.user_id !== userId) {
    return NextResponse.json(
      { error: "You don't have permission to delete this thread" },
      { status: 403 },
    );
  }

  // Delete the thread (generations will cascade delete)
  const { error: deleteError } = await supabase
    .from("threads")
    .delete()
    .eq("id", threadId);

  if (deleteError) {
    console.error("Failed to delete thread:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete thread" },
      { status: 500 },
    );
  }

  // Track successful deletion
  posthogNode.capture({
    distinctId: userId,
    event: "thread_deleted",
    properties: {
      thread_id: threadId,
    },
  });

  return NextResponse.json({ success: true });
}
