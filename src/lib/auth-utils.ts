/**
 * Validates that a redirect path is safe (same-origin, no open redirect).
 */
export function isValidRedirectPath(path: string | null): path is string {
  if (!path) return false;
  // Must start with exactly one slash (prevents protocol-relative URLs like //evil.com)
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Block path traversal
  if (path.includes("..")) return false;
  // Block backslashes (some browsers normalize \ to /, turning /\ into //)
  if (path.includes("\\")) return false;
  // Block control characters (prevents CRLF header injection, null bytes, etc.)
  // biome-ignore lint/suspicious/noControlCharactersInRegex: This is explicitly for cleaning
  if (/[\x00-\x1f]/.test(path)) return false;
  // Final defense: verify the URL parser doesn't resolve to a different origin
  try {
    const parsed = new URL(path, "http://n");
    if (parsed.origin !== "http://n") return false;
  } catch {
    return false;
  }
  return true;
}
