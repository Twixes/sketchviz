import "server-only";

import { Polar } from "@polar-sh/sdk";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";
import { posthogNode } from "./posthog/server";

export const FREE_PLAN_PRODUCT_ID =
  process.env.NODE_ENV === "production"
    ? "d603bffa-78e5-468c-bce6-b909577073dc"
    : "5c2ffa78-2d9c-4c1b-9b11-e0b19641039e";
export const CREDIT_METER_ID =
  process.env.NODE_ENV === "production"
    ? "37470072-5831-4972-a30f-3e96e8e02f9f"
    : "f739cf55-659b-466f-8d1f-0e1c9db29085";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

export async function getCreditsForUser(
  userId: string,
): Promise<number | null> {
  try {
    const customerMetersPage = await polar.customerMeters.list({
      externalCustomerId: userId,
      meterId: CREDIT_METER_ID,
    });
    const creditMeter = customerMetersPage.result.items[0];
    return creditMeter?.balance ?? null;
  } catch (error) {
    posthogNode.captureException(error, userId);
    console.error("Error fetching credits:", error);
    return null;
  }
}

export async function getSubscriptionsForUser(
  userId: string,
): Promise<Subscription[]> {
  const subscriptions = await polar.subscriptions.list({
    externalCustomerId: userId,
  });
  return subscriptions.result.items;
}
