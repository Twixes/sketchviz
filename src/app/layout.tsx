import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { GoogleTagManager } from "@next/third-parties/google";
import Head from "next/head";
import { QueryProvider } from "@/components/QueryProvider";
import { SessionProvider } from "@/components/SessionProvider";
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      <GoogleTagManager gtmScriptUrl="https://www.googletagmanager.com/gtag/js?id=AW-971292206" />
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
