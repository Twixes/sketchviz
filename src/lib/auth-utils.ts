/**
 * Validates that a redirect path is safe (same-origin, no open redirect).
 */
export function isValidRedirectPath(path: string | null): path is string {
  if (!path) return false;
  // Must start with exactly one slash (prevents protocol-relative URLs like //evil.com)
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  // Block path traversal
  if (path.includes("..")) return false;
  return true;
}
