"use client";

import { Share1Icon } from "@radix-ui/react-icons";
import posthog from "posthog-js";
import { toast } from "sonner";
import { Button } from "@/lib/components/ui/Button";

interface ShareButtonProps {
  threadId: string;
}

export function ShareButton({ threadId }: ShareButtonProps) {
  const handleShare = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    const shareUrl = `${window.location.origin}/threads/${threadId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Public link copied to clipboard");
      posthog.capture("thread_link_copied", { thread_id: threadId });
    } catch (error) {
      console.error("Failed to copy link:", error);
      toast.error("Failed to copy link");
      posthog.captureException(error);
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<Share1Icon className="w-3 h-3" />}
      onClick={handleShare}
      tooltip="Copy link to clipboard"
    >
      Share
    </Button>
  );
}
