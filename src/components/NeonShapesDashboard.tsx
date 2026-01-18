"use client";

import type { ReactNode } from "react";
import { NeonShape } from "./NeonShape";

interface NeonShapesDashboardProps {
  children: ReactNode;
}

export function NeonShapesDashboard({ children }: NeonShapesDashboardProps) {
  return (
    <div className="relative">
      {/* Neon decorative shapes for dashboard section */}
      {/* Pink diamond - top left accent */}
      <NeonShape
        shape="diamond"
        color="pink"
        size="md"
        animation="breathing"
        className="absolute -left-12 top-8 hidden opacity-60 lg:block"
      />

      {/* Turquoise arrow - right side */}
      <NeonShape
        shape="arrow"
        color="turquoise"
        size="lg"
        animation="drift"
        className="absolute -right-14 top-1/3 hidden rotate-90 opacity-70 lg:block"
      />

      {/* Amber spiral - bottom left */}
      <NeonShape
        shape="spiral"
        color="amber"
        size="sm"
        animation="both"
        className="absolute -left-8 bottom-1/4 hidden opacity-50 lg:block"
      />

      {/* Violet crescent - bottom right */}
      <NeonShape
        shape="crescent"
        color="violet"
        size="md"
        animation="breathing"
        className="absolute -right-10 bottom-1/5 hidden opacity-60 lg:block"
      />

      {children}
    </div>
  );
}
