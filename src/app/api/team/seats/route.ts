import { NextResponse } from "next/server";
import { polar } from "@/lib/polar";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const subscriptionId = url.searchParams.get("subscriptionId");
  if (!subscriptionId) {
    return NextResponse.json(
      { error: "Missing subscriptionId" },
      { status: 400 },
    );
  }

  try {
    const seatsList = await polar.customerSeats.listSeats({ subscriptionId });
    const claimedSeats = seatsList.seats.filter(
      (s) => s.status === "claimed",
    ).length;
    return NextResponse.json({
      available: seatsList.availableSeats,
      total: seatsList.totalSeats,
      used: claimedSeats,
    });
  } catch (error) {
    console.error("Failed to fetch seats:", error);
    return NextResponse.json(
      { error: "Failed to fetch seats" },
      { status: 500 },
    );
  }
}
