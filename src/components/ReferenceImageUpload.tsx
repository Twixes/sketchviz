import { Cross2Icon, ImageIcon } from "@radix-ui/react-icons";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useReferenceUploadMutation } from "@/hooks/use-reference-upload-mutation";
import { Button } from "@/lib/components/ui/Button";
import type { ReferenceImage } from "@/stores/thread-editor-store";
import { useThreadEditorStore } from "@/stores/thread-editor-store";

interface ReferenceImageUploadBaseProps {
  disabled?: boolean;
}

interface ReferenceImageUploadInternalProps
  extends ReferenceImageUploadBaseProps {
  // Uses internal useThreadEditorStore
  referenceImages?: undefined;
  onFileDrop?: undefined;
  onRemove?: undefined;
}

interface ReferenceImageUploadExternalProps
  extends ReferenceImageUploadBaseProps {
  // Uses externally provided reference images and callbacks
  referenceImages: ReferenceImage[];
  onFileDrop: (file: File) => Promise<void>;
  onRemove: (index: number) => void;
}

type ReferenceImageUploadProps =
  | ReferenceImageUploadInternalProps
  | ReferenceImageUploadExternalProps;

export function ReferenceImageUpload(props: ReferenceImageUploadProps) {
  const { disabled } = props;
  const isExternalMode = props.referenceImages !== undefined;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const threadEditorStore = useThreadEditorStore();
  const uploadMutation = useReferenceUploadMutation();
  const [fullViewImage, setFullViewImage] = useState<ReferenceImage | null>(
    null,
  );

  // Get reference images from props or store
  const referenceImages = isExternalMode
    ? props.referenceImages
    : threadEditorStore.referenceImages;

  const handleFileSelect = async (file: File) => {
    if (referenceImages.length >= 3) {
      return;
    }

    if (isExternalMode) {
      // External mode: use callback from props
      await props.onFileDrop(file);
    } else {
      // Internal mode: use thread editor store
      const localSrc = URL.createObjectURL(file);
      const imageIndex = referenceImages.length;
      threadEditorStore.addReferenceImage(localSrc, null);

      try {
        const blobUrl = await uploadMutation.mutateAsync({ file });
        threadEditorStore.updateReferenceImageBlobUrl(imageIndex, blobUrl);
      } catch (error) {
        console.error("Failed to upload reference image:", error);
        threadEditorStore.removeReferenceImage(imageIndex);
      }
    }
  };

  const handleRemove = (index: number) => {
    if (isExternalMode) {
      props.onRemove(index);
    } else {
      threadEditorStore.removeReferenceImage(index);
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
          "absolute bottom-2 left-0 mx-2 flex items-center gap-2 flex-wrap",
          referenceImages.length > 0 && "px-1 pb-1",
        )}
      >
        {referenceImages.map((refImage, index) => (
          <ReferenceImagePreview
            key={refImage.localSrc}
            image={refImage}
            onRemove={() => handleRemove(index)}
            onClick={() => setFullViewImage(refImage)}
          />
        ))}

        {canAddMore && (
          <>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleButtonClick}
              disabled={disabled}
              leftIcon={<ImageIcon />}
            >
              Add reference image
            </Button>
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
        <div
          className={clsx(
            "absolute transition-all pointer-events-none",
            isUploading
              ? "-inset-[3px] p-0.5 rounded-[11px]"
              : "inset-0 p-0 rounded-lg",
          )}
          style={{
            background: `conic-gradient(from var(--ring-rotation), #000 0deg, #000 144deg, transparent 144deg)`,
            WebkitMask:
              "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
            maskComposite: "exclude",
            animation: "var(--animate-ring-spin)",
          }}
        />
        <button
          type="button"
          onClick={onClick}
          className="size-16 rounded-lg border border-black/20 overflow-hidden relative cursor-zoom-in transition-all hover:ring-2 hover:ring-black/30 hover:ring-offset-1 cursor-zoom-in"
          aria-label="View reference image full size"
        >
          <img
            src={image.localSrc}
            alt="Reference"
            className="size-full object-cover"
          />
        </button>
      </div>
      <Button
        variant="icon"
        size="sm"
        colorScheme="dark"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -right-1.5 -top-1.5 opacity-0 group-hover:opacity-100"
        aria-label="Remove reference image"
      >
        <Cross2Icon className="h-3 w-3" />
      </Button>
    </div>
  );
}

interface ImageModalProps {
  image: ReferenceImage;
  onClose: () => void;
}

function ImageModal({ image, onClose }: ImageModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop pattern
    // biome-ignore lint/a11y/useKeyWithClickEvents: Keyboard handled via document-level Escape listener
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xl p-4 cursor-pointer"
      onClick={onClose}
    >
      <Button
        variant="icon"
        colorScheme="light"
        onClick={onClose}
        className="absolute right-4 top-4"
        aria-label="Close full view"
      >
        <Cross2Icon className="h-5 w-5" />
      </Button>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Image container needs stopPropagation */}
      <div
        className="max-w-[90vw] max-h-[90vh] relative cursor-default"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <img
          src={image.localSrc}
          alt="Reference full view"
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-xl"
        />
      </div>
    </div>,
    document.body,
  );
}
