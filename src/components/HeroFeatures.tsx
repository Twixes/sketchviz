"use client";

import { motion } from "motion/react";
import { SLOW_TRANSITION } from "@/lib/animation-constants";

const FEATURES = [
  {
    label: "Quality",
    value: "Reliable & beautiful",
    detail: "World-class rendering powered by Google's Nano Banana models",
  },
  {
    label: "Speed",
    value: "Done in 30 s",
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
    <div className="grid gap-4 sm:grid-cols-3">
      {FEATURES.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SLOW_TRANSITION, delay: index * 0.05 }}
          className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-left"
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
