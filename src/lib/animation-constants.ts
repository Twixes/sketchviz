// Smooth, polished animations (0.2-0.4s)
export const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 200,
  damping: 30,
} as const;

export const FADE_TRANSITION = {
  duration: 0.3,
  ease: "easeInOut",
} as const;

export const FAST_TRANSITION = {
  duration: 0.2,
  ease: "easeInOut",
} as const;

export const SLOW_TRANSITION = {
  duration: 0.4,
  ease: "easeInOut",
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

// Time Machine view animations (Apple-like smooth transitions)
export const TIME_MACHINE_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 30,
} as const;

export const TIME_MACHINE_LAYER_SPRING = {
  type: "spring",
  stiffness: 250,
  damping: 25,
} as const;

// Layer visual properties
export const TIME_MACHINE_CONFIG = {
  // How much each layer scales down as it recedes
  scalePerLayer: 0.92,
  brightnessPerLayer: 0.08,
  // Vertical offset between layers (in pixels)
  yOffsetPerLayer: 40,
  // Opacity reduction per layer
  opacityPerLayer: 0.7,
  // Maximum layers to show behind active
  maxVisibleLayers: 4,
  // Shadow intensity per layer (0-1)
  shadowPerLayer: 0.15,
} as const;
