"use client";

import type { ReactNode } from "react";
import { NeonShape } from "./NeonShape";

interface NeonShapesPricingProps {
  children: ReactNode;
}

export function NeonShapesPricing({ children }: NeonShapesPricingProps) {
  return (
    <div className="relative">
      {/* Neon decorative shapes for pricing section */}
      {/* Turquoise zigzag - left side */}
      <NeonShape
        shape="zigzag"
        color="turquoise"
        size="lg"
        animation="drift"
        className="absolute -left-16 top-1/4 opacity-70"
      />

      {/* Coral crescent - right side */}
      <NeonShape
        shape="crescent"
        color="coral"
        size="md"
        animation="breathing"
        className="absolute -right-12 bottom-1/3 opacity-60"
      />

      {/* Pink star - subtle top accent */}
      <NeonShape
        shape="diamond"
        color="pink"
        size="sm"
        animation="breathing"
        className="absolute right-1/4 -top-8 opacity-50"
      />

      {children}
    </div>
  );
}
