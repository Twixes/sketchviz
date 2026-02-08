import { NextResponse } from "next/server";
import { extractStyleNotes } from "@/lib/ai";
import { posthogNode } from "@/lib/posthog/server";
import { acceptStyleSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { downloadFile, parseStorageUrl } from "@/lib/supabase/storage";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ project_id: string }> },
) {
  const { project_id: projectId } = await params;

  const body = await request.json();
  const validation = acceptStyleSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const { generation_id: generationId } = validation.data;

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

  // Verify generation belongs to a thread in this project
  const { data: generation, error: genError } = await supabase
    .from("generations")
    .select(
      `
      id,
      output_url,
      user_params,
      thread_id,
      threads!inner (
        id,
        project_id
      )
    `,
    )
    .eq("id", generationId)
    .single();

  if (genError || !generation) {
    return NextResponse.json(
      { error: "Generation not found" },
      { status: 404 },
    );
  }

  const thread = Array.isArray(generation.threads)
    ? generation.threads[0]
    : generation.threads;
  if (!thread || thread.project_id !== projectId) {
    return NextResponse.json(
      { error: "Generation does not belong to this project" },
      { status: 400 },
    );
  }

  if (!generation.output_url) {
    return NextResponse.json(
      { error: "Generation has no output image" },
      { status: 400 },
    );
  }

  // Download the generation's output image
  const parsed = parseStorageUrl(generation.output_url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Could not parse output image URL" },
      { status: 500 },
    );
  }

  const blob = await downloadFile({
    supabase,
    bucket: parsed.bucket as "output-images",
    path: parsed.path,
  });
  const buffer = Buffer.from(await blob.arrayBuffer());

  // Extract style notes using AI
  const traceId = crypto.randomUUID();
  const styleNotes = await extractStyleNotes({
    imageBuffer: buffer,
    mediaType: blob.type,
    userId,
    traceId,
  });

  // Update project with style notes and default params
  const { error: updateError } = await supabase
    .from("projects")
    .update({
      style_notes: styleNotes,
      style_source_generation_id: generationId,
    })
    .eq("id", projectId);

  if (updateError) {
    console.error("Failed to update project with style:", updateError);
    return NextResponse.json(
      { error: "Failed to save style notes" },
      { status: 500 },
    );
  }

  posthogNode?.capture({
    distinctId: userId,
    event: "project_style_accepted",
    properties: {
      project_id: projectId,
      generation_id: generationId,
      style_notes_length: styleNotes.length,
    },
  });

  return NextResponse.json({
    style_notes: styleNotes,
  });
}
