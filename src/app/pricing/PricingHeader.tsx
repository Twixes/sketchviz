import { motion } from "motion/react";
import { NeonShape } from "@/components/NeonShape";
import { FADE_TRANSITION } from "@/lib/animation-constants";

export function PricingHeader() {
  return (
    <div className="relative text-center">
      {/* Neon decorative shapes around the title */}
      <NeonShape
        shape="spiral"
        color="violet"
        size="md"
        animation="drift"
        className="absolute -left-14 -top-6 hidden opacity-70 lg:block"
      />
      <NeonShape
        shape="arrow"
        color="amber"
        size="sm"
        animation="breathing"
        className="absolute -right-10 top-2 hidden rotate-45 opacity-60 lg:block"
      />
      <NeonShape
        shape="crescent"
        color="coral"
        size="sm"
        animation="breathing"
        className="absolute -right-20 -bottom-2 hidden opacity-50 lg:block"
      />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, ...FADE_TRANSITION }}
        className="text-4xl font-semibold tracking-tight lg:text-5xl"
      >
        Simple, transparent pricing
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, ...FADE_TRANSITION }}
        className="mx-auto mt-4 max-w-2xl text-base text-black/60 text-balance lg:text-xl"
      >
        Start free – upgrade when you need more power
      </motion.p>
    </div>
  );
}
