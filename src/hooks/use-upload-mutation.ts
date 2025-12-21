import { useMutation } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import { useUploadStore } from "@/stores/upload-store";
import {
  ACCEPTED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
  getAcceptedFormatsString,
} from "@/lib/constants";

interface UploadFileParams {
  file: File;
}

export function useUploadMutation() {
  const { setInputSrc, setOutputSrc, setBlobUrl, setError, setIsUploading } =
    useUploadStore();

  return useMutation({
    mutationFn: async ({ file }: UploadFileParams): Promise<string> => {
      // Validate file type
      if (!ACCEPTED_MIME_TYPES.includes(file.type as any)) {
        throw new Error(
          `Unsupported format. Use ${getAcceptedFormatsString()}.`
        );
      }

      // Validate file size
      if (file.size > MAX_UPLOAD_BYTES) {
        throw new Error(`File too large. Max ${MAX_UPLOAD_MB}MB.`);
      }

      // Upload to Vercel Blob
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });

      return blob.url;
    },

    onMutate: ({ file }) => {
      setError(null);
      setIsUploading(true);

      // Create local object URL for immediate preview
      const objectUrl = URL.createObjectURL(file);
      setInputSrc(objectUrl);
      setOutputSrc(null);
      setBlobUrl(null);
    },

    onSuccess: (blobUrl) => {
      setBlobUrl(blobUrl);
      setIsUploading(false);
    },

    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      setError(message);
      setIsUploading(false);
    },
  });
}
