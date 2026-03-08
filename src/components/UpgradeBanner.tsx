"use client";

import { CheckIcon, RocketIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import { Button } from "@/lib/components/ui/Button";

const PRO_HIGHLIGHTS = [
  "1,000 credits included monthly",
  "Unlimited pay-as-you-go usage beyond included credits",
  "Priority support",
];

export function UpgradeBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-lg bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-900"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2 leading-tight">
            <div className="flex items-center justify-center size-7 rounded-md bg-white/10 text-white">
              <RocketIcon className="size-3.5" />
            </div>
            <span>
              <h3 className="inline-block font-semibold text-white mr-1">
                Visualize without limits
              </h3>{" "}
              <span className="text-sm text-white/50 whitespace-nowrap">
                SketchViz Pro starts at $15/month
              </span>
            </span>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1">
            {PRO_HIGHLIGHTS.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-1.5 text-sm text-white/60"
              >
                <CheckIcon className="size-3.5 text-emerald-400 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <Button
          variant="secondary"
          size="md"
          link="/billing/upgrade"
          className="shrink-0 sm:self-center bg-white text-black hover:bg-white/90"
        >
          Upgrade to Pro now
        </Button>
      </div>
    </motion.div>
  );
}
