import { geolocation } from "@vercel/functions";
import { NextResponse } from "next/server";
import { getCreditsForUser, getPlanForUser } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";
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

  const [credits, [planType]] = userId
    ? await Promise.all([getCreditsForUser(userId), getPlanForUser(userId)])
    : ([null, [null]] as const);

  const isVatApplicable =
    (!!geo.country && COUNTRIES_WITH_VAT.includes(geo.country)) ||
    process.env.NODE_ENV === "development";

  return NextResponse.json({ credits, planType, isVatApplicable });
}
