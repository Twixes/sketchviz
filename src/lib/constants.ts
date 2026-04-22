/**
 * Shared constants for file upload and validation
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: string;
      NEXT_PUBLIC_POSTHOG_API_KEY: string;
      NEXT_PUBLIC_POSTHOG_HOST: string;
      BLOB_READ_WRITE_TOKEN: string;
      GOOGLE_GENERATIVE_AI_API_KEY: string;
      OPENAI_API_KEY: string;
      POLAR_ACCESS_TOKEN: string;
    }
  }
}

export const DEFAULT_MODEL_PROVIDER = "google";
export const DEFAULT_IMAGE_EDITING_MODEL = "gemini-3.1-flash-image-preview";

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

// Polar

export const FREE_PLAN_PRODUCT_ID =
  process.env.NODE_ENV === "production"
    ? "d603bffa-78e5-468c-bce6-b909577073dc"
    : "5c2ffa78-2d9c-4c1b-9b11-e0b19641039e";
export const PRO_PLAN_PRODUCT_ID =
  process.env.NODE_ENV === "production"
    ? "a127ef8f-a886-49c3-9e8b-3435fd8d1694"
    : "9679f6d9-59c8-4cf5-bd82-8c12379c84e9";
export const CREDIT_METER_ID =
  process.env.NODE_ENV === "production"
    ? "37470072-5831-4972-a30f-3e96e8e02f9f"
    : "f739cf55-659b-466f-8d1f-0e1c9db29085";

export const DEFAULT_FREE_PLAN_CREDITS = 100;
export const DEFAULT_PRO_PLAN_CREDITS = 1000;

// Polling
export const PENDING_GENERATION_POLL_MS = 1000;
