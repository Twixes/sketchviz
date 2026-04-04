import "server-only";

import { Polar } from "@polar-sh/sdk";
import {
  CREDIT_METER_ID,
  DEFAULT_FREE_PLAN_CREDITS,
  FREE_PLAN_PRODUCT_ID,
  PRO_PLAN_PRODUCT_ID,
} from "./constants";
import { posthogNode } from "./posthog/server";

export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});

/**
 * Ensures a Polar customer and free subscription exist for the given user.
 * Safe to call multiple times — handles already-exists cases gracefully.
 * Returns whether the customer was already provisioned (i.e. not a new signup).
 */
export async function ensurePolarProvisioned({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string;
}): Promise<{ wasAlreadyProvisioned: boolean }> {
  // Step 1: Ensure customer exists
  let wasAlreadyProvisioned = false;
  try {
    await polar.customers.getExternal({ externalId: userId });
    wasAlreadyProvisioned = true;
  } catch (error) {
    if (!(error instanceof Error && error.name === "ResourceNotFound")) {
      throw error;
    }
    // Customer doesn't exist — create or adopt existing one by email
    try {
      await polar.customers.create({
        externalId: userId,
        email,
        name: name ?? email,
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "HTTPValidationError" &&
        error.message?.includes(
          "A customer with this email address already exists.",
        )
      ) {
        // Try to adopt existing Polar customer with same email
        const existingCustomers = await polar.customers.list({ email });
        const existingCustomer = existingCustomers.result.items[0];
        if (!existingCustomer) {
          throw new Error(
            `Polar customer email conflict but not found on lookup for user ${userId}`,
          );
        }
        // Only reassign if the existing customer has no externalId (orphaned)
        // or already points to this user — don't hijack another user's record
        if (
          existingCustomer.externalId &&
          existingCustomer.externalId !== userId
        ) {
          throw new Error(
            `Polar customer email conflict: existing customer is linked to a different user`,
          );
        }
        await polar.customers.update({
          id: existingCustomer.id,
          customerUpdate: { externalId: userId },
        });
        wasAlreadyProvisioned = true;
      } else {
        throw error;
      }
    }
  }

  // Step 2: Ensure free subscription exists
  const subscriptions = await polar.subscriptions.list({
    externalCustomerId: userId,
  });
  if (!subscriptions.result.items.length) {
    try {
      await polar.subscriptions.create({
        externalCustomerId: userId,
        productId: FREE_PLAN_PRODUCT_ID,
      });
    } catch (error) {
      // Subscription may have been created between our check and create — that's fine
      if (
        !(
          error instanceof Error &&
          error.name === "HTTPValidationError" &&
          error.message?.toLowerCase().includes("already")
        )
      ) {
        throw error;
      }
      console.warn(
        `Free subscription creation failed for ${userId}, may already exist`,
      );
    }
  }

  return { wasAlreadyProvisioned };
}

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
    return creditMeter?.balance ?? null;
  } catch (error) {
    posthogNode?.captureException(error, userId);
    console.error("Error fetching credits:", error);
    return null;
  }
}

export interface PlanInfo {
  type: "free" | "pro";
  subscriptionId: string | null;
  /** True if the subscription has a billing issue (past_due or unpaid) */
  hasBillingIssue: boolean;
}

export async function getPlanForUser(userId: string): Promise<PlanInfo> {
  const subscriptions = await polar.subscriptions.list({
    externalCustomerId: userId,
  });
  const firstSubscription = subscriptions.result.items[0];
  if (!firstSubscription) {
    return { type: "free", subscriptionId: null, hasBillingIssue: false };
  }
  if (subscriptions.result.items.length > 1) {
    console.warn(
      `User ${userId} oddly has multiple subscriptions! Only the first one will be used.`,
    );
  }

  const hasBillingIssue =
    firstSubscription.status === "past_due" ||
    firstSubscription.status === "unpaid";

  return {
    type: firstSubscription.productId === PRO_PLAN_PRODUCT_ID ? "pro" : "free",
    subscriptionId: firstSubscription.id,
    hasBillingIssue,
  };
}
