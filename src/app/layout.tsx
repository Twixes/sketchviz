import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";
import Script from "next/script";
import { OAuthErrorToast } from "@/components/OAuthErrorToast";
import { QueryProvider } from "@/components/QueryProvider";
import {
  SessionProvider,
  type SessionUser,
} from "@/components/SessionProvider";
import { createClient } from "@/lib/supabase/server";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SketchViz",
    template: "%s • SketchViz",
  },
  description:
    "Turn SketchUp/Revit renders into photorealistic visualizations with AI.",
  appleWebApp: {
    title: "SketchViz",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  // getClaims() is faster than getUser() as it only parses the JWT locally
  const { data } = await supabase.auth.getClaims();
  const user: SessionUser | null = data?.claims?.sub
    ? {
        id: data.claims.sub,
        email: data.claims.email as string,
        user_metadata: data.claims
          .user_metadata as SessionUser["user_metadata"],
      }
    : null;

  return (
    <html lang="en">
      <Script
        async
        src="https://www.googletagmanager.com/gtag/js?id=AW-971292206"
        strategy="afterInteractive"
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-971292206');
        `}
      </Script>
      <Script
        src="https://app.lemlist.com/api/visitors/tracking?k=ab8R64u6LsYMlYygFzBYdMxM1ppjC46qBruAITyywhc%3D&t=tea_ESMicc2uGGBgZ6BFv"
        strategy="afterInteractive"
      />
      <body
        className={`${outfit.variable} antialiased`}
        style={
          {
            // dynamicRangeLimit disables HDR on images - not yet supported in Firefox, but it's important, as AI models put out SDR content
            dynamicRangeLimit: "standard",
          } as React.CSSProperties
        }
      >
        <QueryProvider>
          <SessionProvider initialUser={user}>{children}</SessionProvider>
        </QueryProvider>
        <Suspense>
          <OAuthErrorToast />
        </Suspense>
        <Toaster position="bottom-right" />
        <SpeedInsights />
      </body>
    </html>
  );
}
