/**
 * Shared constants for file upload and validation
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
      BLOB_READ_WRITE_TOKEN: string;
      GOOGLE_GENERATIVE_AI_API_KEY: string;
    }
  }
}

export const DEFAULT_MODEL_PROVIDER = "google";
export const DEFAULT_IMAGE_EDITING_MODEL = "gemini-3-pro-image-preview";

export const ACCEPTED_MIME_TYPES: string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/heic",
  "image/heif",
];

export const MAX_UPLOAD_MB = 20;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/**
 * Get human-readable file format string
 * @example "PNG, JPEG, WEBP, HEIC, HEIF"
 */
export function getAcceptedFormatsString(): string {
  return ACCEPTED_MIME_TYPES.map((type) =>
    type.replace("image/", "").toUpperCase(),
  ).join(", ");
}
