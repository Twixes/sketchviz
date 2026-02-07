"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkAdminAccess } from "@/lib/admin";
import { polar } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";

const grantCreditsSchema = z.object({
  userId: z.string().uuid(),
  creditAmount: z.coerce.number().int().positive().max(10000),
});

export interface GrantCreditsResult {
  success: boolean;
  error?: string;
}

export async function grantCreditsAction(
  _prevState: GrantCreditsResult,
  formData: FormData,
): Promise<GrantCreditsResult> {
  const supabase = await createClient();
  const { isAdmin, email: adminEmail } = await checkAdminAccess(supabase);

  if (!isAdmin) {
    return { success: false, error: "Forbidden" };
  }

  const rawData = {
    userId: formData.get("userId"),
    creditAmount: formData.get("creditAmount"),
  };

  const validation = grantCreditsSchema.safeParse(rawData);

  if (!validation.success) {
    return { success: false, error: validation.error.issues[0].message };
  }

  const { userId, creditAmount } = validation.data;

  try {
    // Ingest a NEGATIVE credit_count event to grant credits
    // (Polar meters: negative values add credits, positive values consume)
    await polar.events.ingest({
      events: [
        {
          name: "image_generation_started",
          externalCustomerId: userId,
          metadata: {
            credit_count: -creditAmount, // Negative to grant credits
            granted_by_admin: adminEmail ?? "unknown",
            is_admin_grant: true,
          },
        },
      ],
    });

    // Track in PostHog
    posthogNode?.capture({
      distinctId: adminEmail ?? "unknown_admin",
      event: "admin_credits_granted",
      properties: {
        target_user_id: userId,
        credit_amount: creditAmount,
        admin_email: adminEmail,
      },
    });

    // Revalidate the admin page to show updated credits
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to grant credits:", error);
    return { success: false, error: "Failed to grant credits" };
  }
}

export interface AdminUser {
  user_id: string;
  email: string;
  generation_count: number;
  credits: number | null;
  created_at: string;
}
