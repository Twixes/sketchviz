import { motion } from "motion/react";
import { FADE_TRANSITION } from "@/lib/animation-constants";

export function PricingHeader() {
  return (
    <div className="relative text-center">
      {/* Floating decorative shapes around the title */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute -left-16 -top-8 hidden size-24 rounded-full border-4 border-[color:var(--accent-cobalt)] opacity-30 lg:block"
      />
      <motion.div
        animate={{
          rotate: [0, -180, -360],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute -right-12 top-0 hidden size-16 bg-[color:var(--accent-sun)] opacity-40 lg:block"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          rotate: [0, 5, -5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="absolute -right-24 -bottom-4 hidden size-12 rounded-full bg-[color:var(--accent-coral)] opacity-25 lg:block"
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
        className="mx-auto mt-4 max-w-2xl text-lg text-black/60 lg:text-xl"
      >
        Start free, upgrade when you need more power
      </motion.p>
    </div>
  );
}
