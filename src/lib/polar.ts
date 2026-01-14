import "server-only";

import { Polar } from "@polar-sh/sdk";
import { CREDIT_METER_ID, PRO_PLAN_PRODUCT_ID } from "./constants";
import { posthogNode } from "./posthog/server";

const DEFAULT_FREE_PLAN_CREDITS = 100;

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export async function getCreditsForUser(
  userId: string,
): Promise<number | null> {
  try {
    const subscriptions = await polar.subscriptions.list({
      externalCustomerId: userId,
    });
    if (!subscriptions.result.items.length) {
      return DEFAULT_FREE_PLAN_CREDITS; // This means the free plan hasn't been set up yet - common on first login
    }
    const customerMetersPage = await polar.customerMeters.list({
      externalCustomerId: userId,
      meterId: CREDIT_METER_ID,
    });
    const creditMeter = customerMetersPage.result.items[0];

    // If the credit meter doesn't exist yet, show the free allowance
    // (Polar may still be processing signup)
    return creditMeter?.balance ?? DEFAULT_FREE_PLAN_CREDITS;
  } catch (error) {
    posthogNode.captureException(error, userId);
    console.error("Error fetching credits:", error);
    return null;
  }
}

export async function getPlanForUser(
  userId: string,
): Promise<[type: "free" | "pro", subscriptionId: string | null]> {
  const subscriptions = await polar.subscriptions.list({
    externalCustomerId: userId,
  });
  const firstSubscription = subscriptions.result.items[0];
  if (!firstSubscription) {
    return ["free", null];
  }
  if (subscriptions.result.items.length > 1) {
    console.warn(
      `User ${userId} oddly has multiple subscriptions! Only the first one will be used.`,
    );
  }
  return [
    firstSubscription.productId === PRO_PLAN_PRODUCT_ID ? "pro" : "free",
    firstSubscription.id,
  ];
}
