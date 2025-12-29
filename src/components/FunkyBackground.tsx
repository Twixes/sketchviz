"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Footer } from "./Footer";

interface FunkyBackgroundProps {
  children: ReactNode;
}

export function FunkyBackground({ children }: FunkyBackgroundProps) {
  return (
    <div className="memphis-shell min-h-screen flex flex-col">
      {/* Background Memphis shapes - fixed to viewport, won't affect layout */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute left-[10%] top-[20%] h-48 w-48 rounded-full bg-[color:var(--accent-sun)] opacity-20 blur-2xl"
        />
        <motion.div
          animate={{ rotate: -360, y: [0, 50, 0] }}
          transition={{ duration: 35, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[15%] top-[60%] h-64 w-64 rotate-12 border-8 border-black/10 bg-white/50"
        />
        <motion.div
          animate={{ rotate: 360, x: [0, 30, 0] }}
          transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[20%] left-[5%] h-40 w-40 rounded-3xl bg-black/5"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[5%] top-[10%] h-32 w-32 rounded-full border-4 border-[color:var(--accent-sun)] opacity-40"
        />
      </div>

      {children}
      <Footer />
    </div>
  );
}
