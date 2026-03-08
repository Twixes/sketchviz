import { MixerHorizontalIcon, SunIcon } from "@radix-ui/react-icons";
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
import { ResolutionSelector } from "@/components/ResolutionSelector";
import type { AspectRatio } from "@/lib/aspect-ratio";
import type { IndoorLight, Model, OutdoorLight } from "@/lib/schemas";
import type { ReferenceImage } from "@/stores/thread-editor-store";

interface ControlPanelProps {
  variant: "editor";
  outdoorLight: OutdoorLight;
  indoorLight: IndoorLight;
  editDescription: string | null;
  model: Model;
  aspectRatio: AspectRatio | null;
  referenceImages: ReferenceImage[];
  isLoading: boolean;
  disabled?: boolean;
  onOutdoorLightChange: (value: OutdoorLight) => void;
  onIndoorLightChange: (value: IndoorLight) => void;
  onEditDescriptionChange: (value: string | null) => void;
  onModelChange: (value: Model) => void;
  onAspectRatioChange: (value: AspectRatio | null) => void;
  onReferenceImageDrop: (file: File) => Promise<void>;
  onReferenceImageRemove: (index: number) => void;
  onGenerate: () => Promise<void>;
  proOnlyModel?: boolean;
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

  const isDisabled = props.isLoading || props.disabled;

  return (
    <div className="flex flex-wrap gap-x-8 gap-y-4">
      {/* Image parameters section */}
      <fieldset className="flex flex-col gap-2 w-full">
        <legend className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-black/50 mb-1.5">
          <MixerHorizontalIcon className="size-3.5" />
          Parameters
        </legend>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 whitespace-nowrap">
          <AspectRatioSelector
            value={props.aspectRatio}
            onChange={props.onAspectRatioChange}
            hasReferenceImages={props.referenceImages.length > 0}
            model={props.model}
            disabled={isDisabled}
          />
          <ModelSelector
            value={props.model}
            onChange={props.onModelChange}
            disabled={isDisabled}
            proOnly={props.proOnlyModel}
          />
          <ResolutionSelector
            value={props.model}
            onChange={props.onModelChange}
            disabled={isDisabled}
          />
        </div>
      </fieldset>
      {/* Environment section */}
      <fieldset className="flex flex-col gap-2 w-full">
        <legend className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-black/50 mb-1.5">
          <SunIcon className="size-3.5" />
          Environment
        </legend>
        <div className="flex items-center flex-wrap gap-x-4 gap-y-2 whitespace-nowrap">
          <LightSelector
            label="Outdoor light"
            value={props.outdoorLight}
            options={OUTDOOR_LIGHT_OPTIONS}
            onChange={props.onOutdoorLightChange}
            disabled={isDisabled}
          />
          <LightSelector
            label="Indoor lighting"
            value={props.indoorLight}
            options={INDOOR_LIGHT_OPTIONS}
            onChange={props.onIndoorLightChange}
            disabled={isDisabled}
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
            placeholder="Optional: Describe extra changes – be as specific as you can"
            minRows={1}
            disabled={isDisabled}
            className={clsx([
              "w-full rounded-lg border bg-white px-3 pt-2 text-sm text-black placeholder:text-black/40",
              "focus:outline-none focus:ring-2 focus:ring-black/20 resize-none transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              props.referenceImages.length > 0 ? "pb-20" : "pb-10",
              isDraggingOver ? "border-black/60 bg-black/5" : "border-black/20",
            ])}
          />
          {/* Reference images bar */}
          <div
            className={clsx(
              "absolute bottom-2 left-0 right-0 flex items-center gap-2 flex-wrap",
              props.referenceImages.length > 0 ? "px-3 pb-1" : "px-2",
            )}
          >
            <ReferenceImageUpload
              disabled={isDisabled}
              referenceImages={props.referenceImages}
              onFileDrop={props.onReferenceImageDrop}
              onRemove={props.onReferenceImageRemove}
            />
            {!props.model.startsWith("google/gemini-3-pro-image-preview") &&
              (props.editDescription || props.referenceImages.length > 0) && (
                <span className="grow text-right text-xs text-black/50 select-none pointer-events-none">
                  Hint: For targeted changes, Pro quality is most reliable
                </span>
              )}
          </div>
        </div>
      </fieldset>
    </div>
  );
}
