import "server-only";

import { PostHog } from "posthog-node";

export const posthogNode = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST },
);
