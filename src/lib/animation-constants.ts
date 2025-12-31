// Fast, minimal animations (0.15-0.25s)
export const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 25,
} as const;

export const FADE_TRANSITION = {
  duration: 0.2,
  ease: "easeOut",
} as const;

export const FAST_TRANSITION = {
  duration: 0.15,
  ease: "easeOut",
} as const;

export const SLOW_TRANSITION = {
  duration: 0.25,
  ease: "easeOut",
} as const;

// Common animation variants for entrance/exit
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
} as const;
