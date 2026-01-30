"use client";

import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { Button } from "@/lib/components/ui/Button";

export function BillingIssueBanner() {
  const { data: planData } = usePlanQuery();

  if (!planData?.hasBillingIssue) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-7 rounded-lg bg-white/20 text-white shrink-0">
            <ExclamationTriangleIcon className="size-4" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              Payment issue with your subscription
            </h3>
            <p className="text-sm text-white/80">
              Please update your payment method to continue using Pro features.
              Until resolved, you&apos;ll be limited to free plan credits.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          size="md"
          link="/billing/portal"
          className="shrink-0 sm:self-center bg-white text-amber-700 hover:bg-white/90"
        >
          Finish payment
        </Button>
      </div>
    </motion.div>
  );
}
