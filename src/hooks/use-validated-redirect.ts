import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { isValidRedirectPath } from "@/lib/auth-utils";

/**
 * Reads `?redirect=` from search params and validates it.
 * Returns the validated redirect path or null.
 */
export function useValidatedRedirect(): string | null {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  return useMemo(
    () => (isValidRedirectPath(redirectTo) ? redirectTo : null),
    [redirectTo],
  );
}
