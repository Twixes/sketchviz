"use client";

import { motion } from "motion/react";
import { FunkyBackground } from "@/components/FunkyBackground";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { FADE_TRANSITION, LAYOUT_TRANSITION } from "@/lib/animation-constants";
import { PRO_PLAN_PRODUCT_ID } from "@/lib/constants";
import { PricingCard } from "./PricingCard";
import { PricingContactCTA } from "./PricingContactCTA";
import { PricingHeader } from "./PricingHeader";

const FREE_FEATURES = [
  "High-fidelity image generation",
  "Limited to 100 credits (4-25 renders)",
  "Standard support",
];

const PRO_FEATURES = [
  "High-fidelity image generation",
  "1,000 credits included each month",
  "Then, unlimited usage at $0.015/credit",
  "Reference images for materials/textures/style",
  "Threading for iterative tweaks",
  "Priority support",
];

export default function PricingPage() {
  let { user } = useSession();
  const handleSignIn = useSignInCallback();

  const handleUpgradeToPro = async () => {
    if (!user) {
      user = await handleSignIn();
    }
    if (user) {
      window.location.href = `/billing/checkout?products=${PRO_PLAN_PRODUCT_ID}&customerExternalId=${user.id}`;
    }
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
          <PricingHeader />

          <div className="relative grid gap-8 md:grid-cols-2 lg:gap-10">
            {/* Background decorative shapes - kept inline */}
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

            <PricingCard
              tier="free"
              title="Free"
              price={0}
              priceDescription="/ month"
              description="Perfect for exploring and getting started"
              features={FREE_FEATURES}
              buttonText={user ? "Current plan" : "Sign up for free"}
              buttonVariant={user ? "secondary" : "primary"}
              buttonDisabled={!!user}
              onButtonClick={!user ? handleSignIn : undefined}
              animationDelay={0.3}
            />

            <PricingCard
              tier="pro"
              title="Pro"
              price={15}
              priceDescription="/ month"
              description="For professionals and power users"
              features={PRO_FEATURES}
              buttonText={user ? "Upgrade to Pro" : "Get Pro"}
              buttonVariant={user ? "primary" : "secondary"}
              onButtonClick={handleUpgradeToPro}
              animationDelay={0.4}
            />
          </div>

          <PricingContactCTA animationDelay={0.6} />
        </motion.section>
      </motion.main>
    </FunkyBackground>
  );
}
