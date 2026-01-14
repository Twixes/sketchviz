import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Head from "next/head";
import Script from "next/script";
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
  title: "SketchViz",
  description:
    "Turn SketchUp renders into photorealistic visualizations with AI.",
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
      <Head>
        <meta name="apple-mobile-web-app-title" content="SketchViz" />
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </Head>
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
        <SpeedInsights />
      </body>
    </html>
  );
}
