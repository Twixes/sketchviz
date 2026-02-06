"use client";

import { CheckIcon, Pencil1Icon } from "@radix-ui/react-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/lib/components/ui/Button";

interface EditableTitleProps {
  threadId: string;
  title: string;
  onTitleChange?: (newTitle: string) => void;
}

export function EditableTitle({
  threadId,
  title,
  onTitleChange,
}: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Sync editValue when title changes externally (e.g. auto-generated title arrives)
  useEffect(() => {
    if (!isEditing) {
      setEditValue(title);
    }
  }, [title, isEditing]);

  const updateMutation = useMutation({
    mutationFn: async (newTitle: string) => {
      const response = await fetch(`/api/threads/${threadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update title");
      }
      return response.json();
    },
    onSuccess: (_data, newTitle) => {
      onTitleChange?.(newTitle);
      queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["recent-threads"] });
    },
  });

  const startEditing = useCallback(() => {
    setIsEditing(true);
    // Focus input after render
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  }, []);

  const saveTitle = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed.length === 0 || trimmed === title) {
      // Revert if empty or unchanged
      setEditValue(title);
      setIsEditing(false);
      return;
    }
    updateMutation.mutate(trimmed);
    setIsEditing(false);
  }, [editValue, title, updateMutation]);

  const cancelEditing = useCallback(() => {
    setEditValue(title);
    setIsEditing(false);
  }, [title]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        saveTitle();
      } else if (e.key === "Escape") {
        e.preventDefault();
        cancelEditing();
      }
    },
    [saveTitle, cancelEditing],
  );

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={saveTitle}
          maxLength={255}
          className="text-2xl lg:text-3xl font-semibold text-black bg-transparent border-b-2 border-black/30 focus:border-black outline-none w-full transition-colors"
        />
        <Button
          variant="icon"
          size="sm"
          colorScheme="light"
          tooltip="Save title"
          onMouseDown={(e) => {
            // Prevent blur from firing before click
            e.preventDefault();
          }}
          onClick={saveTitle}
        >
          <CheckIcon className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2">
      <h1 className="text-2xl lg:text-3xl font-semibold text-black">{title}</h1>
      <Button
        variant="icon"
        size="sm"
        colorScheme="light"
        tooltip="Edit title"
        onClick={startEditing}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil1Icon className="w-4 h-4" />
      </Button>
    </div>
  );
}
