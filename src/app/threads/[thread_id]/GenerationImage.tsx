"use client";

import { useSignedUrl } from "@/hooks/use-signed-url";

interface GenerationImageProps {
  src: string | null;
  alt: string;
  label: "Input" | "Output";
}

export function GenerationImage({ src, alt, label }: GenerationImageProps) {
  // Get signed URL for authenticated access
  const signedUrl = useSignedUrl(src);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/40">
        {label}
      </p>
      {src && signedUrl ? (
        <div className="overflow-hidden rounded-md border border-black/10 bg-black/5">
          <img
            src={signedUrl}
            alt={alt}
            width={600}
            height={400}
            className="h-auto w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-black/20 bg-black/5">
          <p className="text-sm text-black/40">No output generated</p>
        </div>
      )}
    </div>
  );
}
