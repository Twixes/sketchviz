import { DownloadIcon } from "@radix-ui/react-icons";
import clsx from "clsx";

interface DownloadButtonProps {
  imageUrl: string;
  filename: string;
  isActive: boolean;
}

export function DownloadButton({
  imageUrl,
  filename,
  isActive,
}: DownloadButtonProps) {
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: this must be a div
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => {
        e.stopPropagation();
        handleDownload();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          handleDownload();
        }
      }}
      className={clsx(
        "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium cursor-pointer",
        isActive
          ? "bg-white/80 text-black/70 hover:bg-white hover:text-black"
          : "bg-white/70 text-black/60 hover:bg-white/90 hover:text-black/70",
        "backdrop-blur-sm transition-colors",
      )}
    >
      <DownloadIcon className="w-3 h-3" />
      Download
    </div>
  );
}
