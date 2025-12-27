import { CustomerPortal } from "@polar-sh/nextjs";
import { createClient } from "@/lib/supabase/server";

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  getExternalCustomerId: async (_req) => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? "";
  },
  returnUrl:
    process.env.NODE_ENV === "production"
      ? "https://sketchviz.app"
      : "http://localhost:3000",
  server: "production",
});
