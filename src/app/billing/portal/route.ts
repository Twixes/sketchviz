import { CustomerPortal } from "@polar-sh/nextjs";
import { createClient } from "@/lib/supabase/server";
import { getBillingContext } from "@/lib/teams";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  getExternalCustomerId: async (_req) => {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    const userId = data?.claims.sub;
    if (!userId) return "";
    const billingContext = await getBillingContext(userId);
    return billingContext.billingEntityId;
  },
  returnUrl:
    process.env.NODE_ENV === "production"
      ? "https://sketchviz.app"
      : "http://localhost:3000",
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
});
