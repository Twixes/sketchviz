/**
 * Hook to get a URL for a Supabase Storage file.
 * Now that both input-images and output-images buckets are public,
 * this simply returns the URL directly without signing.
 *
 * @param url - The public URL from Supabase Storage
 * @returns The URL or null if not available
 */
export function useSignedUrl(url: string | null | undefined): string | null {
  return url ?? null;
}

/**
 * Hook to get URLs for multiple Supabase Storage files.
 * Now that both input-images and output-images buckets are public,
 * this simply returns the URLs directly without signing.
 *
 * @param urls - Array of public URLs from Supabase Storage
 * @returns Array of URLs (null for unavailable ones)
 */
export function useSignedUrls(
  urls: (string | null | undefined)[],
): (string | null)[] {
  return urls.map((url) => url ?? null);
}
