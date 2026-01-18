"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useSignedUrl } from "@/hooks/use-signed-url";

export interface ThreadData {
  id: string;
  title: string;
  created_at: string;
  generation_count: number;
  latest_generation: {
    output_url: string | null;
    input_url: string;
  } | null;
}

interface ThreadCardProps {
  thread: ThreadData;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  // Get the image URL (prefer output, fallback to input)
  const imageUrl =
    thread.latest_generation?.output_url ||
    thread.latest_generation?.input_url ||
    null;

  // Get signed URL for authenticated access
  const signedUrl = useSignedUrl(imageUrl);

  return (
    <Link href={`/threads/${thread.id}`}>
      <motion.div
        key={thread.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-xl border border-black/20 bg-white/75 p-0 text-left transition-all hover:border-black/30 hover:bg-white/90"
      >
        {/* Thumbnail */}
        {thread.latest_generation && signedUrl ? (
          <div className="aspect-video w-full overflow-hidden bg-black/5">
            <img
              src={signedUrl}
              alt={thread.title}
              width={400}
              height={225}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-video w-full items-center justify-center bg-black/5">
            <p className="text-sm text-black/40">No preview</p>
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h2 className="text-lg font-semibold text-black line-clamp-2">
            {thread.title}
          </h2>
          <div className="mt-2 flex items-center gap-3 text-xs text-black/50">
            <span>
              {thread.generation_count}
              {" iteration"}
              {thread.generation_count > 1 ? "s" : ""}
            </span>
            <span>•</span>
            <span>{new Date(thread.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
