export const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;

export const FADE_TRANSITION = {
  duration: 0.35,
  ease: "easeOut",
} as const;
