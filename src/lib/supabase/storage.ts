import type { SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_INPUT_IMAGES = "input-images";
export const BUCKET_OUTPUT_IMAGES = "output-images";

export interface UploadFileParams {
  supabase: SupabaseClient;
  bucket: typeof BUCKET_INPUT_IMAGES | typeof BUCKET_OUTPUT_IMAGES;
  path: string;
  file: Buffer | Blob | File;
  contentType: string;
  userId: string;
}

/**
 * Upload a file to Supabase Storage
 * Files are organized by user ID to maintain isolation
 */
export async function uploadFile({
  supabase,
  bucket,
  path,
  file,
  contentType,
  userId,
}: UploadFileParams): Promise<{ url: string; path: string }> {
  // Prefix path with user ID for isolation
  const fullPath = `${userId}/${path}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, file, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  // Get public URL (requires authentication to access due to RLS)
  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
  };
}

/**
 * Generate a signed URL for authenticated file access
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 */
export async function getSignedUrl({
  supabase,
  bucket,
  path,
  expiresIn = 3600,
}: {
  supabase: SupabaseClient;
  bucket: typeof BUCKET_INPUT_IMAGES | typeof BUCKET_OUTPUT_IMAGES;
  path: string;
  expiresIn?: number;
}): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return data.signedUrl;
}

/**
 * Download a file from Supabase Storage
 */
export async function downloadFile({
  supabase,
  bucket,
  path,
}: {
  supabase: SupabaseClient;
  bucket: typeof BUCKET_INPUT_IMAGES | typeof BUCKET_OUTPUT_IMAGES;
  path: string;
}): Promise<Blob> {
  const { data, error } = await supabase.storage.from(bucket).download(path);

  if (error || !data) {
    throw new Error(`Failed to download file: ${error?.message}`);
  }

  return data;
}

/**
 * Extract bucket and path from a Supabase Storage URL
 */
export function parseStorageUrl(url: string): {
  bucket: string;
  path: string;
} | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/storage/v1/object/public/");
    if (pathParts.length !== 2) {
      return null;
    }
    const [bucket, ...pathSegments] = pathParts[1].split("/");
    return {
      bucket,
      path: pathSegments.join("/"),
    };
  } catch {
    return null;
  }
}
