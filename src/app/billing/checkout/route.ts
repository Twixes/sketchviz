import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  successUrl:
    process.env.NODE_ENV === "production"
      ? "https://sketchviz.app/billing/success"
      : "http://localhost:3000/billing/success",
  returnUrl:
    process.env.NODE_ENV === "production"
      ? "https://sketchviz.app"
      : "http://localhost:3000",
  server: "production",
  theme: "light", // Enforces the theme - System-preferred theme will be set if left omitted
});
