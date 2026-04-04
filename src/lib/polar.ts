import "server-only";

import { Polar } from "@polar-sh/sdk";
import {
  CREDIT_METER_ID,
  DEFAULT_FREE_PLAN_CREDITS,
  PRO_PLAN_PRODUCT_ID,
  TEAM_PLAN_PRODUCT_ID,
} from "./constants";
import { posthogNode } from "./posthog/server";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export async function getCreditsForBillingEntity(
  billingEntityId: string,
): Promise<number | null> {
  try {
    const subscriptions = await polar.subscriptions.list({
      externalCustomerId: billingEntityId,
    });
    if (!subscriptions.result.items.length) {
      return DEFAULT_FREE_PLAN_CREDITS; // This means the free plan hasn't been set up yet - common on first login
    }
    const customerMetersPage = await polar.customerMeters.list({
      externalCustomerId: billingEntityId,
      meterId: CREDIT_METER_ID,
    });
    const creditMeter = customerMetersPage.result.items[0];
    return creditMeter?.balance ?? null;
  } catch (error) {
    posthogNode?.captureException(error, billingEntityId);
    console.error("Error fetching credits:", error);
    return null;
  }
}

/** @deprecated Use `getCreditsForBillingEntity` with `getBillingContext` instead */
export const getCreditsForUser = getCreditsForBillingEntity;

export type PlanType = "free" | "pro" | "team";

export interface PlanInfo {
  type: PlanType;
  subscriptionId: string | null;
  /** True if the subscription has a billing issue (past_due or unpaid) */
  hasBillingIssue: boolean;
}

const PAID_PRODUCT_IDS: Record<string, PlanType> = {
  [PRO_PLAN_PRODUCT_ID]: "pro",
  [TEAM_PLAN_PRODUCT_ID]: "team",
};

export async function getPlanForBillingEntity(
  billingEntityId: string,
): Promise<PlanInfo> {
  const subscriptions = await polar.subscriptions.list({
    externalCustomerId: billingEntityId,
  });
  const firstSubscription = subscriptions.result.items[0];
  if (!firstSubscription) {
    return { type: "free", subscriptionId: null, hasBillingIssue: false };
  }
  if (subscriptions.result.items.length > 1) {
    console.warn(
      `Billing entity ${billingEntityId} oddly has multiple subscriptions! Only the first one will be used.`,
    );
  }

  const hasBillingIssue =
    firstSubscription.status === "past_due" ||
    firstSubscription.status === "unpaid";

  return {
    type: PAID_PRODUCT_IDS[firstSubscription.productId] ?? "free",
    subscriptionId: firstSubscription.id,
    hasBillingIssue,
  };
}

/** @deprecated Use `getPlanForBillingEntity` with `getBillingContext` instead */
export const getPlanForUser = getPlanForBillingEntity;
