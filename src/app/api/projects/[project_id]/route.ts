import { NextResponse } from "next/server";
import { posthogNode } from "@/lib/posthog/server";
import { updateProjectSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ project_id: string }> },
) {
  const { project_id: projectId } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: project, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      style_notes,
      style_source_generation_id,
      reference_image_urls,
      created_at,
      updated_at,
      threads (
        id,
        title,
        input_url,
        created_at,
        generations (
          id,
          output_url,
          user_params,
          width,
          height,
          created_at
        )
      )
    `,
    )
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Sort threads by created_at, and each thread's generations by created_at
  const threads = (project.threads || [])
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    .map((thread) => {
      const generations = (thread.generations || []).sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const latestGeneration = generations[generations.length - 1] || null;
      return {
        ...thread,
        generations,
        latest_generation: latestGeneration,
      };
    });

  return NextResponse.json({
    project: {
      ...project,
      threads,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> },
) {
  const { project_id: projectId } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const body = await request.json();
  const validation = updateProjectSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  // Verify ownership (RLS handles this, but let's be explicit)
  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.user_id !== userId) {
    return NextResponse.json(
      { error: "You don't have permission to update this project" },
      { status: 403 },
    );
  }

  const updateData: Record<string, unknown> = {};
  if (validation.data.title !== undefined)
    updateData.title = validation.data.title;
  if (validation.data.style_notes !== undefined)
    updateData.style_notes = validation.data.style_notes;
  if (validation.data.reference_image_urls !== undefined)
    updateData.reference_image_urls = validation.data.reference_image_urls;
  const { error: updateError } = await supabase
    .from("projects")
    .update(updateData)
    .eq("id", projectId);

  if (updateError) {
    console.error("Failed to update project:", updateError);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 },
    );
  }

  posthogNode?.capture({
    distinctId: userId,
    event: "project_updated",
    properties: {
      project_id: projectId,
      updated_fields: Object.keys(updateData),
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ project_id: string }> },
) {
  const { project_id: projectId } = await params;

  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getClaims();
  const userId = authData?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: existing, error: fetchError } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (existing.user_id !== userId) {
    return NextResponse.json(
      { error: "You don't have permission to delete this project" },
      { status: 403 },
    );
  }

  const { error: deleteError } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (deleteError) {
    console.error("Failed to delete project:", deleteError);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 },
    );
  }

  posthogNode?.capture({
    distinctId: userId,
    event: "project_deleted",
    properties: { project_id: projectId },
  });

  return NextResponse.json({ success: true });
}
