/** @type {import('tailwindcss').Config} */
/**
 * MasStock Design System V2 - Apple-Inspired Minimalist Theme
 *
 * This Tailwind configuration implements a refined, neutral-first design system
 * with generous spacing, subtle shadows, and a single accent color.
 *
 * Key principles:
 * - 8px baseline grid for all spacing
 * - Neutral color palette with minimal accent usage
 * - Typography scale with precise letter-spacing
 * - Subtle shadows for elevation
 * - Smooth transitions (200ms standard)
 */

module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],

  theme: {
    extend: {
      // ===== COLOR SYSTEM =====
      // Neutral-first palette with single accent color
      colors: {
        // Neutral Scale - Primary color system
        neutral: {
          0: '#FFFFFF',      // Pure white backgrounds
          50: '#FAFAFA',     // Subtle backgrounds (sidebar, hover states)
          100: '#F5F5F5',    // Card hover, disabled backgrounds
          200: '#E8E8E8',    // Borders, dividers
          300: '#D4D4D4',    // Input borders, inactive elements
          400: '#A3A3A3',    // Disabled text, placeholders
          500: '#737373',    // Secondary text
          600: '#525252',    // Body text (primary)
          700: '#404040',    // Headings
          800: '#262626',    // High emphasis text
          900: '#171717',    // Maximum emphasis
        },

        // Accent Color - Use sparingly for primary actions
        accent: {
          DEFAULT: '#007AFF',   // iOS blue - primary CTAs
          hover: '#0051D5',     // Hover state
          active: '#003D99',    // Active/pressed state
          light: '#E5F2FF',     // Backgrounds, subtle highlights
          dark: '#003D99',      // Dark mode variant
        },

        // Semantic Colors - Use only for status/feedback
        success: {
          DEFAULT: '#34C759',   // iOS green
          light: '#E8F5E9',
          dark: '#2EA04D',
        },
        warning: {
          DEFAULT: '#FF9500',   // iOS orange
          light: '#FFF4E5',
          dark: '#E68900',
        },
        error: {
          DEFAULT: '#FF3B30',   // iOS red
          light: '#FFEBEE',
          dark: '#E63929',
        },
      },

      // ===== TYPOGRAPHY =====
      // SF Pro inspired font stack
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
        ],
        mono: [
          'SF Mono',
          'Monaco',
          'Courier New',
          'monospace',
        ],
      },

      // Precise typography scale with line-height and letter-spacing
      fontSize: {
        // Display - Hero sections only
        'display': ['48px', {
          lineHeight: '52px',
          fontWeight: '600',
          letterSpacing: '-0.5px',
        }],

        // Headings
        'h1': ['32px', {
          lineHeight: '40px',
          fontWeight: '600',
          letterSpacing: '-0.3px',
        }],
        'h2': ['24px', {
          lineHeight: '32px',
          fontWeight: '600',
          letterSpacing: '-0.2px',
        }],
        'h3': ['18px', {
          lineHeight: '24px',
          fontWeight: '600',
          letterSpacing: '0px',
        }],

        // Body text
        'body-lg': ['16px', {
          lineHeight: '24px',
          fontWeight: '400',
          letterSpacing: '0px',
        }],
        'body': ['14px', {
          lineHeight: '20px',
          fontWeight: '400',
          letterSpacing: '0px',
        }],

        // Small text
        'small': ['12px', {
          lineHeight: '16px',
          fontWeight: '500',
          letterSpacing: '0.2px',
        }],
        'tiny': ['11px', {
          lineHeight: '14px',
          fontWeight: '500',
          letterSpacing: '0.3px',
        }],
      },

      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        // Removed bold (700) - use semibold for consistency
      },

      // ===== SPACING SYSTEM =====
      // 8px baseline grid
      spacing: {
        '0': '0px',
        '1': '4px',      // xs
        '2': '8px',      // sm
        '3': '12px',     // md-sm
        '4': '16px',     // md (default)
        '5': '20px',     // md-lg
        '6': '24px',     // lg
        '8': '32px',     // xl
        '10': '40px',    // 2xl
        '12': '48px',    // 3xl
        '16': '64px',    // 4xl
        '20': '80px',    // 5xl
        '24': '96px',    // 6xl

        // Layout specific
        'sidebar': '240px',
        'sidebar-collapsed': '80px',
      },

      // ===== BORDER RADIUS =====
      // Rounded corners for modern feel
      borderRadius: {
        'none': '0',
        'sm': '6px',      // Small elements, badges
        'DEFAULT': '8px', // Buttons, inputs
        'md': '10px',     // Search bars
        'lg': '12px',     // Cards (small)
        'xl': '16px',     // Cards (large)
        '2xl': '20px',    // Hero cards
        '3xl': '24px',    // Special sections
        'full': '9999px', // Pills, avatars
      },

      // ===== SHADOWS =====
      // Subtle elevation - barely noticeable
      boxShadow: {
        'none': 'none',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'DEFAULT': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'md': '0 2px 8px 0 rgba(0, 0, 0, 0.04)',
        'lg': '0 4px 16px 0 rgba(0, 0, 0, 0.06)',
        'xl': '0 8px 24px 0 rgba(0, 0, 0, 0.08)',
        '2xl': '0 12px 32px 0 rgba(0, 0, 0, 0.1)',

        // Focus states
        'focus': '0 0 0 3px rgba(0, 122, 255, 0.1)',
        'focus-error': '0 0 0 3px rgba(255, 59, 48, 0.1)',
      },

      // ===== TRANSITIONS =====
      // Apple-like smooth animations
      transitionDuration: {
        'fast': '100ms',
        'DEFAULT': '200ms',
        'slow': '300ms',
        'drawer': '400ms',
      },

      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ===== LAYOUT =====
      maxWidth: {
        'container': '1440px',   // Max content width
        'prose': '680px',        // Readable text width
        'form': '600px',         // Forms and settings
        'detail': '800px',       // Detail pages
      },

      minHeight: {
        'button': '40px',
        'button-sm': '32px',
        'button-lg': '48px',
        'input': '44px',
        'card': '120px',
      },

      // ===== GRID =====
      gridTemplateColumns: {
        'stats': 'repeat(auto-fit, minmax(200px, 1fr))',
        'workflows': 'repeat(auto-fill, minmax(280px, 1fr))',
      },

      // ===== Z-INDEX =====
      zIndex: {
        'dropdown': '1000',
        'sticky': '1020',
        'sidebar': '1030',
        'modal-backdrop': '1040',
        'modal': '1050',
        'toast': '1060',
      },
    },
  },

  plugins: [
    // Custom component classes
    function({ addComponents, addUtilities, theme }) {

      // ===== BUTTON COMPONENTS =====
      addComponents({
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.2'),
          fontWeight: '500',
          borderRadius: theme('borderRadius.DEFAULT'),
          transition: 'all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)',
          cursor: 'pointer',
          border: 'none',
          outline: 'none',
          userSelect: 'none',

          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
            pointerEvents: 'none',
          },

          '&:focus-visible': {
            boxShadow: theme('boxShadow.focus'),
          },
        },

        // Primary button (accent color)
        '.btn-primary': {
          backgroundColor: theme('colors.accent.DEFAULT'),
          color: '#FFFFFF',
          height: '40px',
          padding: '0 24px',
          fontSize: '14px',

          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.accent.hover'),
            boxShadow: theme('boxShadow.sm'),
          },

          '&:active:not(:disabled)': {
            backgroundColor: theme('colors.accent.active'),
            transform: 'scale(0.98)',
          },
        },

        // Secondary button (outline style)
        '.btn-secondary': {
          backgroundColor: '#FFFFFF',
          color: theme('colors.neutral.700'),
          border: `1px solid ${theme('colors.neutral.300')}`,
          height: '40px',
          padding: '0 24px',
          fontSize: '14px',

          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.neutral.50'),
            borderColor: theme('colors.neutral.400'),
          },

          '&:active:not(:disabled)': {
            backgroundColor: theme('colors.neutral.100'),
            transform: 'scale(0.98)',
          },
        },

        // Text button (minimal)
        '.btn-text': {
          backgroundColor: 'transparent',
          color: theme('colors.accent.DEFAULT'),
          height: '36px',
          padding: '0 12px',
          fontSize: '14px',

          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.neutral.50'),
          },

          '&:active:not(:disabled)': {
            backgroundColor: theme('colors.neutral.100'),
          },
        },

        // Danger button
        '.btn-danger': {
          backgroundColor: theme('colors.error.DEFAULT'),
          color: '#FFFFFF',
          height: '40px',
          padding: '0 24px',
          fontSize: '14px',

          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.error.dark'),
          },
        },

        // Button sizes
        '.btn-sm': {
          height: '32px',
          padding: '0 16px',
          fontSize: '14px',
        },

        '.btn-lg': {
          height: '48px',
          padding: '0 32px',
          fontSize: '16px',
        },

        // ===== CARD COMPONENTS =====
        '.card': {
          backgroundColor: '#FFFFFF',
          border: `1px solid ${theme('colors.neutral.200')}`,
          borderRadius: theme('borderRadius.xl'),
          padding: theme('spacing.6'),
          transition: 'all 200ms ease-out',

          '&:hover': {
            boxShadow: theme('boxShadow.lg'),
          },
        },

        '.card-interactive': {
          cursor: 'pointer',

          '&:hover': {
            boxShadow: theme('boxShadow.lg'),
            transform: 'translateY(-2px)',
          },

          '&:active': {
            transform: 'translateY(0)',
          },
        },

        '.card-stat': {
          backgroundColor: theme('colors.neutral.50'),
          border: `1px solid ${theme('colors.neutral.200')}`,
          borderRadius: theme('borderRadius.lg'),
          padding: theme('spacing.5'),
          minHeight: '120px',
        },

        // ===== BADGE COMPONENTS =====
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme('spacing.1'),
          height: '24px',
          padding: '0 12px',
          fontSize: theme('fontSize.small[0]'),
          fontWeight: '600',
          borderRadius: theme('borderRadius.sm'),
          letterSpacing: '0.3px',
        },

        '.badge-success': {
          backgroundColor: theme('colors.success.light'),
          color: theme('colors.success.dark'),
        },

        '.badge-warning': {
          backgroundColor: theme('colors.warning.light'),
          color: theme('colors.warning.dark'),
        },

        '.badge-error': {
          backgroundColor: theme('colors.error.light'),
          color: theme('colors.error.dark'),
        },

        '.badge-neutral': {
          backgroundColor: theme('colors.neutral.100'),
          color: theme('colors.neutral.700'),
        },

        // ===== INPUT COMPONENTS =====
        '.input': {
          width: '100%',
          height: '44px',
          padding: '12px 16px',
          fontSize: '14px',
          color: theme('colors.neutral.800'),
          backgroundColor: '#FFFFFF',
          border: `1px solid ${theme('colors.neutral.300')}`,
          borderRadius: theme('borderRadius.DEFAULT'),
          outline: 'none',
          transition: 'all 200ms ease',

          '&::placeholder': {
            color: theme('colors.neutral.400'),
          },

          '&:hover': {
            borderColor: theme('colors.neutral.400'),
          },

          '&:focus': {
            borderColor: theme('colors.accent.DEFAULT'),
            boxShadow: theme('boxShadow.focus'),
          },

          '&:disabled': {
            backgroundColor: theme('colors.neutral.50'),
            color: theme('colors.neutral.400'),
            cursor: 'not-allowed',
          },
        },

        '.input-error': {
          borderColor: theme('colors.error.DEFAULT'),

          '&:focus': {
            borderColor: theme('colors.error.DEFAULT'),
            boxShadow: theme('boxShadow.focus-error'),
          },
        },

        // ===== NAVIGATION =====
        '.nav-item': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.3'),
          height: '40px',
          padding: '0 12px',
          fontSize: '14px',
          fontWeight: '500',
          color: theme('colors.neutral.600'),
          borderRadius: theme('borderRadius.DEFAULT'),
          transition: 'all 200ms ease',
          cursor: 'pointer',

          '&:hover': {
            backgroundColor: theme('colors.neutral.50'),
            color: theme('colors.neutral.700'),
          },
        },

        '.nav-item-active': {
          backgroundColor: theme('colors.neutral.100'),
          color: theme('colors.accent.DEFAULT'),
          borderLeft: `3px solid ${theme('colors.accent.DEFAULT')}`,
          paddingLeft: '9px', // Compensate for border
        },
      })

      // ===== UTILITY CLASSES =====
      addUtilities({
        // Hide scrollbar
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },

        // Subtle scrollbar (Apple-like)
        '.scrollbar-subtle': {
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: theme('colors.neutral.300'),
            borderRadius: '3px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: theme('colors.neutral.400'),
          },
        },

        // Text truncation
        '.truncate-2': {
          display: '-webkit-box',
          '-webkit-line-clamp': '2',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },

        '.truncate-3': {
          display: '-webkit-box',
          '-webkit-line-clamp': '3',
          '-webkit-box-orient': 'vertical',
          overflow: 'hidden',
        },

        // Glass morphism (subtle)
        '.glass': {
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px) saturate(180%)',
          WebkitBackdropFilter: 'blur(10px) saturate(180%)',
        },

        // Container queries
        '.container-padding': {
          paddingLeft: theme('spacing.8'),
          paddingRight: theme('spacing.8'),

          '@media (min-width: 768px)': {
            paddingLeft: theme('spacing.12'),
            paddingRight: theme('spacing.12'),
          },

          '@media (min-width: 1024px)': {
            paddingLeft: theme('spacing.16'),
            paddingRight: theme('spacing.16'),
          },
        },
      })
    },
  ],
}
