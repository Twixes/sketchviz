"use client";

import { redirect, useRouter } from "next/navigation";
import { useCallback } from "react";
import { uuidv7 } from "uuidv7";
import { Dashboard } from "@/components/Dashboard";
import { useSession } from "@/components/SessionProvider";
import { useUploadMutation } from "@/hooks/use-upload-mutation";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useSession();
  const { setTentativeThreadId, reset } = useThreadEditorStore();
  const uploadMutation = useUploadMutation();

  const handleFileSelected = useCallback(
    (file: File) => {
      const threadId = uuidv7();
      reset();
      setTentativeThreadId(threadId);
      uploadMutation.mutate({ file });
      router.push(`/threads/${threadId}`);
    },
    [uploadMutation, router, setTentativeThreadId, reset],
  );

  // Redirect to home if not logged in
  if (!user) {
    redirect("/");
  }

  return <Dashboard user={user} onFileSelected={handleFileSelected} />;
}
