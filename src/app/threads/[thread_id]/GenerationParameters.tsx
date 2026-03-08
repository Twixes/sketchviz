import type { UserParams } from "@/lib/schemas";

interface GenerationParametersProps {
  params: UserParams;
}

export function GenerationParameters({ params }: GenerationParametersProps) {
  const hasParams =
    params.outdoor_light ||
    params.indoor_light ||
    params.edit_description ||
    params.model;

  if (!hasParams) return null;

  return (
    <div className="mt-4 space-y-2 rounded-md bg-black/5 p-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-black/40">
        Parameters
      </p>
      <div className="flex flex-wrap gap-2">
        {params.outdoor_light && (
          <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black">
            Outdoor: {params.outdoor_light}
          </span>
        )}
        {params.indoor_light && (
          <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black">
            Indoor: {params.indoor_light}
          </span>
        )}
        {params.model && (
          <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black">
            AI model: {params.model}
          </span>
        )}
        {params.aspect_ratio && (
          <span className="rounded-md border border-black/10 bg-white px-2 py-1 text-xs text-black">
            Aspect ratio: {params.aspect_ratio || "Preserve"}
          </span>
        )}
      </div>
      {params.edit_description && (
        <p className="text-sm text-black/70">{params.edit_description}</p>
      )}
    </div>
  );
}
