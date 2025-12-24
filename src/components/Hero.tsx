import { motion } from "motion/react";

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

const FEATURES = [
  {
    label: "Speed",
    value: "~30 seconds",
    detail: "From upload to photoreal",
  },
  {
    label: "Materials",
    value: "Real-world finish",
    detail: "Refined surfaces & textures",
  },
  {
    label: "Lighting",
    value: "Natural depth",
    detail: "Balanced ambient glow",
  },
] as const;

export function Hero() {
  return (
    <motion.div
      key="hero"
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={FADE_TRANSITION}
      className="flex flex-col gap-8"
    >
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold leading-tight text-black sm:text-5xl">
          Transform your <span className="outline-title">SketchUp renders</span>{" "}
          into <span className="gradient-title">photorealistic visuals</span>.
        </h1>
        <p className="max-w-xl text-lg text-black/70">
          Upload a render and get polished, photorealistic output with refined
          lighting, realistic materials, and professional depth.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-black/10 bg-white/75 px-4 py-3 text-left"
          >
            <p className="text-xs uppercase tracking-widest font-semibold mb-0.5 text-black/40">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-black">{item.value}</p>
            <p className="mt-1 text-xs text-black/50">{item.detail}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
