import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";
import {
  ACCEPTED_MIME_TYPES,
  getAcceptedFormatsString,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_MB,
} from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import { useUploadStore } from "@/stores/upload-store";

interface UploadFileParams {
  file: File;
}

export function useUploadMutation() {
  const { setInputSrc, setOutputSrc, setBlobUrl, setError, setIsUploading } =
    useUploadStore();

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

      // Get authenticated Supabase client
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Authentication required");
      }

      // Generate unique filename with timestamp
      const timestamp = new Date().toISOString();
      const filenameParts = file.name.split(".");
      const ext = filenameParts.at(-1) || "png";
      const filenameWithoutExt =
        filenameParts.slice(0, -1).join(".") || "upload";
      const filename = `${filenameWithoutExt}-${timestamp}.${ext}`;
      const filePath = `${user.id}/${filename}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("input-images")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("input-images").getPublicUrl(data.path);

      return publicUrl;
    },

    onMutate: ({ file }) => {
      setError(null);
      setIsUploading(true);

      posthog.capture("base_image_upload_started", {
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
      });
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
