import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team • SketchViz",
};

export default function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
