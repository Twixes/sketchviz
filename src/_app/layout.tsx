import { Outfit } from "next/font/google";
import "./globals.css";
import { getTranslations, useLocale } from "next-globe-gen";
import { QueryProvider } from "@/components/QueryProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { createClient } from "@/lib/supabase/server";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"], // Added latin-ext for Polish characters
  display: "swap",
});

export async function generateMetadata() {
  const t = getTranslations();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = useLocale();

  return (
    <html lang={locale}>
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
      </body>
    </html>
  );
}
