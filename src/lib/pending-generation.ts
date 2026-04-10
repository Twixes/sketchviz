/**
 * After this duration without `output_url`, the UI stops treating the generation as
 * in-flight (polling, `isGenerating` from server state). Same cutoff as stale delete / copy.
 */
export const PENDING_GENERATION_STALE_MS = 60_000;

export function isPendingGenerationPastThreshold(
  createdAt: string | undefined,
): boolean {
  if (!createdAt) return false;
  return (
    Date.now() - new Date(createdAt).getTime() > PENDING_GENERATION_STALE_MS
  );
}

/** Latest row still awaiting output within the active window (first minute). */
export function isLatestGenerationActivelyPending(
  latest: { output_url: string | null; created_at: string } | undefined,
): boolean {
  if (!latest || latest.output_url !== null) return false;
  return !isPendingGenerationPastThreshold(latest.created_at);
}
