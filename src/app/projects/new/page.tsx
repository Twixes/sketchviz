"use client";

import { redirect } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { ProjectCreationWizard } from "./ProjectCreationWizard";

export default function NewProjectPage() {
  const { user } = useSession();

  if (!user) {
    redirect("/");
  }

  return <ProjectCreationWizard user={user} />;
}
