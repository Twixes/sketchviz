import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Welcome to Pro",
};

export default function BillingSuccessLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
