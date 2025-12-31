"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if the user prefers reduced motion.
 * Returns true if user has prefers-reduced-motion enabled in their system settings.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Helper function to get animation props that respect reduced motion preferences.
 * Returns undefined for initial/animate/exit when reduced motion is preferred.
 */
export function getAnimationProps<T extends Record<string, unknown>>(
  shouldReduce: boolean,
  props: T,
): T | Record<string, never> {
  return shouldReduce ? {} : props;
}
