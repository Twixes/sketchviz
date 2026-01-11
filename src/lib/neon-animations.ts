// Neon-inspired animation constants
// Smooth, dreamy animations for neon tube shapes

// Gentle breathing pulse - opacity and filter brightness
export const NEON_BREATHING = {
  animate: {
    opacity: [0.85, 1, 0.85],
  },
  transition: {
    duration: 3,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
} as const;

// Slow positional drift - subtle floating movement
export const NEON_DRIFT = {
  animate: {
    x: [0, 10, -5, 0],
    y: [0, -8, 5, 0],
    rotate: [0, 2, -1, 0],
  },
  transition: {
    duration: 20,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
} as const;

// Combined breathing + drift for most neon shapes
export const NEON_COMBINED = {
  animate: {
    opacity: [0.85, 1, 0.85],
    x: [0, 8, -4, 0],
    y: [0, -6, 4, 0],
    rotate: [0, 1.5, -0.5, 0],
  },
  transition: {
    duration: 15,
    repeat: Number.POSITIVE_INFINITY,
    ease: "easeInOut",
  },
} as const;

// Entrance animation - neon "turn on" effect
export const NEON_TURN_ON = {
  initial: { opacity: 0 },
  animate: {
    opacity: [0, 0.3, 1, 0.8, 1],
  },
  transition: {
    duration: 0.8,
    times: [0, 0.2, 0.4, 0.7, 1],
  },
} as const;

// Neon glow filter strings for different colors
export const NEON_GLOW_FILTERS = {
  pink: "drop-shadow(0 0 3px var(--neon-pink)) drop-shadow(0 0 10px var(--neon-pink-glow)) drop-shadow(0 0 25px var(--neon-pink-glow)) drop-shadow(0 0 50px var(--neon-pink-glow))",
  coral:
    "drop-shadow(0 0 3px var(--neon-coral)) drop-shadow(0 0 10px var(--neon-coral-glow)) drop-shadow(0 0 25px var(--neon-coral-glow)) drop-shadow(0 0 50px var(--neon-coral-glow))",
  turquoise:
    "drop-shadow(0 0 3px var(--neon-turquoise)) drop-shadow(0 0 10px var(--neon-turquoise-glow)) drop-shadow(0 0 25px var(--neon-turquoise-glow)) drop-shadow(0 0 50px var(--neon-turquoise-glow))",
  violet:
    "drop-shadow(0 0 3px var(--neon-violet)) drop-shadow(0 0 10px var(--neon-violet-glow)) drop-shadow(0 0 25px var(--neon-violet-glow)) drop-shadow(0 0 50px var(--neon-violet-glow))",
  amber:
    "drop-shadow(0 0 3px var(--neon-amber)) drop-shadow(0 0 10px var(--neon-amber-glow)) drop-shadow(0 0 25px var(--neon-amber-glow)) drop-shadow(0 0 50px var(--neon-amber-glow))",
} as const;

// Simplified glow for mobile (fewer drop-shadow layers)
export const NEON_GLOW_FILTERS_MOBILE = {
  pink: "drop-shadow(0 0 5px var(--neon-pink)) drop-shadow(0 0 15px var(--neon-pink-glow))",
  coral:
    "drop-shadow(0 0 5px var(--neon-coral)) drop-shadow(0 0 15px var(--neon-coral-glow))",
  turquoise:
    "drop-shadow(0 0 5px var(--neon-turquoise)) drop-shadow(0 0 15px var(--neon-turquoise-glow))",
  violet:
    "drop-shadow(0 0 5px var(--neon-violet)) drop-shadow(0 0 15px var(--neon-violet-glow))",
  amber:
    "drop-shadow(0 0 5px var(--neon-amber)) drop-shadow(0 0 15px var(--neon-amber-glow))",
} as const;

export type NeonColor = keyof typeof NEON_GLOW_FILTERS;
