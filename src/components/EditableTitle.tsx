"use client";

import { CheckIcon, Cross2Icon, Pencil1Icon } from "@radix-ui/react-icons";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/lib/components/ui/Button";

interface EditableTitleProps {
  title: string;
  onSave: (newTitle: string) => void;
}

export function EditableTitle({ title, onSave }: EditableTitleProps) {
  const [editValue, setEditValue] = useState<string | null>(null);
  const [inputWidth, setInputWidth] = useState<number>();
  const inputRef = useRef<HTMLInputElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: here, we want to recalc on edit state change
  useLayoutEffect(() => {
    // Measure sizer span and update input width before paint
    if (sizerRef.current) {
      setInputWidth(sizerRef.current.scrollWidth);
    }
  }, [editValue]);

  const startEditing = useCallback(
    (selection?: { start: number; end: number }) => {
      setEditValue(title);
      requestAnimationFrame(() => {
        const input = inputRef.current;
        if (!input) return;
        input.focus();
        if (selection !== undefined) {
          input.setSelectionRange(selection.start, selection.end);
        } else {
          input.select();
        }
      });
    },
    [title],
  );

  const saveTitle = useCallback(() => {
    if (editValue === null) return;
    const trimmed = editValue.trim();
    if (trimmed.length === 0 || trimmed === title) {
      // Revert if empty or unchanged
      setEditValue(null);
      return;
    }
    onSave(trimmed);
    setEditValue(null);
  }, [editValue, title, onSave]);

  const cancelEditing = useCallback(() => setEditValue(null), []);

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

  if (editValue !== null) {
    return (
      <div className="flex w-fit max-w-full items-center gap-2 border-b-2 -mb-0.5 border-black/30 focus-within:border-black">
        <div className="relative flex min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={saveTitle}
            maxLength={255}
            className="text-2xl lg:text-3xl font-semibold text-black bg-transparent outline-none"
            style={{ width: inputWidth }}
          />
          {/* Hidden sizer span to measure text width */}
          <span
            ref={sizerRef}
            className="text-2xl lg:text-3xl font-semibold invisible absolute left-0 top-0 whitespace-pre"
          >
            {editValue || " "}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="icon"
            size="sm"
            colorScheme="dark"
            tooltip="Save"
            onMouseDown={(e) => {
              // Prevent blur from firing before click
              e.preventDefault();
            }}
            onClick={saveTitle}
          >
            <CheckIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="icon"
            size="sm"
            colorScheme="light"
            tooltip="Discard changes"
            onMouseDown={(e) => {
              e.preventDefault();
            }}
            onClick={cancelEditing}
          >
            <Cross2Icon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: we want to allow clicking to start editing
    // biome-ignore lint/a11y/useKeyWithClickEvents: it's okay
    <div
      className="group flex w-fit items-center gap-2 border-b-2 -mb-0.5 border-transparent hover:border-black/30 cursor-text"
      onClick={() => {
        // Use the current text selection if the user dragged across the title
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
          const range = sel.getRangeAt(0);
          startEditing({ start: range.startOffset, end: range.endOffset });
        } else if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          startEditing({ start: range.startOffset, end: range.startOffset });
        } else {
          startEditing();
        }
      }}
    >
      <h1 className="text-2xl lg:text-3xl font-semibold text-black">{title}</h1>
      <Button
        variant="icon"
        size="sm"
        colorScheme="light"
        tooltip="Edit title"
        onClick={() => startEditing()}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Pencil1Icon className="w-4 h-4" />
      </Button>
    </div>
  );
}
