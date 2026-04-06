import assert from "node:assert/strict";
import test from "node:test";
import {
  getSignupDiscoveryOption,
  normalizeSignupDiscoveryDetail,
  normalizeSignupDiscoverySource,
  resolveSignupDiscovery,
  SIGNUP_DISCOVERY_OTHER_VALUE,
} from "./signup-discovery.ts";

test("normalizeSignupDiscoverySource returns canonical values", () => {
  assert.equal(normalizeSignupDiscoverySource("google"), "Google");
  assert.equal(
    normalizeSignupDiscoverySource("  friend OR person at work/school "),
    "Friend or person at work/school",
  );
  assert.equal(
    normalizeSignupDiscoverySource("somewhere else"),
    SIGNUP_DISCOVERY_OTHER_VALUE,
  );
});

test("normalizeSignupDiscoverySource collapses whitespace before matching", () => {
  assert.equal(
    normalizeSignupDiscoverySource("Friend or person   at work/school"),
    "Friend or person at work/school",
  );
});

test("normalizeSignupDiscoverySource rejects empty and unknown values", () => {
  assert.equal(normalizeSignupDiscoverySource(undefined), undefined);
  assert.equal(normalizeSignupDiscoverySource(null), undefined);
  assert.equal(normalizeSignupDiscoverySource("   "), undefined);
  assert.equal(normalizeSignupDiscoverySource("Select an option"), undefined);
  assert.equal(normalizeSignupDiscoverySource("TikTok"), undefined);
});

test("normalizeSignupDiscoveryDetail trims and collapses whitespace", () => {
  assert.equal(
    normalizeSignupDiscoveryDetail("  sketchviz   reddit  thread "),
    "sketchviz reddit thread",
  );
});

test("normalizeSignupDiscoveryDetail drops empty values", () => {
  assert.equal(normalizeSignupDiscoveryDetail(undefined), undefined);
  assert.equal(normalizeSignupDiscoveryDetail(null), undefined);
  assert.equal(normalizeSignupDiscoveryDetail("   "), undefined);
});

test("getSignupDiscoveryOption finds options case-insensitively", () => {
  assert.deepEqual(getSignupDiscoveryOption("youtube"), {
    value: "YouTube",
    label: "YouTube",
    detailLabel: "Oh, what was the video/channel? (optional)",
  });
});

test("getSignupDiscoveryOption returns undefined for unknown input", () => {
  assert.equal(getSignupDiscoveryOption("Unknown"), undefined);
  assert.equal(getSignupDiscoveryOption(undefined), undefined);
});

test("resolveSignupDiscovery preserves a normal source and detail", () => {
  assert.deepEqual(resolveSignupDiscovery("google", " loft conversion "), {
    discoverySource: "Google",
    discoveryDetail: "loft conversion",
  });
});

test("resolveSignupDiscovery keeps a normal source when detail is blank", () => {
  assert.deepEqual(resolveSignupDiscovery("Reddit", "   "), {
    discoverySource: "Reddit",
    discoveryDetail: undefined,
  });
});

test("resolveSignupDiscovery maps 'Somewhere else' detail into discoverySource", () => {
  assert.deepEqual(
    resolveSignupDiscovery("Somewhere else", "   school design forum   "),
    {
      discoverySource: "school design forum",
      discoveryDetail: undefined,
    },
  );
});

test("resolveSignupDiscovery maps detail into discoverySource when no source was chosen", () => {
  assert.deepEqual(resolveSignupDiscovery(null, "  professor mention "), {
    discoverySource: "professor mention",
    discoveryDetail: undefined,
  });
});

test("resolveSignupDiscovery returns undefined fields when nothing useful was provided", () => {
  assert.deepEqual(resolveSignupDiscovery(undefined, "   "), {
    discoverySource: undefined,
    discoveryDetail: undefined,
  });
});
