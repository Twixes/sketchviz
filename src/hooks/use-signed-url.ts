import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseStorageUrl } from "@/lib/supabase/storage";

/**
 * Hook to get a signed URL for a Supabase Storage file
 * @param url - The public URL from Supabase Storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns The signed URL or null if not available
 */
export function useSignedUrl(
  url: string | null | undefined,
  expiresIn = 3600,
): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!url) {
      setSignedUrl(null);
      return;
    }

    // If it's a local object URL (blob:), use it directly
    if (url.startsWith("blob:")) {
      setSignedUrl(url);
      return;
    }

    // Parse the Supabase Storage URL
    const parsed = parseStorageUrl(url);
    if (!parsed) {
      // Not a Supabase Storage URL, use as-is (might be Vercel Blob for old data)
      setSignedUrl(url);
      return;
    }

    // Get signed URL from Supabase
    const getSignedUrl = async () => {
      const { data, error } = await supabase.storage
        .from(parsed.bucket)
        .createSignedUrl(parsed.path, expiresIn);

      if (error) {
        console.error("Failed to create signed URL:", error);
        setSignedUrl(null);
        return;
      }

      setSignedUrl(data.signedUrl);
    };

    void getSignedUrl();
  }, [url, expiresIn, supabase]);

  return signedUrl;
}

/**
 * Hook to get signed URLs for multiple files
 * @param urls - Array of public URLs from Supabase Storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Array of signed URLs (null for unavailable ones)
 */
export function useSignedUrls(
  urls: (string | null | undefined)[],
  expiresIn = 3600,
): (string | null)[] {
  const [signedUrls, setSignedUrls] = useState<(string | null)[]>([]);
  const supabase = createClient();

  // biome-ignore lint/correctness/useExhaustiveDependencies: the formatting is correct
  useEffect(() => {
    if (!urls.length) {
      setSignedUrls([]);
      return;
    }

    const getSignedUrls = async () => {
      const results = await Promise.all(
        urls.map(async (url) => {
          if (!url) return null;

          // If it's a local object URL (blob:), use it directly
          if (url.startsWith("blob:")) return url;

          // Parse the Supabase Storage URL
          const parsed = parseStorageUrl(url);
          if (!parsed) {
            // Not a Supabase Storage URL, use as-is (might be Vercel Blob for old data)
            return url;
          }

          // Get signed URL from Supabase
          const { data, error } = await supabase.storage
            .from(parsed.bucket)
            .createSignedUrl(parsed.path, expiresIn);

          if (error) {
            console.error("Failed to create signed URL:", error);
            return null;
          }

          return data.signedUrl;
        }),
      );

      setSignedUrls(results);
    };

    void getSignedUrls();
  }, [JSON.stringify(urls), expiresIn, supabase]);

  return signedUrls;
}
