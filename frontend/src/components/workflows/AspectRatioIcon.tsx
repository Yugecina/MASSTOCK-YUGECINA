/**
 * Aspect Ratio Icon - Minimalist SVG visualization
 * Displays proportionally accurate rectangle for each aspect ratio
 */

import React from 'react';

interface AspectRatioIconProps {
  ratio: string;
  width?: number;
  height?: number;
  className?: string;
}

// Map ratio strings to visual dimensions (within 40x40px canvas)
const RATIO_DIMENSIONS: Record<string, { w: number; h: number }> = {
  // Square
  '1:1': { w: 28, h: 28 },

  // Portrait formats (vertical)
  '2:3': { w: 20, h: 30 },
  '3:4': { w: 22, h: 29 },
  '9:16': { w: 18, h: 32 },
  '4:5': { w: 24, h: 30 },

  // Landscape formats (horizontal)
  '3:2': { w: 30, h: 20 },
  '4:3': { w: 29, h: 22 },
  '5:4': { w: 28, h: 22 },
  '16:9': { w: 36, h: 20 },
  '21:9': { w: 36, h: 15 },
};

export function AspectRatioIcon({ ratio, width = 40, height = 40, className = '' }: AspectRatioIconProps) {
  const dims = RATIO_DIMENSIONS[ratio] || { w: 28, h: 28 };

  // Center the rectangle in the viewBox
  const x = (40 - dims.w) / 2;
  const y = (40 - dims.h) / 2;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      <rect
        x={x}
        y={y}
        width={dims.w}
        height={dims.h}
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}
