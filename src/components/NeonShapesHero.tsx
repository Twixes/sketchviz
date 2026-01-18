"use client";

import { NeonShape } from "./NeonShape";

export function NeonShapesHero() {
  return (
    <>
      {/* Neon decorative shapes for hero section */}
      {/* Pink star - top left, prominent glow */}
      <NeonShape
        shape="diamond"
        color="pink"
        size="lg"
        animation="breathing"
        className="absolute -left-10 -top-8"
      />

      {/* Turquoise arrow - right side, pointing down */}
      <NeonShape
        shape="arrow"
        color="turquoise"
        size="md"
        animation="drift"
        className="absolute -right-6 top-1/4 rotate-90"
      />

      {/* Amber spiral - bottom left */}
      <NeonShape
        shape="spiral"
        color="amber"
        size="md"
        animation="both"
        className="absolute -left-4 bottom-1/4"
      />

      {/* Violet crescent - top right accent */}
      <NeonShape
        shape="crescent"
        color="violet"
        size="sm"
        animation="breathing"
        className="absolute right-4 -top-4 opacity-90"
      />
    </>
  );
}
