"use client";

import { motion } from "motion/react";
import { SLOW_TRANSITION } from "@/lib/animation-constants";

const FEATURES = [
  {
    label: "Quality",
    value: "Reliable & beautiful",
    detail: "World-class rendering powered by cutting-edge visual AI models",
  },
  {
    label: "Speed",
    value: "Seconds, not hours",
    detail:
      "Too quick to get a cup of coffee – iterate on visualizations rapidly",
  },
  {
    label: "Control",
    value: "It's all up to you",
    detail: "Define items, lighting, materials; reference images supported",
  },
] as const;

export function HeroFeatures() {
  return (
    <div className="grid gap-x-4 gap-y-2 sm:grid-cols-3">
      {FEATURES.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SLOW_TRANSITION, delay: index * 0.05 }}
          className="rounded-xl border border-black/[0.12] bg-gradient-to-br from-white/70 via-white/60 to-amber-50/30 backdrop-blur-lg px-4 py-3 text-left"
        >
          <p className="text-xs uppercase tracking-widest font-semibold mb-1 text-black/40">
            {item.label}
          </p>
          <p className="text-sm font-semibold text-black leading-tight">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-black/50">{item.detail}</p>
        </motion.div>
      ))}
    </div>
  );
}
