/**
 * Shared constants for file upload and validation
 */

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
    type.replace("image/", "").toUpperCase()
  ).join(", ");
}
