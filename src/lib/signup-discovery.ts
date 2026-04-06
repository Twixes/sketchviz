import type { SelectOption } from "@/lib/components/ui/Select";

export const SIGNUP_DISCOVERY_SOURCE_KEY = "discovery_source";
export const SIGNUP_DISCOVERY_DETAIL_KEY = "discovery_source_detail";
export const SIGNUP_DISCOVERY_COOKIE_NAME = "signup_discovery";
export const SIGNUP_DISCOVERY_OTHER_VALUE = "Somewhere else";
export const SIGNUP_DISCOVERY_DETAIL_PLACEHOLDER = "Appreciate you sharing!";

export interface SignupDiscoveryOption extends SelectOption<string> {
  detailLabel?: string;
}

export const SIGNUP_DISCOVERY_OPTIONS: SignupDiscoveryOption[] = [
  {
    value: "Google",
    label: "Google",
    detailLabel: "Oh, what was your Google search? (optional)",
  },
  {
    value: "Instagram",
    label: "Instagram",
    detailLabel: "Oh, was this a post/story/reel? (optional)",
  },
  {
    value: "YouTube",
    label: "YouTube",
    detailLabel: "Oh, what was the video/channel? (optional)",
  },
  {
    value: "Reddit",
    label: "Reddit",
    detailLabel: "Oh, what was the subreddit/post? (optional)",
  },
  {
    value: "A blog/newsletter/podcast",
    label: "A blog/newsletter/podcast",
    detailLabel: "Oh, what was the blog/newsletter/podcast? (optional)",
  },
  {
    value: "Friend or person at work/school",
    label: "Friend or person at work/school",
    detailLabel: "Oh, how did we come into the conversation? (optional)",
  },
  {
    value: SIGNUP_DISCOVERY_OTHER_VALUE,
    label: "Somewhere else",
    detailLabel: "Oh, how did you find us? (optional)",
  },
];

const SIGNUP_DISCOVERY_SOURCE_VALUES = new Set(
  SIGNUP_DISCOVERY_OPTIONS.map((option) => option.value).filter(
    (value): value is string => value !== null,
  ),
);

function normalizeSignupDiscoveryText(value: string | null | undefined) {
  const normalized = value?.replace(/\s+/g, " ").trim();
  return normalized ? normalized : undefined;
}

export function normalizeSignupDiscoverySource(
  value: string | null | undefined,
) {
  const normalized = normalizeSignupDiscoveryText(value);
  if (!normalized) return undefined;

  for (const source of SIGNUP_DISCOVERY_SOURCE_VALUES) {
    if (source.toLowerCase() === normalized.toLowerCase()) {
      return source;
    }
  }

  return undefined;
}

export function normalizeSignupDiscoveryDetail(
  value: string | null | undefined,
) {
  return normalizeSignupDiscoveryText(value);
}

export function getSignupDiscoveryOption(source: string | null | undefined) {
  const normalizedSource = normalizeSignupDiscoverySource(source);
  return SIGNUP_DISCOVERY_OPTIONS.find(
    (option) => option.value === normalizedSource,
  );
}

export function resolveSignupDiscovery(
  source: string | null | undefined,
  detail: string | null | undefined,
) {
  const normalizedSource = normalizeSignupDiscoverySource(source);
  const normalizedDetail = normalizeSignupDiscoveryDetail(detail);

  if (!normalizedSource || normalizedSource === SIGNUP_DISCOVERY_OTHER_VALUE) {
    return {
      discoverySource: normalizedDetail,
      discoveryDetail: undefined,
    };
  }

  return {
    discoverySource: normalizedSource,
    discoveryDetail: normalizedDetail,
  };
}

export function buildSignupDiscoveryMetadata(
  source: string | null | undefined,
  detail: string | null | undefined,
) {
  const resolved = resolveSignupDiscovery(source, detail);

  return {
    ...(resolved.discoverySource
      ? { [SIGNUP_DISCOVERY_SOURCE_KEY]: resolved.discoverySource }
      : {}),
    ...(resolved.discoveryDetail
      ? { [SIGNUP_DISCOVERY_DETAIL_KEY]: resolved.discoveryDetail }
      : {}),
  };
}

export function getSignupDiscoveryFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
) {
  return resolveSignupDiscovery(
    typeof metadata?.[SIGNUP_DISCOVERY_SOURCE_KEY] === "string"
      ? metadata[SIGNUP_DISCOVERY_SOURCE_KEY]
      : undefined,
    typeof metadata?.[SIGNUP_DISCOVERY_DETAIL_KEY] === "string"
      ? metadata[SIGNUP_DISCOVERY_DETAIL_KEY]
      : undefined,
  );
}

export function serializeSignupDiscoveryCookie(
  source: string | null | undefined,
  detail: string | null | undefined,
) {
  const metadata = buildSignupDiscoveryMetadata(source, detail);
  return Object.keys(metadata).length > 0
    ? encodeURIComponent(JSON.stringify(metadata))
    : undefined;
}

export function parseSignupDiscoveryCookie(value: string | undefined) {
  if (!value) {
    return resolveSignupDiscovery(undefined, undefined);
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Record<
      string,
      unknown
    > | null;
    return getSignupDiscoveryFromMetadata(parsed);
  } catch {
    return resolveSignupDiscovery(undefined, undefined);
  }
}
