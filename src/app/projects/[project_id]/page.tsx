"use client";

import { redirect, useParams } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { ProjectGallery } from "./ProjectGallery";

export default function ProjectPage() {
  const { user } = useSession();
  const { project_id } = useParams<{ project_id: string }>();

  if (!user) {
    redirect("/");
  }

  return <ProjectGallery projectId={project_id} user={user} />;
}
