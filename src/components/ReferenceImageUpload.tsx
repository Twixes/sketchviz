import { Cross2Icon, ImageIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import type { ReferenceImage } from "@/stores/upload-store";
import { useUploadStore } from "@/stores/upload-store";

interface ReferenceImageUploadProps {
  disabled?: boolean;
}

export function ReferenceImageUpload({ disabled }: ReferenceImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    referenceImages,
    addReferenceImage,
    updateReferenceImageBlobUrl,
    removeReferenceImage,
  } = useUploadStore();
  const uploadMutation = useReferenceUploadMutation();
  const [fullViewImage, setFullViewImage] = useState<ReferenceImage | null>(
    null,
  );

  const handleFileSelect = async (file: File) => {
    if (referenceImages.length >= 3) {
      return;
    }

    // Create local preview immediately
    const localSrc = URL.createObjectURL(file);

    // Add to store with null blobUrl (loading state)
    const imageIndex = referenceImages.length;
    addReferenceImage(localSrc, null);

    try {
      // Upload to Vercel Blob
      const blobUrl = await uploadMutation.mutateAsync({ file });

      // Update the blobUrl once upload completes
      updateReferenceImageBlobUrl(imageIndex, blobUrl);
    } catch (error) {
      console.error("Failed to upload reference image:", error);
      // Remove the failed upload
      removeReferenceImage(imageIndex);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      void handleFileSelect(file);
    }
    // Reset input so the same file can be selected again
    e.target.value = "";
  };

  const canAddMore = referenceImages.length < 3;

  return (
    <>
      <div
        className={clsx(
          "absolute bottom-2 left-2 right-2 flex items-center gap-2 flex-wrap",
          referenceImages.length > 0 && "px-1 pb-1",
        )}
      >
        {referenceImages.map((refImage, index) => (
          <ReferenceImagePreview
            key={refImage.localSrc}
            image={refImage}
            onRemove={() => removeReferenceImage(index)}
            onClick={() => setFullViewImage(refImage)}
          />
        ))}

        {canAddMore && (
          <>
            <button
              type="button"
              onClick={handleButtonClick}
              disabled={disabled}
              className={clsx([
                "flex items-center gap-1.5 rounded-lg border border-black/20 bg-white px-2 py-1 text-xs font-medium transition-all",
                disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-black/40 hover:bg-black/5",
              ])}
            >
              <ImageIcon className="h-3.5 w-3.5" />
              Add reference image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </>
        )}
      </div>

      {fullViewImage && (
        <ImageModal
          image={fullViewImage}
          onClose={() => setFullViewImage(null)}
        />
      )}
    </>
  );
}

interface ReferenceImagePreviewProps {
  image: ReferenceImage;
  onRemove: () => void;
  onClick: () => void;
}

function ReferenceImagePreview({
  image,
  onRemove,
  onClick,
}: ReferenceImagePreviewProps) {
  const isUploading = image.blobUrl === null;

  return (
    <div className="relative group">
      <div className="relative flex">
        <button
          type="button"
          onClick={onClick}
          className="size-16 rounded-lg border border-black/20 overflow-hidden relative cursor-zoom-in transition-all hover:ring-2 hover:ring-black/30 hover:ring-offset-1"
          aria-label="View reference image full size"
        >
          <img
            src={image.localSrc}
            alt="Reference"
            className="size-full object-cover"
          />
        </button>
        <div
          className="absolute transition-all rounded-[11px] pointer-events-none"
          style={{
            background: `conic-gradient(from var(--ring-rotation), #000 0deg, #000 144deg, transparent 144deg)`,
            inset: isUploading ? "-3px" : "0px",
            padding: isUploading ? "3px" : "0px",
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            animation: "var(--animate-ring-spin)",
          }}
        />
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -right-1.5 -top-1.5 rounded-full bg-black text-white p-0.5 opacity-0 group-hover:opacity-100 cursor-pointer"
        aria-label="Remove reference image"
      >
        <Cross2Icon className="h-3 w-3" />
      </button>
    </div>
  );
}

interface ImageModalProps {
  image: ReferenceImage;
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur p-4">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white text-black p-2 hover:bg-white/90 transition-colors"
        aria-label="Close full view"
      >
        <Cross2Icon className="h-5 w-5" />
      </button>
      <div className="max-w-[90vw] max-h-[90vh] relative">
        <img
          src={image.localSrc}
          alt="Reference full view"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>,
    document.body,
  );
}
