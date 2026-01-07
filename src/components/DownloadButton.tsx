import { DownloadIcon } from "@radix-ui/react-icons";
import { Button } from "@/lib/components/ui/Button";

interface DownloadButtonProps {
  imageUrl: string;
  filename: string;
}

export function DownloadButton({ imageUrl, filename }: DownloadButtonProps) {
  const handleDownload = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
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
    <Button
      variant="secondary"
      size="sm"
      leftIcon={<DownloadIcon className="w-3 h-3" />}
      onClick={handleDownload}
    >
      Download
    </Button>
  );
}
