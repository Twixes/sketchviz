"use client";

import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { NeonShape } from "./NeonShape";

interface NeonBackgroundProps {
  children: ReactNode;
}

export function NeonBackground({ children }: NeonBackgroundProps) {
  return (
    <div className="neon-shell min-h-screen flex flex-col">
      {/* Neon decorative shapes - fixed to viewport */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Pink arrow - top left, pointing inward */}
        <NeonShape
          shape="arrow"
          color="pink"
          size="xl"
          animation="both"
          className="absolute left-[8%] top-[18%] hidden rotate-12 lg:block"
        />

        {/* Turquoise star - top right, small accent */}
        <NeonShape
          shape="diamond"
          color="turquoise"
          size="md"
          animation="breathing"
          className="absolute right-[12%] top-[12%] hidden lg:block"
        />

        {/* Coral spiral - left side, mid-height */}
        <NeonShape
          shape="spiral"
          color="coral"
          size="lg"
          animation="drift"
          className="absolute left-[3%] top-[55%] hidden -rotate-12 lg:block"
        />

        {/* Violet zigzag - bottom right */}
        <NeonShape
          shape="zigzag"
          color="violet"
          size="lg"
          animation="both"
          className="absolute right-[6%] bottom-[22%] hidden rotate-6 lg:block"
        />

        {/* Amber crescent - bottom left, subtle */}
        <NeonShape
          shape="crescent"
          color="amber"
          size="md"
          animation="breathing"
          className="absolute left-[15%] bottom-[12%] hidden opacity-80 lg:block"
        />
      </div>

      {children}
      <Footer />
    </div>
  );
}
