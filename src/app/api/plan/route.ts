import { geolocation } from "@vercel/functions";
import { NextResponse } from "next/server";
import {
  getCreditsForBillingEntity,
  getPlanForBillingEntity,
} from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
import { getBillingContext } from "@/lib/teams";
import type { PlanResponse } from "./types";

export const COUNTRIES_WITH_VAT: string[] = [
  "AT", // Austria
  "BE", // Belgium
  "BG", // Bulgaria
  "HR", // Croatia
  "CY", // Cyprus
  "CZ", // Czechia
  "DK", // Denmark
  "EE", // Estonia
  "FI", // Finland
  "FR", // France
  "DE", // Germany
  "GR", // Greece
  "HU", // Hungary
  "IE", // Ireland
  "IT", // Italy
  "LV", // Latvia
  "LT", // Lithuania
  "LU", // Luxembourg
  "MT", // Malta
  "NL", // Netherlands
  "PL", // Poland
  "PT", // Portugal
  "RO", // Romania
  "SK", // Slovakia
  "SI", // Slovenia
  "ES", // Spain
  "SE", // Sweden
] as const;

export async function GET(
  request: Request,
): Promise<NextResponse<PlanResponse | { error: string }>> {
  const geo = geolocation(request);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  let credits: number | null = null;
  let planInfo: Awaited<ReturnType<typeof getPlanForBillingEntity>> | null =
    null;
  let teamId: string | null = null;
  let teamName: string | null = null;
  let teamRole: PlanResponse["teamRole"] = null;

  if (userId) {
    const billingContext = await getBillingContext(userId);
    [credits, planInfo] = await Promise.all([
      getCreditsForBillingEntity(billingContext.billingEntityId),
      getPlanForBillingEntity(billingContext.billingEntityId),
    ]);
    if (billingContext.type === "team") {
      teamId = billingContext.teamId;
      teamName = billingContext.teamName;
      teamRole = billingContext.role;
    }
  }

  const isVatApplicable =
    (!!geo.country && COUNTRIES_WITH_VAT.includes(geo.country)) ||
    process.env.NODE_ENV === "development";

  return NextResponse.json({
    credits,
    planType: planInfo?.type ?? null,
    isVatApplicable,
    hasBillingIssue: planInfo?.hasBillingIssue ?? false,
    teamId,
    teamName,
    teamRole,
  });
}
