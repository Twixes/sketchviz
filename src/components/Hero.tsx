import { motion } from "motion/react";
import { useTranslations } from "next-globe-gen";

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

export function Hero() {
  const t = useTranslations();

  const features = [
    {
      key: "quality",
      label: t("hero.features.quality.label"),
      value: t("hero.features.quality.value"),
      detail: t("hero.features.quality.detail"),
    },
    {
      key: "speed",
      label: t("hero.features.speed.label"),
      value: t("hero.features.speed.value"),
      detail: t("hero.features.speed.detail"),
    },
    {
      key: "control",
      label: t("hero.features.control.label"),
      value: t("hero.features.control.value"),
      detail: t("hero.features.control.detail"),
    },
  ];

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
          {t("hero.headline")}
        </h1>
        <p className="max-w-xl text-lg text-black/70">
          {t("hero.description")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {features.map((item) => (
          <div
            key={item.key}
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
