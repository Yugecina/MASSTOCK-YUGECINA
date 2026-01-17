import React from 'react';

interface IconProps {
  className?: string;
  size?: number;
  color?: string;
}

const defaultColor = '#2E6B7B'; // Bleu Pétrole

// ========== DESIGN STYLES (9 icons) ==========

export const ModernIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* 3D Cube with depth and geometric precision */}
    <path
      d="M16 4L26 9.5V22.5L16 28L6 22.5V9.5L16 4Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 4V16M16 16L26 22.5M16 16L6 22.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 16L26 9.5M16 16L6 9.5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.5"
    />
    {/* Corner details */}
    <circle cx="16" cy="4" r="1.5" fill={color} />
    <circle cx="26" cy="9.5" r="1.5" fill={color} />
    <circle cx="6" cy="9.5" r="1.5" fill={color} />
  </svg>
);

export const MinimalistIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Zen circle with negative space */}
    <circle
      cx="16"
      cy="16"
      r="10"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Single line through center - essence of minimalism */}
    <line
      x1="8"
      y1="16"
      x2="24"
      y2="16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    {/* Subtle accent dots */}
    <circle cx="8" cy="16" r="1" fill={color} />
    <circle cx="24" cy="16" r="1" fill={color} />
  </svg>
);

export const IndustrialIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Mechanical gear with industrial texture */}
    <circle
      cx="16"
      cy="16"
      r="8"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Gear teeth */}
    {[0, 60, 120, 180, 240, 300].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 16 + Math.cos(rad) * 8;
      const y1 = 16 + Math.sin(rad) * 8;
      const x2 = 16 + Math.cos(rad) * 11;
      const y2 = 16 + Math.sin(rad) * 11;
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="square"
        />
      );
    })}
    {/* Central bolt hole */}
    <circle cx="16" cy="16" r="3" stroke={color} strokeWidth="1.5" />
    {/* Bolt holes */}
    <circle cx="16" cy="10" r="1" fill={color} />
    <circle cx="22" cy="16" r="1" fill={color} />
    <circle cx="16" cy="22" r="1" fill={color} />
    <circle cx="10" cy="16" r="1" fill={color} />
  </svg>
);

export const ScandinavianIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Nordic pine tree with natural organic feel */}
    {/* Tree trunk */}
    <path
      d="M16 26V22"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Bottom tier */}
    <path
      d="M10 22L16 16L22 22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
    {/* Middle tier */}
    <path
      d="M11 16L16 11L21 16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.15"
    />
    {/* Top tier */}
    <path
      d="M12 11L16 6L20 11"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
    {/* Star on top */}
    <path
      d="M16 6L15.5 4.5L16 3L16.5 4.5L16 6Z"
      fill={color}
    />
  </svg>
);

export const ContemporaryIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Sophisticated flowing curves - dynamic and modern */}
    <path
      d="M6 16C6 16 10 8 16 12C22 16 26 8 26 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M6 20C6 20 10 12 16 16C22 20 26 12 26 12"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.6"
      fill="none"
    />
    <path
      d="M6 24C6 24 10 16 16 20C22 24 26 16 26 16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.3"
      fill="none"
    />
    {/* Accent points */}
    <circle cx="6" cy="16" r="1.5" fill={color} />
    <circle cx="26" cy="8" r="1.5" fill={color} />
  </svg>
);

export const CoastalIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Ocean waves with movement and flow */}
    <path
      d="M4 12C6 10 8 12 10 12C12 12 14 10 16 10C18 10 20 12 22 12C24 12 26 10 28 12"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 18C6 16 8 18 10 18C12 18 14 16 16 16C18 16 20 18 22 18C24 18 26 16 28 18"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
    <path
      d="M4 24C6 22 8 24 10 24C12 24 14 22 16 22C18 22 20 24 22 24C24 24 26 22 28 24"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.4"
    />
    {/* Foam details */}
    <circle cx="10" cy="12" r="1" fill={color} opacity="0.3" />
    <circle cx="22" cy="18" r="1" fill={color} opacity="0.3" />
  </svg>
);

