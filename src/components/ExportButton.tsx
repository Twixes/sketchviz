import { CheckIcon, DownloadIcon } from "@radix-ui/react-icons";
import posthog from "posthog-js";
import { useState } from "react";
import { Button } from "@/lib/components/ui/Button";

interface ExportButtonProps {
  imageUrl: string;
  filename: string;
}

function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  return lastDot !== -1 ? filename.slice(lastDot + 1).toLowerCase() : "png";
}

function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
  };
  return mimeTypes[extension] || "image/png";
}

async function saveWithFilePicker(
  blob: Blob,
  filename: string,
): Promise<boolean> {
  if (!("showSaveFilePicker" in window)) {
    return false;
  }

  const extension = getFileExtension(filename);
  const mimeType = getMimeType(extension);

  try {
    const handle = await window.showSaveFilePicker!({
      suggestedName: filename,
      types: [
        {
          description: "Image",
          accept: { [mimeType]: [`.${extension}`] },
        },
      ],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return true;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled the picker
      return true;
    }
    return false;
  }
}

function saveWithFallback(blob: Blob, filename: string): void {
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(blobUrl);
}

export function ExportButton({ imageUrl, filename }: ExportButtonProps) {
  const [isCompleted, setIsCompleted] = useState(false);

  const handleExport = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();

      const usedFilePicker = await saveWithFilePicker(blob, filename);
      if (!usedFilePicker) {
        saveWithFallback(blob, filename);
      }

      posthog.capture("image_exported", {
        filename,
        file_size: blob.size,
        used_file_picker: usedFilePicker,
      });

      setIsCompleted(true);
      setTimeout(() => setIsCompleted(false), 2000);
    } catch (error) {
      console.error("Failed to export image:", error);
      posthog.capture("image_export_failed", {
        filename,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      leftIcon={
        isCompleted ? (
          <CheckIcon className="w-3 h-3" />
        ) : (
          <DownloadIcon className="w-3 h-3" />
        )
      }
      onClick={handleExport}
      tooltip={
        <>
          Export as: <strong>{filename}</strong>
        </>
      }
    >
      Export
    </Button>
  );
}
