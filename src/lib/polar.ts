import "server-only";

import { Polar } from "@polar-sh/sdk";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "production",
});

export async function getCreditsForUser(
  userId: string,
): Promise<number | null> {
  try {
    const customerMetersPage = await polar.customerMeters.list({
      externalCustomerId: userId,
      meterId: "37470072-5831-4972-a30f-3e96e8e02f9f",
    });
    const creditMeter = customerMetersPage.result.items[0];
    return creditMeter?.balance ?? null;
  } catch (error) {
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
