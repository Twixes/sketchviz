"use client";

import { title } from "process";
import { useEffect, useMemo, useRef, useState } from "react";

interface SparklineProps {
  title: string;
  data: number[];
  className?: string;
  strokeColor?: string;
  fillColor?: string;
}

export function Sparkline({
  title,
  data,
  className,
  strokeColor = "currentColor",
  fillColor,
}: SparklineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { width, height } = dimensions;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  const pathData = useMemo(() => {
    if (data.length === 0 || width === 0 || height === 0)
      return { line: "", area: "" };

    const max = Math.max(...data, 1); // At least 1 to avoid division by zero
    const padding = 2;
    const effectiveWidth = width - padding * 2;
    const effectiveHeight = height - padding * 2;

    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * effectiveWidth;
      const y = padding + effectiveHeight - (value / max) * effectiveHeight;
      return { x, y };
    });

    // Create smooth curve using quadratic bezier
    let line = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midX = (prev.x + curr.x) / 2;
      line += ` Q ${prev.x} ${prev.y} ${midX} ${(prev.y + curr.y) / 2}`;
    }
    // Final segment to last point
    if (points.length > 1) {
      const last = points[points.length - 1];
      line += ` T ${last.x} ${last.y}`;
    }

    // Area fill path (line path + close to bottom)
    const area =
      line +
      ` L ${points[points.length - 1].x} ${height - padding}` +
      ` L ${points[0].x} ${height - padding} Z`;

    return { line, area };
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div className={className} role="img" aria-label="No activity data" />
    );
  }

  const hasSize = width > 0 && height > 0;

  return (
    <svg
      ref={svgRef}
      viewBox={hasSize ? `0 0 ${width} ${height}` : undefined}
      className={className}
      role="img"
      aria-labelledby="sparkline-title"
    >
      <title id="sparkline-title">{title}</title>
      {hasSize && (
        <>
          {fillColor && (
            <path d={pathData.area} fill={fillColor} strokeWidth={0} />
          )}
          <path
            d={pathData.line}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
