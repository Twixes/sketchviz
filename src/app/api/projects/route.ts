import { NextResponse } from "next/server";
import { titleVisualizationImage } from "@/lib/ai";
import { posthogNode } from "@/lib/posthog/server";
import { createProjectSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/server";
import { downloadFile, parseStorageUrl } from "@/lib/supabase/storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json();

  const validation = createProjectSchema.safeParse(body);
  if (!validation.success) {
    const firstError = validation.error.issues[0];
    return NextResponse.json({ error: firstError.message }, { status: 400 });
  }

  const { title, scene_input_urls } = validation.data;

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  // Create project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      title,
    })
    .select("id, title, created_at")
    .single();

  if (projectError) {
    console.error("Failed to create project:", projectError);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 },
    );
  }

  // Create one thread per scene input URL
  const threadInserts = scene_input_urls.map((url) => ({
    user_id: userId,
    title: "",
    input_url: url,
    project_id: project.id,
  }));

  const { data: threads, error: threadsError } = await supabase
    .from("threads")
    .insert(threadInserts)
    .select("id, input_url");

  if (threadsError) {
    console.error("Failed to create scene threads:", threadsError);
    // Clean up: delete the project
    await supabase.from("projects").delete().eq("id", project.id);
    return NextResponse.json(
      { error: "Failed to create scene threads" },
      { status: 500 },
    );
  }

  // Generate titles for each scene thread in the background
  for (const thread of threads) {
    generateThreadTitle(supabase, thread, userId).catch((err) =>
      console.error(`Failed to title thread ${thread.id}:`, err),
    );
  }

  posthogNode?.capture({
    distinctId: userId,
    event: "project_created",
    properties: {
      project_id: project.id,
      scene_count: scene_input_urls.length,
    },
  });

  return NextResponse.json({
    project: {
      id: project.id,
      title: project.title,
      threads: threads.map((t) => ({ id: t.id, input_url: t.input_url })),
    },
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

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      title,
      style_notes,
      created_at,
      threads (
        id,
        generations (
          output_url,
          created_at
        )
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 },
    );
  }

  const result = projects.map((project) => {
    const threads = project.threads || [];
    // Find the latest output URL across all threads/generations
    let latestOutputUrl: string | null = null;
    let latestDate: string | null = null;
    for (const thread of threads) {
      for (const gen of thread.generations || []) {
        if (gen.output_url && (!latestDate || gen.created_at > latestDate)) {
          latestOutputUrl = gen.output_url;
          latestDate = gen.created_at;
        }
      }
    }

    return {
      id: project.id,
      title: project.title,
      style_notes: project.style_notes,
      created_at: project.created_at,
      thread_count: threads.length,
      latest_output_url: latestOutputUrl,
    };
  });

  return NextResponse.json({ projects: result });
}
