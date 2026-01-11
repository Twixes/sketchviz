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
        className="absolute -left-16 top-1/4 hidden opacity-70 lg:block"
      />

      {/* Coral crescent - right side */}
      <NeonShape
        shape="crescent"
        color="coral"
        size="md"
        animation="breathing"
        className="absolute -right-12 bottom-1/3 hidden opacity-60 lg:block"
      />

      {/* Pink star - subtle top accent */}
      <NeonShape
        shape="diamond"
        color="pink"
        size="sm"
        animation="breathing"
        className="absolute right-1/4 -top-8 hidden opacity-50 lg:block"
      />

      {children}
    </div>
  );
}
