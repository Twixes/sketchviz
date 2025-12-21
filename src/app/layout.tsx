import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/SessionProvider";
import { QueryProvider } from "@/components/QueryProvider";

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
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${outfit.variable} antialiased`}>
        <QueryProvider>
          <SessionProvider session={session}>{children}</SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
