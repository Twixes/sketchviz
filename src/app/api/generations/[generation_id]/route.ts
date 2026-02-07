import { NextResponse } from "next/server";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ generation_id: string }> },
) {
  const { generation_id: generationId } = await params;

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

  // Fetch the generation with its thread to verify ownership
  const { data: generation, error: fetchError } = await supabase
    .from("generations")
    .select(
      `
      id,
      thread_id,
      threads!inner (
        id,
        user_id
      )
    `,
    )
    .eq("id", generationId)
    .single();

  if (fetchError || !generation) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 },
    );
  }

  // Verify ownership (RLS SELECT is public, so we must check explicitly)
  const thread = generation.threads as unknown as { user_id: string };
  if (thread.user_id !== userId) {
    return NextResponse.json(
      { error: "You don't have permission to delete this generation" },
      { status: 403 },
    );
  }

  const threadId = generation.thread_id;

  // Delete the generation
  const { error: deleteError } = await supabase
    .from("generations")
    .delete()
    .eq("id", generationId);

  if (deleteError) {
    console.error("Failed to delete generation:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete generation" },
      { status: 500 },
    );
  }

  // Track successful deletion
  posthogNode?.capture({
    distinctId: userId,
    event: "generation_deleted",
    properties: {
      thread_id: threadId,
      generation_id: generationId,
    },
  });

  return NextResponse.json({ success: true });
}
