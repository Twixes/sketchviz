"use client";

import { CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { toast } from "sonner";
import { Button } from "@/lib/components/ui/Button";

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
  const queryClient = useQueryClient();

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
      <div className="rounded-xl border border-dashed border-black/20 bg-white/50 p-4 text-center">
        <p className="text-sm text-black/50">
          No style notes yet. Visualize your first scene and accept the style to
          extract notes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-black/10 bg-white/75 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-black">Style Notes</h3>
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
            className="w-full rounded-lg border border-black/20 bg-white px-3 py-2 text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-2 focus:ring-black/20 resize-none"
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
        <p className="text-sm text-black/70 whitespace-pre-wrap">
          {styleNotes}
        </p>
      )}
    </div>
  );
}
