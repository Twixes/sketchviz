"use client";

import { redirect, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Dashboard } from "@/components/Dashboard";
import { useSession } from "@/components/SessionProvider";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSession();
  const { startNewThread } = useThreadEditorStore();
  const uploadMutation = useUploadMutation();

  const handleFileSelected = useCallback(
    (file: File) => {
      const threadId = startNewThread();
      uploadMutation.mutate({ file });
      router.push(`/threads/${threadId}`);
    },
    [uploadMutation, router, startNewThread],
  );

  // Redirect to home if not logged in
  if (!user) {
    redirect("/");
  }

  return <Dashboard user={user} onFileSelected={handleFileSelected} />;
}
