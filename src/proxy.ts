import { type NextRequest, NextResponse } from "next/server";
import { middleware as nextGlobeGenMiddleware } from "next-globe-gen/middleware";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const localizedRequest = await nextGlobeGenMiddleware(request);
  if (localizedRequest instanceof NextResponse) {
    return localizedRequest;
  }
  return await updateSession(localizedRequest);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