export const FarmhouseIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Rustic barn door with wood planks */}
    <rect
      x="8"
      y="6"
      width="16"
      height="20"
      rx="1"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Vertical planks */}
    <line x1="16" y1="6" x2="16" y2="26" stroke={color} strokeWidth="1.5" />
    {/* Horizontal boards */}
    <line x1="8" y1="12" x2="24" y2="12" stroke={color} strokeWidth="1.5" />
    <line x1="8" y1="18" x2="24" y2="18" stroke={color} strokeWidth="1.5" />
    {/* Cross brace - rustic detail */}
    <path
      d="M10 8L14 16M14 16L10 24M14 16L18 8M18 24L14 16"
      stroke={color}
      strokeWidth="1"
      opacity="0.4"
    />
    {/* Metal hinges */}
    <rect x="9" y="10" width="2" height="3" fill={color} rx="0.5" />
    <rect x="9" y="19" width="2" height="3" fill={color} rx="0.5" />
    <rect x="21" y="10" width="2" height="3" fill={color} rx="0.5" />
    <rect x="21" y="19" width="2" height="3" fill={color} rx="0.5" />
  </svg>
);

export const MidCenturyIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Atomic age starburst - retro 1950s-60s */}
    <circle cx="16" cy="16" r="3" fill={color} />
    {/* 12 rays emanating from center */}
    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 16 + Math.cos(rad) * 4;
      const y1 = 16 + Math.sin(rad) * 4;
      const x2 = 16 + Math.cos(rad) * 12;
      const y2 = 16 + Math.sin(rad) * 12;
      return (
        <g key={i}>
          <line
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx={x2} cy={y2} r="1.5" fill={color} />
        </g>
      );
    })}
    {/* Orbital rings */}
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1" opacity="0.3" />
  </svg>
);

export const TraditionalIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Classical architectural column - elegant and timeless */}
    {/* Capital (top) */}
    <path
      d="M10 8H22V10H10V8Z"
      fill={color}
    />
    <rect x="11" y="6" width="10" height="2" fill={color} />
    {/* Shaft with fluting */}
    <rect x="12" y="10" width="8" height="14" stroke={color} strokeWidth="1.5" />
    <line x1="14" y1="10" x2="14" y2="24" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <line x1="16" y1="10" x2="16" y2="24" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <line x1="18" y1="10" x2="18" y2="24" stroke={color} strokeWidth="0.5" opacity="0.3" />
    {/* Base */}
    <rect x="11" y="24" width="10" height="1.5" fill={color} />
    <path
      d="M10 25.5H22V27H10V25.5Z"
      fill={color}
    />
    {/* Decorative molding */}
    <circle cx="12" cy="7" r="0.5" fill={color} opacity="0.5" />
    <circle cx="16" cy="7" r="0.5" fill={color} opacity="0.5" />
    <circle cx="20" cy="7" r="0.5" fill={color} opacity="0.5" />
  </svg>
);

// ========== BUDGET LEVELS (4 icons) ==========

export const BudgetIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Simple coin with value markings */}
    <circle
      cx="16"
      cy="16"
      r="10"
      stroke={color}
      strokeWidth="2"
    />
    <circle
      cx="16"
      cy="16"
      r="8"
      stroke={color}
      strokeWidth="1"
      opacity="0.3"
    />
    {/* Dollar sign */}
    <path
      d="M16 10V22M13 12H17.5C18.3 12 19 12.7 19 13.5C19 14.3 18.3 15 17.5 15H14.5C13.7 15 13 15.7 13 16.5C13 17.3 13.7 18 14.5 18H19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const StandardIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Wallet with fold lines and card detail */}
    <rect
      x="6"
      y="10"
      width="20"
      height="14"
      rx="2"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Fold line */}
    <line
      x1="6"
      y1="17"
      x2="26"
      y2="17"
      stroke={color}
      strokeWidth="1.5"
    />
    {/* Card slot */}
    <rect
      x="9"
      y="12"
      width="8"
      height="3"
      rx="0.5"
      stroke={color}
      strokeWidth="1"
      opacity="0.5"
    />
    {/* Button closure */}
    <circle cx="23" cy="17" r="1.5" fill={color} />
    {/* Stitching detail */}
    <path
      d="M8 10L8 24M24 10L24 24"
      stroke={color}
      strokeWidth="0.5"
      strokeDasharray="1 2"
      opacity="0.3"
    />
  </svg>
);

