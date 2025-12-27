import { useMutation } from "@tanstack/react-query";
import { upload } from "@vercel/blob/client";
import posthog from "posthog-js";
import {
  ACCEPTED_MIME_TYPES,
  getAcceptedFormatsString,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/lib/constants";

interface UploadFileParams {
  file: File;
}

export function useReferenceUploadMutation() {
  return useMutation({
    mutationFn: async ({ file }: UploadFileParams): Promise<string> => {
      // Validate file type
      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
        throw new Error(
          `Unsupported format: ${file.type}. Use ${getAcceptedFormatsString()}.`,
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
      posthog.capture("reference_image_upload_started", {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });
    },
  });
}
