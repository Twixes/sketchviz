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
        className="absolute -left-12 top-8 opacity-60"
      />

      {/* Turquoise arrow - right side */}
      <NeonShape
        shape="arrow"
        color="turquoise"
        size="lg"
        animation="drift"
        className="absolute -right-14 top-1/3 rotate-90 opacity-70"
      />

      {/* Amber spiral - bottom left */}
      <NeonShape
        shape="spiral"
        color="amber"
        size="sm"
        animation="both"
        className="absolute -left-8 bottom-1/4 opacity-50"
      />

      {/* Violet crescent - bottom right */}
      <NeonShape
        shape="crescent"
        color="violet"
        size="md"
        animation="breathing"
        className="absolute -right-10 bottom-1/5 opacity-60"
      />

      {children}
    </div>
  );
}
