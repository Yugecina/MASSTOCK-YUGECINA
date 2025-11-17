/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './public/index.html',
  ],
  theme: {
    extend: {
      colors: {
        // Primary (Blue)
        primary: {
          main: '#007AFF',
          dark: '#0051D5',
          light: '#E8F4FF',
          hover: '#0051D5',
          active: '#003D99',
        },
        // Success (Green)
        success: {
          main: '#34C759',
          dark: '#2EA04D',
          light: '#E8F5E9',
        },
        // Warning (Orange)
        warning: {
          main: '#FF9500',
          dark: '#E68900',
          light: '#FFF3E0',
        },
        // Error (Red)
        error: {
          main: '#FF3B30',
          dark: '#E63929',
          light: '#FFEBEE',
        },
        // Neutral (Gray scale)
        neutral: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          600: '#6B7280',
          900: '#1F2937',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Monaco', 'Courier', 'monospace'],
      },
      fontSize: {
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '600' }],
        'h2': ['24px', { lineHeight: '1.2', fontWeight: '600' }],
        'h3': ['20px', { lineHeight: '1.3', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'label': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'code': ['14px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
        '3xl': '64px',
        // Sidebar width
        '70': '280px',
      },
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '24px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'md': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'lg': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'xl': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        '2xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'focus': '0 0 0 3px rgba(0, 122, 255, 0.3)',
        'focus-error': '0 0 0 3px rgba(255, 59, 48, 0.3)',
      },
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
      },
      transitionTimingFunction: {
        'custom': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      zIndex: {
        'base': '0',
        'dropdown': '10',
        'sticky': '20',
        'fixed': '30',
        'modal-backdrop': '40',
        'modal': '50',
        'popover': '60',
        'tooltip': '70',
      },
      minHeight: {
        'button-sm': '32px',
        'button-md': '40px',
        'button-lg': '48px',
        'input': '44px',
      },
      maxWidth: {
        'modal': '600px',
        'content': '1200px',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
      },
    },
  },
  plugins: [
    // Custom plugin for component classes
    function({ addComponents, theme }) {
      addComponents({
        // Button components
        '.btn': {
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme('spacing.sm'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.lg'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.custom')}`,
          cursor: 'pointer',
          border: 'none',
          '&:disabled': {
            opacity: '0.5',
            cursor: 'not-allowed',
          },
        },
        '.btn-primary': {
          backgroundColor: theme('colors.primary.main'),
          color: theme('colors.white'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.primary.hover'),
          },
          '&:active:not(:disabled)': {
            backgroundColor: theme('colors.primary.active'),
            transform: 'scale(0.98)',
          },
        },
        '.btn-secondary': {
          backgroundColor: theme('colors.white'),
          color: theme('colors.neutral.900'),
          border: `2px solid ${theme('colors.neutral.300')}`,
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.neutral.50'),
            borderColor: theme('colors.neutral.400'),
          },
        },
        '.btn-danger': {
          backgroundColor: theme('colors.error.main'),
          color: theme('colors.white'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.error.dark'),
          },
        },
        '.btn-ghost': {
          backgroundColor: 'transparent',
          color: theme('colors.neutral.900'),
          '&:hover:not(:disabled)': {
            backgroundColor: theme('colors.neutral.100'),
          },
        },
        '.btn-sm': {
          height: '32px',
          padding: '8px 16px',
          fontSize: theme('fontSize.body-sm[0]'),
        },
        '.btn-md': {
          height: '40px',
          padding: '12px 24px',
          fontSize: theme('fontSize.body[0]'),
        },
        '.btn-lg': {
          height: '48px',
          padding: '16px 32px',
          fontSize: theme('fontSize.body[0]'),
        },

        // Card component
        '.card': {
          backgroundColor: theme('colors.white'),
          borderRadius: theme('borderRadius.md'),
          padding: theme('spacing.lg'),
          boxShadow: theme('boxShadow.md'),
          transition: `box-shadow ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.custom')}`,
          '&:hover': {
            boxShadow: theme('boxShadow.lg'),
          },
        },

        // Badge components
        '.badge': {
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme('spacing.xs'),
          padding: '4px 12px',
          fontSize: theme('fontSize.label[0]'),
          fontWeight: theme('fontWeight.medium'),
          borderRadius: theme('borderRadius.sm'),
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
          color: theme('colors.neutral.900'),
        },

        // Input component
        '.input': {
          width: '100%',
          height: '44px',
          padding: '12px 16px',
          fontSize: theme('fontSize.body[0]'),
          color: theme('colors.neutral.900'),
          backgroundColor: theme('colors.white'),
          border: `2px solid ${theme('colors.neutral.300')}`,
          borderRadius: theme('borderRadius.lg'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.custom')}`,
          '&::placeholder': {
            color: theme('colors.neutral.400'),
          },
          '&:focus': {
            outline: 'none',
            borderColor: theme('colors.primary.main'),
            boxShadow: theme('boxShadow.focus'),
          },
          '&:disabled': {
            backgroundColor: theme('colors.neutral.100'),
            color: theme('colors.neutral.400'),
            cursor: 'not-allowed',
          },
          '&.error': {
            borderColor: theme('colors.error.main'),
            '&:focus': {
              boxShadow: theme('boxShadow.focus-error'),
            },
          },
        },

        // Sidebar components
        '.sidebar': {
          position: 'fixed',
          left: '0',
          top: '0',
          bottom: '0',
          width: theme('spacing.70'),
          backgroundColor: theme('colors.neutral.50'),
          borderRight: `1px solid ${theme('colors.neutral.200')}`,
          padding: '24px 16px',
          overflowY: 'auto',
        },
        '.sidebar-nav-item': {
          display: 'flex',
          alignItems: 'center',
          gap: theme('spacing.md'),
          padding: '12px 16px',
          fontWeight: theme('fontWeight.medium'),
          color: theme('colors.neutral.600'),
          borderRadius: theme('borderRadius.lg'),
          transition: `all ${theme('transitionDuration.normal')} ${theme('transitionTimingFunction.custom')}`,
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: theme('colors.neutral.100'),
          },
          '&.active': {
            backgroundColor: theme('colors.primary.light'),
            color: theme('colors.primary.main'),
          },
        },

        // Progress bar
        '.progress-bar': {
          width: '100%',
          height: '8px',
          backgroundColor: theme('colors.neutral.200'),
          borderRadius: theme('borderRadius.full'),
          overflow: 'hidden',
        },
        '.progress-bar-fill': {
          height: '100%',
          backgroundColor: theme('colors.primary.main'),
          borderRadius: theme('borderRadius.full'),
          transition: `width ${theme('transitionDuration.slow')} ${theme('transitionTimingFunction.custom')}`,
        },

        // Spinner
        '.spinner': {
          display: 'inline-block',
          width: '24px',
          height: '24px',
          border: `3px solid ${theme('colors.primary.main')}`,
          borderTopColor: 'transparent',
          borderRadius: theme('borderRadius.full'),
          animation: 'spin 1s linear infinite',
        },
        '.spinner-sm': {
          width: '16px',
          height: '16px',
          borderWidth: '2px',
        },
        '.spinner-lg': {
          width: '32px',
          height: '32px',
          borderWidth: '3px',
        },
      })
    },
    // Add keyframes plugin
    function({ addUtilities }) {
      addUtilities({
        '@keyframes spin': {
          to: {
            transform: 'rotate(360deg)',
          },
        },
      })
    },
  ],
}
