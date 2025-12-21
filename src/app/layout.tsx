import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/SessionProvider";

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
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
