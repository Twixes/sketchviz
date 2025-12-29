import { posthogNode } from "./lib/posthog/server";

export const onRequestError = async (err, request, _context) => {
  let distinctId = null;
  if (request.headers.cookie) {
    // Normalize multiple cookie arrays to string
    const cookieString = Array.isArray(request.headers.cookie)
      ? request.headers.cookie.join("; ")
      : request.headers.cookie;

    const postHogCookieMatch = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);

    if (postHogCookieMatch && postHogCookieMatch[1]) {
      try {
        const decodedCookie = decodeURIComponent(postHogCookieMatch[1]);
        const postHogData = JSON.parse(decodedCookie);
        distinctId = postHogData.distinct_id;
      } catch (e) {
        console.error("Error parsing PostHog cookie:", e);
      }
    }
  }

  await posthogNode.captureException(err, distinctId || undefined);
};
