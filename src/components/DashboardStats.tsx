"use client";

import { ArrowRightIcon, RocketIcon } from "@radix-ui/react-icons";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo } from "react";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import { usePlanQuery } from "@/hooks/use-plan-query";
import { Button } from "@/lib/components/ui/Button";
import {
  DEFAULT_FREE_PLAN_CREDITS,
  DEFAULT_PRO_PLAN_CREDITS,
} from "@/lib/constants";
import { Sparkline } from "./Sparkline";

export function DashboardStats() {
  const { data: planData, isLoading: isPlanLoading } = usePlanQuery();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();

  const sparklineData = useMemo(
    () => stats?.dailyCounts.map((d) => d.count) ?? [],
    [stats],
  );

  const recentTotal = useMemo(
    () => sparklineData.reduce((sum, count) => sum + count, 0),
    [sparklineData],
  );

  const isPro = planData?.planType === "pro";
  const isFree = planData?.planType === "free";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-[1fr_1fr] rounded-xl overflow-hidden border border-black/[0.12] bg-gradient-to-br from-white/70 via-white/60 to-amber-50/30 backdrop-blur-lg"
    >
      {/* Credits */}
      <div className="p-5 flex flex-col border-b md:border-b-0 md:border-r border-black/[0.06]">
        <div className="flex items-center gap-1.5">
          <h5 className="text-xs font-medium text-black/40 uppercase tracking-wide">
            Credits
          </h5>
          {!isPlanLoading &&
            (isPro ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-black/50 bg-black/5 px-1.5 py-0.5 rounded-lg">
                <RocketIcon className="size-3" />
                Pro
              </span>
            ) : isFree ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-black/50 bg-black/5 px-1.5 py-0.5 rounded-lg">
                Free
              </span>
            ) : null)}
          <div className="grow" />
          <Button
            link="/billing/portal"
            variant="secondary"
            size="xs"
            rightIcon={<ArrowRightIcon />}
          >
            Billing
          </Button>
        </div>
        {isPlanLoading ? (
          <p className="mt-1 text-3xl font-semibold text-black tabular-nums">
            <span className="text-black/20">–</span>
          </p>
        ) : isPro ? (
          <div className="mt-1 space-y-1">
            <p className="flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-black tabular-nums">
                {Math.max(0, planData?.credits ?? 0)}
              </span>
              <span className="text-sm text-black/40">
                left of {DEFAULT_PRO_PLAN_CREDITS}
              </span>
            </p>
            <p className="flex items-baseline gap-1.5">
              {(planData?.credits ?? 0) <= 0 ? (
                <>
                  <span className="text-3xl font-semibold text-black tabular-nums">
                    {Math.abs(planData?.credits ?? 0)}
                  </span>
                  <span className="text-sm text-black/40">pay-as-you-go</span>
                </>
              ) : (
                <span className="text-xs text-black/40">
                  0 pay-as-you-go usage this month.
                </span>
              )}
            </p>
            <p className="text-xs text-black/40">
              Credits reset 1st of every month.
            </p>
          </div>
        ) : (
          <div>
            <p className="mt-1 flex items-baseline gap-1.5">
              <span className="text-3xl font-semibold text-black tabular-nums">
                {planData?.credits ?? 0}
              </span>
              <span className="text-sm text-black/40">
                left of {DEFAULT_FREE_PLAN_CREDITS}
              </span>
            </p>
            <span className="text-xs text-black/40">
              Credits reset 1st of every month.{" "}
              <Link
                href="/pricing"
                className="flex items-center gap-1 text-xs text-black/40 hover:text-black transition-colors"
              >
                Upgrade to Pro for unlimited
                <ArrowRightIcon className="size-3" />
              </Link>
            </span>
          </div>
        )}
      </div>

      {/* Visualizations */}
      <div className="p-5 flex flex-col border-b md:border-b-0 md:border-r border-black/[0.06] relative">
        <h5 className="flex items-center gap-1.5 text-xs font-medium text-black/40 uppercase tracking-wide">
          Visualizations
          <div className="grow" />
          <Button
            link="/threads"
            variant="secondary"
            size="xs"
            rightIcon={<ArrowRightIcon />}
          >
            History
          </Button>
        </h5>
        <p className="mt-1 flex items-baseline gap-1.5">
          {isStatsLoading ? (
            <span className="text-3xl font-semibold text-black/20">–</span>
          ) : (
            <span className="text-3xl font-semibold text-black tabular-nums">
              {recentTotal}
            </span>
          )}
          <span className="text-sm text-black/40">last 14 days</span>
        </p>
        <p className="flex items-baseline gap-1.5">
          {isStatsLoading ? (
            <span className="text-3xl font-semibold text-black/20">–</span>
          ) : (
            <span className="text-3xl font-semibold text-black/40 tabular-nums">
              {stats?.totalGenerations ?? 0}
            </span>
          )}
          <span className="text-sm text-black/40">all-time</span>
        </p>
        {!isStatsLoading && (
          <Sparkline
            title="Visualizations over the last 14 days"
            data={sparklineData}
            strokeColor="rgb(0 0 0 / 0.25)"
            fillColor="rgb(0 0 0 / 0.04)"
            className="absolute -bottom-0.5 -right-0.5 w-[60%] h-24"
          />
        )}
      </div>
    </motion.div>
  );
}
