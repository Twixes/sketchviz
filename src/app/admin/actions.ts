"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { checkAdminAccess } from "@/lib/admin";
import { polar } from "@/lib/polar";
import { posthogNode } from "@/lib/posthog/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

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

const impersonateUserSchema = z.object({
  userId: z.string().uuid(),
});

export interface ImpersonateUserResult {
  success: boolean;
  error?: string;
}

export async function impersonateUserAction(
  userId: string,
): Promise<ImpersonateUserResult> {
  const validation = impersonateUserSchema.safeParse({ userId });
  if (!validation.success) {
    return { success: false, error: "Invalid user ID" };
  }

  const supabase = await createClient();
  const { isAdmin, email: adminEmail } = await checkAdminAccess(supabase);

  if (!isAdmin) {
    return { success: false, error: "Forbidden" };
  }

  try {
    const serviceClient = createServiceClient();

    const { data: userData, error: userError } =
      await serviceClient.auth.admin.getUserById(validation.data.userId);
    if (userError || !userData?.user?.email) {
      return { success: false, error: "User not found" };
    }

    const { data: linkData, error: linkError } =
      await serviceClient.auth.admin.generateLink({
        type: "magiclink",
        email: userData.user.email,
      });
    if (linkError || !linkData?.properties?.hashed_token) {
      return {
        success: false,
        error: linkError?.message ?? "Failed to generate link",
      };
    }

    // Verify the OTP server-side so the token hash never reaches the client
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
    });
    if (verifyError) {
      return { success: false, error: verifyError.message };
    }

    // Tag this session as an admin impersonation
    const cookieStore = await cookies();
    cookieStore.set("impersonated_by", adminEmail ?? "unknown", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    posthogNode?.capture({
      distinctId: adminEmail ?? "unknown_admin",
      event: "admin_impersonated_user",
      properties: {
        target_user_id: userId,
        target_email: userData.user.email,
        admin_email: adminEmail,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to impersonate user:", error);
    return { success: false, error: "Failed to impersonate user" };
  }
}

export interface AdminUser {
  user_id: string;
  email: string;
  generation_count: number;
  credits: number | null;
  created_at: string;
}
