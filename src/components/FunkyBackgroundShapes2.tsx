"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

interface FunkyBackgroundShapes2Props {
  children: ReactNode;
}

export function FunkyBackgroundShapes2({
  children,
}: FunkyBackgroundShapes2Props) {
  return (
    <div className="relative">
      {/* Background decorative shapes */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 25,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="pointer-events-none absolute -left-20 top-1/4 hidden size-32 rounded-full bg-[color:var(--accent-mint)] opacity-20 blur-xl lg:block"
      />
      <motion.div
        animate={{
          rotate: -360,
          x: [0, 20, 0],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        className="pointer-events-none absolute -right-16 bottom-1/4 hidden size-40 rounded-2xl border-8 border-[color:var(--accent-coral)] opacity-15 lg:block"
      />

      {children}
    </div>
  );
}
