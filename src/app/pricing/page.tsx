"use client";

import { motion } from "motion/react";
import posthog from "posthog-js";
import { useState } from "react";
import { NeonShapesPricing } from "@/components/NeonShapesPricing";
import { PageWrapper } from "@/components/PageWrapper";
import { useSession } from "@/components/SessionProvider";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { useSignInCallback } from "@/hooks/use-sign-in-callback";
import { FADE_TRANSITION } from "@/lib/animation-constants";
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
  const { user } = useSession();
  const handleSignIn = useSignInCallback();
  const { data: planData } = usePlanQuery();
  const [isLoadingBillingPortal, setIsLoadingBillingPortal] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  return (
    <PageWrapper user={user} gap="large">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={FADE_TRANSITION}
        className="space-y-12"
      >
        <PricingHeader />

        <NeonShapesPricing>
          <div className="grid gap-8 md:grid-cols-2 lg:gap-10">
            <PricingCard
              tier="free"
              title="Free"
              price={0}
              priceDescription="/ month"
              description="Perfect for exploring and getting started"
              features={FREE_FEATURES}
              buttonText={
                user
                  ? planData?.planType === "pro"
                    ? "Manage plan"
                    : "Current plan"
                  : "Sign up for free"
              }
              buttonVariant={user ? "secondary" : "primary"}
              buttonDisabled={!!user && planData?.planType === "free"}
              buttonLoading={isLoadingBillingPortal}
              onButtonClick={async () => {
                setIsLoadingBillingPortal(true);
                if (!user) {
                  await handleSignIn();
                } else if (planData?.planType === "pro") {
                  posthog.capture("manage_plan_clicked", {
                    user_id: user?.id,
                    current_plan: planData?.planType,
                  });
                  let userId = null;
                  if (!user) {
                    userId = await handleSignIn();
                  }
                  if (userId) {
                    window.location.href = "/billing/portal";
                  } else {
                    setIsLoadingBillingPortal(false);
                  }
                }
              }}
              animationDelay={0.3}
            />

            <PricingCard
              tier="pro"
              title="Pro"
              price={15}
              priceDescription="/ month"
              description="For professionals and power users"
              features={PRO_FEATURES}
              buttonDisabled={planData?.planType === "pro"}
              buttonLoading={isUpgrading}
              buttonText={
                user
                  ? planData?.planType === "pro"
                    ? "Current plan"
                    : "Upgrade to Pro"
                  : "Get Pro"
              }
              buttonVariant={user ? "primary" : "secondary"}
              onButtonClick={async () => {
                setIsUpgrading(true);
                posthog.capture("upgrade_to_pro_clicked", {
                  user_id: user?.id,
                  current_plan: planData?.planType,
                });
                let userId = null;
                if (!user) {
                  userId = await handleSignIn();
                }
                if (userId) {
                  window.location.href = "/billing/upgrade";
                } else {
                  setIsUpgrading(false);
                }
              }}
              animationDelay={0.4}
            />
          </div>
        </NeonShapesPricing>

        <PricingContactCTA animationDelay={0.6} />
      </motion.section>
    </PageWrapper>
  );
}
