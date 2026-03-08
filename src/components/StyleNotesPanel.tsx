"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Pencil1Icon,
} from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import Markdown from "react-markdown";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { Button } from "@/lib/components/ui/Button";

const COLLAPSED_MAX_HEIGHT = 280; // ~15 lines of text

interface StyleNotesPanelProps {
  projectId: string;
  styleNotes: string | null;
}

export function StyleNotesPanel({
  projectId,
  styleNotes,
}: StyleNotesPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(styleNotes || "");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const checkOverflow = (node: HTMLDivElement | null) => {
    contentRef.current = node;
    if (node) {
      setIsOverflowing(node.scrollHeight > COLLAPSED_MAX_HEIGHT);
    }
  };

  const updateMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ style_notes: notes }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update style notes");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setIsEditing(false);
      toast.success("Style notes updated");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update");
    },
  });

  if (!styleNotes && !isEditing) {
    return (
      <div className="rounded-lg border border-dashed border-black/20 bg-white/50 p-4 text-center">
        <p className="text-sm text-black/50">
          No style notes yet. Visualize your first scene and accept the style to
          extract notes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white/75 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black">Style notes</h3>
        {!isEditing && (
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Pencil1Icon />}
            onClick={() => {
              setEditValue(styleNotes || "");
              setIsEditing(true);
            }}
          >
            Edit
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <TextareaAutosize
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            minRows={4}
            className="w-full bg-transparent px-0 py-0 text-sm text-black placeholder:text-black/40 focus:outline-none resize-none"
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<CheckIcon />}
              onClick={() => updateMutation.mutate(editValue)}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div
            ref={checkOverflow}
            className="relative overflow-hidden"
            style={
              !isExpanded && isOverflowing
                ? { maxHeight: COLLAPSED_MAX_HEIGHT }
                : undefined
            }
          >
            <div
              className="prose prose-sm prose-neutral max-w-none
                prose-headings:font-semibold prose-headings:tracking-tight
                prose-h1:text-lg prose-h1:mb-3 prose-h1:mt-4 first:prose-h1:mt-0
                prose-h2:text-base prose-h2:mb-2 prose-h2:mt-3 first:prose-h2:mt-0
                prose-h3:text-sm prose-h3:mb-1.5 prose-h3:mt-2.5 first:prose-h3:mt-0
                prose-p:text-sm prose-p:leading-6 prose-p:mb-2 prose-p:text-black/70
                prose-ul:my-2 prose-ul:list-disc prose-ul:pl-5
                prose-ol:my-2 prose-ol:list-decimal prose-ol:pl-5
                prose-li:mb-1 prose-li:text-sm prose-li:text-black/70
                prose-strong:font-semibold prose-strong:text-black
                prose-code:text-xs prose-code:bg-black/5 prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm"
            >
              <Markdown>{styleNotes}</Markdown>
            </div>
            {!isExpanded && isOverflowing && (
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/75 to-transparent pointer-events-none" />
            )}
          </div>
          {isOverflowing && (
            <button
              type="button"
              className="mt-2 flex items-center gap-1 text-xs font-medium text-black/50 hover:text-black/70 transition-colors cursor-pointer"
              onClick={() => setIsExpanded((prev) => !prev)}
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon className="size-3.5" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="size-3.5" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