export const PremiumIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Faceted diamond with sparkle */}
    <path
      d="M16 6L24 12L16 26L8 12L16 6Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Facets */}
    <path
      d="M16 6V26M8 12H24M12 9L16 6L20 9M12 20L16 26L20 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Internal facets */}
    <path
      d="M16 12L12 9M16 12L20 9M16 12L8 12M16 12L24 12"
      stroke={color}
      strokeWidth="1"
      opacity="0.3"
    />
    {/* Sparkle effect */}
    <circle cx="20" cy="8" r="1" fill={color} />
    <path d="M20 6V10M18 8H22" stroke={color} strokeWidth="0.5" />
  </svg>
);

export const LuxuryIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Ornate crown with jewels */}
    {/* Crown base */}
    <path
      d="M6 20H26L24 26H8L6 20Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
    {/* Crown points */}
    <path
      d="M8 20L10 10L12 16L16 6L20 16L22 10L24 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    {/* Jewels */}
    <circle cx="10" cy="10" r="1.5" fill={color} />
    <circle cx="16" cy="6" r="2" fill={color} />
    <circle cx="22" cy="10" r="1.5" fill={color} />
    {/* Crown band decoration */}
    <circle cx="12" cy="23" r="1" fill={color} opacity="0.5" />
    <circle cx="16" cy="23" r="1" fill={color} opacity="0.5" />
    <circle cx="20" cy="23" r="1" fill={color} opacity="0.5" />
    {/* Ornamental lines */}
    <line x1="8" y1="20" x2="8" y2="26" stroke={color} strokeWidth="0.5" opacity="0.3" />
    <line x1="24" y1="20" x2="24" y2="26" stroke={color} strokeWidth="0.5" opacity="0.3" />
  </svg>
);

// ========== SEASONS (5 icons) ==========

