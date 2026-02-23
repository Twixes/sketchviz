import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Account settings",
};

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
