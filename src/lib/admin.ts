import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if an email is an app owner/admin.
 */
export function isAppOwner(email: string | undefined | null): boolean {
  if (!email) return false;

  const ownerEmails = process.env.APP_OWNER_EMAILS;
  if (!ownerEmails) return false;

  const adminList = ownerEmails.split(",").map((e) => e.trim().toLowerCase());
  return adminList.includes(email.toLowerCase());
}

/**
 * Get current user's email from Supabase claims and check if admin.
 */
export async function checkAdminAccess(supabase: SupabaseClient): Promise<{
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
}> {
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string) ?? null;
  const email = (data?.claims?.email as string) ?? null;

  return {
    isAdmin: isAppOwner(email),
    userId,
    email,
  };
}
