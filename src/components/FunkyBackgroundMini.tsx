"use client";

import { motion } from "motion/react";

export function FunkyBackgroundMini() {
  return (
    <>
      {/* Enhanced Memphis decorative shapes */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -left-12 -top-12 hidden h-36 w-36 rounded-full bg-[color:var(--accent-sun)] opacity-90 shadow-[0_0_60px_rgba(255,215,0,0.4)] lg:block"
      />
      <motion.div
        animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -right-8 top-1/4 hidden h-20 w-20 rounded-full border-4 border-[color:var(--accent-sun)] bg-white/80 lg:block"
      />
      <motion.div
        animate={{ x: [0, 10, 0], rotate: [0, -180, -360] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute -left-6 bottom-1/4 hidden h-16 w-16 bg-black/10 lg:block"
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-0 top-0 hidden h-12 w-12 -translate-y-1/2 translate-x-1/2 rounded-full bg-black/20 lg:block"
      />
    </>
  );
}
