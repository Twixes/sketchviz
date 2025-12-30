"use client";

import {
  CheckIcon,
  LightningBoltIcon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { FunkyBackground } from "@/components/FunkyBackground";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { Button } from "@/lib/components/ui/Button";

const LAYOUT_TRANSITION = {
  type: "spring",
  stiffness: 160,
  damping: 22,
} as const;

const FADE_TRANSITION = { duration: 0.35, ease: "easeOut" } as const;

const PRO_PRODUCT_ID = "a127ef8f-a886-49c3-9e8b-3435fd8d1694";

const FREE_FEATURES = [
  "Limited to 100 credits monthly (5-25 renders)",
  "Basic image generation",
  "Standard support",
];

const PRO_FEATURES = [
  "1,000 credits monthly included",
  "Then, unlimited usage at $0.015/credit",
  "Upload reference images",
  "Iterate on visualizations in threads",
  "Priority support",
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useSession();

  const handleUpgradeToPro = () => {
    if (!user) {
      // If not logged in, redirect to sign in
      router.push("/auth/signin");
      return;
    }
    window.location.href = `/billing/checkout?products=${PRO_PRODUCT_ID}&customerExternalId=${user.id}`;
  };

  return (
    <FunkyBackground>
      <motion.main
        transition={LAYOUT_TRANSITION}
        className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-24 pt-10 lg:px-10"
      >
        <Header user={user} />

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={FADE_TRANSITION}
          className="space-y-12"
        >
          {/* Header */}
          <div className="relative text-center">
            {/* Floating decorative shapes around the title */}
            <motion.div
              animate={{
                rotate: [0, 360],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
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
                repeat: Infinity,
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
                repeat: Infinity,
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

          {/* Pricing Cards */}
          <div className="relative grid gap-8 md:grid-cols-2 lg:gap-10">
            {/* Memphis decorative shapes around cards */}
            <motion.div
              animate={{
                rotate: 360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 25,
                repeat: Infinity,
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
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="pointer-events-none absolute -right-16 bottom-1/4 hidden size-40 rounded-2xl border-8 border-[color:var(--accent-coral)] opacity-15 lg:block"
            />

            {/* Free Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...FADE_TRANSITION, delay: 0.3 }}
              className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm"
            >
              <div className="relative flex-1">
                <h2 className="text-3xl font-bold text-black leading-none">
                  Free
                </h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-6xl font-bold tracking-tight text-black">
                    $0
                  </span>
                  <span className="text-lg text-black/50">/ month</span>
                </div>
                <p className="mt-3 text-base text-black/60">
                  Perfect for exploring and getting started
                </p>

                <ul className="mt-4 space-y-4">
                  {FREE_FEATURES.map((feature, index) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-black/10">
                        <CheckIcon className="size-4 text-black/70" />
                      </div>
                      <span className="text-base text-black/80">{feature}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <Button
                variant="secondary"
                size="lg"
                className="relative mt-6 w-full"
                disabled
              >
                Current plan
              </Button>
            </motion.div>

            {/* Pro Tier */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...FADE_TRANSITION, delay: 0.4 }}
              className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-black/10 bg-white/80 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] backdrop-blur-sm"
            >
              <div className="relative flex-1">
                <h2 className="text-3xl font-bold text-black leading-none">
                  Pro
                </h2>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="gradient-title text-6xl font-bold tracking-tight">
                    $15
                  </span>
                  <span className="text-lg text-black/50">/ month</span>
                </div>
                <p className="mt-3 text-base text-black/60">
                  For professionals and power users
                </p>

                <ul className="mt-4 space-y-4">
                  {PRO_FEATURES.map((feature, index) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-linear-to-br/oklch from-[color:var(--accent-cobalt)] to-[color:var(--accent-coral)]">
                        <CheckIcon className="size-4 text-white" />
                      </div>
                      <span className="text-base font-medium text-black">
                        {feature}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              <Button
                variant="primary"
                size="lg"
                className="relative mt-6 w-full shadow-lg transition-shadow hover:shadow-xl"
                onClick={handleUpgradeToPro}
              >
                {user ? "Upgrade to Pro" : "Sign in to upgrade"}
              </Button>
            </motion.div>
          </div>

          {/* Bottom CTA with Memphis flair */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, ...FADE_TRANSITION }}
            className="relative overflow-hidden rounded-3xl border-2 border-black/10 bg-gradient-to-r from-white/80 to-white/60 p-10 text-center backdrop-blur-sm"
          >
            {/* Decorative shapes inside */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -right-8 -top-8 size-32 rounded-full bg-[color:var(--accent-sun)] opacity-10"
            />
            <motion.div
              animate={{ rotate: -360, scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
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
        </motion.section>
      </motion.main>
    </FunkyBackground>
  );
}
