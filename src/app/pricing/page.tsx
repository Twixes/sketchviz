"use client";

import { motion } from "motion/react";
import { FunkyBackgroundFuzz } from "@/components/FunkyBackgroundFuzz";
import { FunkyBackgroundShapes2 } from "@/components/FunkyBackgroundShapes2";
import { Header } from "@/components/Header";
import { useSession } from "@/components/SessionProvider";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { FADE_TRANSITION, LAYOUT_TRANSITION } from "@/lib/animation-constants";
import { PRO_PLAN_PRODUCT_ID } from "@/lib/constants";
import { PricingCard } from "./PricingCard";
import { PricingContactCTA } from "./PricingContactCTA";
import { PricingHeader } from "./PricingHeader";

const FREE_FEATURES = [
  "High-fidelity visualization",
  "Output in maximum resolution (4K)",
  "Reference images for materials/textures/style",
  "Limited to 100 credits (4-25 renders)",
  "Standard support",
];

const PRO_FEATURES = [
  "High-fidelity visualization",
  "Output in maximum resolution (4K)",
  "Reference images for materials/textures/style",
  "1,000 credits included each month (40-250 renders)",
  "Then, unlimited usage at $0.015/credit",
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
    <FunkyBackgroundFuzz>
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

          <FunkyBackgroundShapes2>
            <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
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
          </FunkyBackgroundShapes2>

          <PricingContactCTA animationDelay={0.6} />
        </motion.section>
      </motion.main>
    </FunkyBackgroundFuzz>
  );
}
