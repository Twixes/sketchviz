"use client";

import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { FAST_TRANSITION, SLOW_TRANSITION } from "@/lib/animation-constants";

export function Hero() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <div className="space-y-6">
      <motion.h1
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={SLOW_TRANSITION}
        className="text-4xl font-semibold leading-tight text-black sm:text-5xl"
      >
        Render your <span className="outline-title">SketchUp & Revit</span>{" "}
        scenes into{" "}
        <span className="gradient-title">photorealistic visuals</span>.
      </motion.h1>
      <motion.p
        initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
        animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
        transition={{ ...FAST_TRANSITION, delay: 0.1 }}
        className="max-w-xl text-lg text-black/70"
      >
        <strong>
          You don't need to be a 3D expert for top-tier visualizations anymore.
        </strong>
        <br />
        Upload a raw render and get polished, photorealistic output with refined
        lighting, realistic materials, and professional depth.
      </motion.p>
    </div>
  );
}
