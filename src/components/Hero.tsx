import { motion } from "motion/react";

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

const FEATURES = [
  {
    label: "Quick",
    value: "Get it done in 30 s",
    detail:
      "Too quick to get a cup of coffee, iterate on your visualizations rapidly",
  },
  {
    label: "Configurable",
    value: "Control every aspect",
    detail: "Define items, lighting, materials; reference images supported",
  },
  {
    label: "Cutting-edge",
    value: "Get the best results",
    detail: "Reliable and beautiful – powered by Google's Nano Banana AI",
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
            <p className="text-xs uppercase tracking-widest font-semibold mb-1 text-black/40">
              {item.label}
            </p>
            <p className="text-sm font-semibold text-black leading-tight">
              {item.value}
            </p>
            <p className="mt-1 text-xs text-black/50">{item.detail}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
