import { motion } from "motion/react";
import { FADE_TRANSITION } from "@/lib/animation-constants";
import { Button } from "@/lib/components/ui/Button";

interface PricingContactCTAProps {
  animationDelay: number;
}

export function PricingContactCTA({ animationDelay }: PricingContactCTAProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay, ...FADE_TRANSITION }}
      className="relative overflow-hidden rounded-3xl border-2 border-black/10 bg-gradient-to-r from-white/80 to-white/60 p-10 text-center backdrop-blur-sm"
    >
      {/* Decorative shapes inside */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 20,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute -right-8 -top-8 size-32 rounded-full bg-[color:var(--accent-sun)] opacity-10"
      />
      <motion.div
        animate={{ rotate: -360, scale: [1, 1.1, 1] }}
        transition={{
          duration: 15,
          repeat: Number.POSITIVE_INFINITY,
          ease: "linear",
        }}
        className="absolute -bottom-6 -left-6 size-24 bg-[color:var(--accent-mint)] opacity-10"
      />

      <h3 className="relative text-2xl font-bold text-black lg:text-3xl">
        Need a custom plan?
      </h3>
      <p className="relative mx-auto mt-3 max-w-2xl text-base text-black/70 lg:text-lg">
        Contact us for enterprise pricing, volume discounts, or special
        requirements
      </p>
      <Button
        variant="secondary"
        size="lg"
        className="relative mt-4"
        onClick={() => {
          window.location.href = "mailto:support@sketchviz.com";
        }}
      >
        Get in touch
      </Button>
    </motion.div>
  );
}