export const SpringIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Blooming flower with detailed petals */}
    {/* Center */}
    <circle cx="16" cy="16" r="3" fill={color} />
    {/* Petals */}
    {[0, 72, 144, 216, 288].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x = 16 + Math.cos(rad) * 6;
      const y = 16 + Math.sin(rad) * 6;
      return (
        <ellipse
          key={i}
          cx={x}
          cy={y}
          rx="3"
          ry="5"
          fill={color}
          fillOpacity="0.3"
          stroke={color}
          strokeWidth="1.5"
          transform={`rotate(${angle} ${x} ${y})`}
        />
      );
    })}
    {/* Stem and leaves */}
    <path
      d="M16 19C16 19 16 24 16 26"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16 22C16 22 13 21 12 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16 22C16 22 19 21 20 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const SummerIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Radiant sun with detailed rays */}
    <circle cx="16" cy="16" r="6" fill={color} />
    <circle cx="16" cy="16" r="8" stroke={color} strokeWidth="1" opacity="0.2" />
    {/* Long rays */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 16 + Math.cos(rad) * 9;
      const y1 = 16 + Math.sin(rad) * 9;
      const x2 = 16 + Math.cos(rad) * 13;
      const y2 = 16 + Math.sin(rad) * 13;
      return (
        <line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      );
    })}
    {/* Short rays between */}
    {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const x1 = 16 + Math.cos(rad) * 9;
      const y1 = 16 + Math.sin(rad) * 9;
      const x2 = 16 + Math.cos(rad) * 11;
      const y2 = 16 + Math.sin(rad) * 11;
      return (
        <line
          key={`short-${i}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />
      );
    })}
  </svg>
);

export const AutumnIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Detailed maple leaf with veins */}
    <path
      d="M16 6L14 12L10 10L12 16L6 18L12 20L10 26L16 22L22 26L20 20L26 18L20 16L22 10L18 12L16 6Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.15"
    />
    {/* Central vein */}
    <line x1="16" y1="6" x2="16" y2="22" stroke={color} strokeWidth="1" />
    {/* Side veins */}
    <path
      d="M16 12L12 16M16 12L20 16M16 16L12 20M16 16L20 20"
      stroke={color}
      strokeWidth="0.8"
      opacity="0.5"
    />
  </svg>
);

export const WinterIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Intricate snowflake pattern */}
    {/* Main axes */}
    <line x1="16" y1="4" x2="16" y2="28" stroke={color} strokeWidth="1.5" />
    <line x1="4" y1="16" x2="28" y2="16" stroke={color} strokeWidth="1.5" />
    <line x1="7" y1="7" x2="25" y2="25" stroke={color} strokeWidth="1.5" />
    <line x1="25" y1="7" x2="7" y2="25" stroke={color} strokeWidth="1.5" />
    {/* Branch details */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const cx = 16 + Math.cos(rad) * 8;
      const cy = 16 + Math.sin(rad) * 8;
      return (
        <g key={i}>
          <circle cx={cx} cy={cy} r="1.5" fill={color} />
          <line
            x1={16 + Math.cos(rad) * 6}
            y1={16 + Math.sin(rad) * 6}
            x2={16 + Math.cos(rad - 0.5) * 8}
            y2={16 + Math.sin(rad - 0.5) * 8}
            stroke={color}
            strokeWidth="1"
          />
          <line
            x1={16 + Math.cos(rad) * 6}
            y1={16 + Math.sin(rad) * 6}
            x2={16 + Math.cos(rad + 0.5) * 8}
            y2={16 + Math.sin(rad + 0.5) * 8}
            stroke={color}
            strokeWidth="1"
          />
        </g>
      );
    })}
    {/* Center crystal */}
    <circle cx="16" cy="16" r="2" fill={color} />
  </svg>
);

export const NoelIcon: React.FC<IconProps> = ({
  className = '',
  size = 32,
  color = defaultColor
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Decorated Christmas tree with ornaments */}
    {/* Tree trunk */}
    <rect x="14" y="24" width="4" height="3" fill={color} />
    {/* Tree tiers */}
    <path
      d="M10 24L16 18L22 24"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.1"
    />
    <path
      d="M11 18L16 13L21 18"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.15"
    />
    <path
      d="M12 13L16 8L20 13"
      stroke={color}
      strokeWidth="1.5"
      strokeLinejoin="round"
      fill={color}
      fillOpacity="0.2"
    />
    {/* Star on top */}
    <path
      d="M16 8L15 5L16 3L17 5L16 8ZM14 6L18 6M14.5 4L17.5 4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={color}
    />
    {/* Ornament decorations */}
    <circle cx="13" cy="20" r="1.2" fill={color} opacity="0.6" />
    <circle cx="19" cy="20" r="1.2" fill={color} opacity="0.6" />
    <circle cx="16" cy="16" r="1.2" fill={color} opacity="0.6" />
    <circle cx="14" cy="11" r="1" fill={color} opacity="0.6" />
    <circle cx="18" cy="11" r="1" fill={color} opacity="0.6" />
    {/* Garland */}
    <path
      d="M12 21C13 20 15 20 16 21C17 20 19 20 20 21"
      stroke={color}
      strokeWidth="0.8"
      strokeLinecap="round"
      opacity="0.4"
    />
  </svg>
);
