import clsx from "clsx";
import { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { AspectRatioSelector } from "@/components/AspectRatioSelector";
import {
  INDOOR_LIGHT_OPTIONS,
  LightSelector,
  OUTDOOR_LIGHT_OPTIONS,
} from "@/components/LightSelector";
import { ModelSelector } from "@/components/ModelSelector";
import { ReferenceImageUpload } from "@/components/ReferenceImageUpload";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";
import type { ReferenceImage } from "@/stores/upload-store";

interface ControlPanelProps {
  variant: "editor";
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  referenceImages: ReferenceImage[];
  isLoading: boolean;
  onOutdoorLightChange: (value: OutdoorLight) => void;
  onIndoorLightChange: (value: IndoorLight) => void;
  onEditDescriptionChange: (value: string | null) => void;
  onModelChange: (value: Model) => void;
  onAspectRatioChange: (value: AspectRatio | null) => void;
  onReferenceImageDrop: (file: File) => Promise<void>;
  onReferenceImageRemove: (index: number) => void;
  onGenerate: () => Promise<void>;
}

export function ControlPanel(props: ControlPanelProps) {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith("image/")) {
      void props.onReferenceImageDrop(file);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          void props.onReferenceImageDrop(file);
        }
        break;
      }
    }
  };

  return (
    <div className="space-y-2">
      {/* Light and Model Selectors */}
      <div className="flex items-center flex-wrap gap-x-4 gap-y-2 whitespace-nowrap *:shrink">
        <LightSelector
          label="Outdoor light"
          value={props.outdoorLight}
          options={OUTDOOR_LIGHT_OPTIONS}
          onChange={props.onOutdoorLightChange}
          disabled={props.isLoading}
        />
        <LightSelector
          label="Indoor lighting"
          value={props.indoorLight}
          options={INDOOR_LIGHT_OPTIONS}
          onChange={props.onIndoorLightChange}
          disabled={props.isLoading}
        />
        <AspectRatioSelector
          value={props.aspectRatio}
          onChange={props.onAspectRatioChange}
          hasReferenceImages={props.referenceImages.length > 0}
          disabled={props.isLoading}
        />
        <ModelSelector
          value={props.model}
          onChange={props.onModelChange}
          disabled={props.isLoading}
        />
      </div>

      {/* Edit Description Textarea */}
      <div className="flex relative">
        <TextareaAutosize
          id="edit-description"
          value={props.editDescription ?? ""}
          onChange={(e) =>
            props.onEditDescriptionChange(e.target.value || null)
          }
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onPaste={handlePaste}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
              e.preventDefault();
              props.onGenerate();
            }
          }}
          placeholder="Describe the changes you want (optional)"
          minRows={1}
          disabled={props.isLoading}
          className={clsx([
            "w-full rounded-xl border bg-white px-3 pt-2 text-sm text-black placeholder:text-black/40",
            "focus:outline-none focus:ring-2 focus:ring-black/20 resize-none transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            props.referenceImages.length > 0 ? "pb-20" : "pb-10",
            isDraggingOver ? "border-black/60 bg-black/5" : "border-black/20",
          ])}
        />
        <ReferenceImageUpload
          disabled={props.isLoading}
          referenceImages={props.referenceImages}
          onFileDrop={props.onReferenceImageDrop}
          onRemove={props.onReferenceImageRemove}
        />
      </div>
    </div>
  );
}
