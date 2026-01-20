import posthog from "posthog-js";

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_API_KEY, {
  api_host:
    process.env.NODE_ENV === "production"
      ? "/experience"
      : process.env.NEXT_PUBLIC_POSTHOG_HOST,
  ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  defaults: "2025-11-30",
  person_profiles: "always",
});
