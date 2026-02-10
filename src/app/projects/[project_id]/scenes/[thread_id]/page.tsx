"use client";

import { redirect, useParams, useSearchParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { ProjectSceneView } from "./ProjectSceneView";

export default function ProjectScenePage() {
  const { user } = useSession();
  const { project_id, thread_id } = useParams<{
    project_id: string;
    thread_id: string;
  }>();
  const searchParams = useSearchParams();
  const isSetup = searchParams.get("setup") === "true";

  if (!user) {
    redirect("/");
  }

  return (
    <ProjectSceneView
      projectId={project_id}
      threadId={thread_id}
      isSetupMode={isSetup}
    />
  );
}
