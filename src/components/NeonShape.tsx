"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ComponentType, SVGProps } from "react";
import ArrowIcon from "@/icons/neon/arrow.svg";
import CrescentIcon from "@/icons/neon/crescent.svg";
import DiamondIcon from "@/icons/neon/diamond.svg";
import SpiralIcon from "@/icons/neon/spiral.svg";
import ZigzagIcon from "@/icons/neon/zigzag.svg";
import {
  NEON_BREATHING,
  NEON_COMBINED,
  NEON_DRIFT,
  NEON_GLOW_FILTERS,
  type NeonColor,
} from "@/lib/neon-animations";

type NeonShape = "arrow" | "diamond" | "zigzag" | "spiral" | "crescent";
type NeonAnimation = "breathing" | "drift" | "both" | "none";
type NeonSize = "sm" | "md" | "lg" | "xl";

const SHAPE_COMPONENTS: Record<
  NeonShape,
  ComponentType<SVGProps<SVGSVGElement>>
> = {
  arrow: ArrowIcon,
  diamond: DiamondIcon,
  zigzag: ZigzagIcon,
  spiral: SpiralIcon,
  crescent: CrescentIcon,
};

const SIZE_CLASSES: Record<NeonSize, string> = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
  xl: "w-48 h-48",
};

const COLOR_CLASSES: Record<NeonColor, string> = {
  pink: "text-[color:var(--neon-pink)]",
  coral: "text-[color:var(--neon-coral)]",
  turquoise: "text-[color:var(--neon-turquoise)]",
  violet: "text-[color:var(--neon-violet)]",
  amber: "text-[color:var(--neon-amber)]",
};

interface NeonShapeProps {
  shape: NeonShape;
  color: NeonColor;
  size?: NeonSize;
  animation?: NeonAnimation;
  className?: string;
}

export function NeonShape({
  shape,
  color,
  size = "md",
  animation = "both",
  className = "",
}: NeonShapeProps) {
  const ShapeComponent = SHAPE_COMPONENTS[shape];
  const prefersReducedMotion = useReducedMotion();

  const getAnimationProps = () => {
    if (prefersReducedMotion || animation === "none") {
      return {};
    }
    switch (animation) {
      case "breathing":
        return NEON_BREATHING;
      case "drift":
        return NEON_DRIFT;
      default:
        return NEON_COMBINED;
    }
  };

  const glowFilter = NEON_GLOW_FILTERS[color];

  return (
    <motion.div
      {...getAnimationProps()}
      className={`pointer-events-none ${SIZE_CLASSES[size]} ${COLOR_CLASSES[color]} ${className}`}
      style={{
        filter: glowFilter,
        willChange: "filter, opacity, transform",
      }}
      aria-hidden="true"
    >
      <ShapeComponent className="w-full h-full" />
    </motion.div>
  );
}
