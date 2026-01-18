import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Privacy policy",
};

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
