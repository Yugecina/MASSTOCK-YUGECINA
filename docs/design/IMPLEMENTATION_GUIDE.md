# MasStock Design Implementation Guide

This guide provides step-by-step instructions to implement the Apple-inspired design system.

## Phase 1: Foundation (Day 1)

### 1.1 Update Tailwind Configuration

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/tailwind.config.js`

Replace the entire file with:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      // Apple-inspired color system
      colors: {
        background: {
          primary: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
        },
        text: {
          primary: '#1F2937',
          secondary: '#4B5563',
          tertiary: '#6B7280',
          disabled: '#9CA3AF',
          inverse: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#007AFF',
          hover: '#0051D5',
          active: '#003D99',
          light: '#E8F4FF',
        },
        success: {
          DEFAULT: '#34C759',
          light: '#ECFDF5',
        },
        warning: {
          DEFAULT: '#FF9500',
          light: '#FFF7ED',
        },
        error: {
          DEFAULT: '#FF3B30',
          light: '#FEF2F2',
        },
        border: {
          light: '#F3F4F6',
          DEFAULT: '#E5E7EB',
          medium: '#D1D5DB',
          dark: '#9CA3AF',
        },
      },

      // Typography scale
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],
        'h1': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
        'h2': ['24px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
        'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
        'overline': ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.08em' }],
      },

      // Font families
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'Courier', 'monospace'],
      },

      // Spacing (8px grid)
      spacing: {
        '70': '280px', // Sidebar width
      },

      // Border radius (soft, Apple-like)
      borderRadius: {
        'sm': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
      },

      // Shadows (subtle and layered)
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
        'focus': '0 0 0 4px rgba(0, 122, 255, 0.1)',
      },

      // Animation timing
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
      },

      // Min heights for consistency
      minHeight: {
        'button': '44px',
        'input': '48px',
      },

      // Z-index scale
      zIndex: {
        'dropdown': '1000',
        'sticky': '1100',
        'modal': '2000',
        'toast': '3000',
      },
    },
  },
  plugins: [],
}
```

### 1.2 Create Base UI Components Directory

```bash
cd /Users/dorian/Documents/MASSTOCK/frontend/src
mkdir -p components/ui
```

## Phase 2: Core UI Components (Day 1-2)

### 2.1 Button Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/ui/Button.jsx`

```jsx
import { forwardRef } from 'react'

/**
 * Button Component - Apple-inspired design
 *
 * Variants: primary, secondary, ghost, danger
 * Sizes: sm, md, lg
 */
export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-accent hover:bg-accent-hover active:bg-accent-active text-white shadow-sm hover:shadow-md',
    secondary: 'bg-white hover:bg-background-secondary active:bg-background-tertiary text-text-primary border-2 border-border hover:border-border-medium',
    ghost: 'text-accent hover:text-accent-hover hover:bg-background-tertiary active:bg-border',
    danger: 'bg-error hover:bg-error/90 active:bg-error/80 text-white shadow-sm hover:shadow-md',
  }

  const sizes = {
    sm: 'h-11 px-4 text-body-sm rounded-lg',
    md: 'h-12 px-6 text-body rounded-xl',
    lg: 'h-14 px-8 text-body-lg rounded-xl',
  }

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
      <span>{children}</span>
      {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  )
})

Button.displayName = 'Button'

// Spinner component for loading state
const Spinner = ({ size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  return (
    <svg className={`animate-spin ${sizeClasses[size]}`} viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
    </svg>
  )
}
```

### 2.2 Card Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/ui/Card.jsx`

```jsx
import { forwardRef } from 'react'

/**
 * Card Component - Container with subtle shadow and border
 *
 * Variants: default, interactive (clickable)
 */
export const Card = forwardRef(({
  children,
  interactive = false,
  padding = 'md',
  className = '',
  onClick,
  ...props
}, ref) => {
  const baseStyles = 'bg-white rounded-2xl border border-border-light transition-shadow duration-300'
  const interactiveStyles = interactive ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 active:translate-y-0' : 'shadow-sm'

  const paddingSizes = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  }

  const Component = onClick ? 'button' : 'div'

  return (
    <Component
      ref={ref}
      onClick={onClick}
      className={`${baseStyles} ${interactiveStyles} ${paddingSizes[padding]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
})

Card.displayName = 'Card'

/**
 * Card Header - Title section with optional action
 */
export const CardHeader = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div className="min-w-0 flex-1">
        <h3 className="text-h3 font-semibold text-text-primary truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-body-sm text-text-secondary mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <div className="ml-4 flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  )
}

/**
 * Card Content - Main content area
 */
export const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>
}

/**
 * Card Footer - Actions or metadata
 */
export const CardFooter = ({ children, className = '' }) => {
  return (
    <div className={`mt-4 pt-4 border-t border-border-light ${className}`}>
      {children}
    </div>
  )
}
```

### 2.3 Input Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/ui/Input.jsx`

```jsx
import { forwardRef } from 'react'

/**
 * Input Component - Text input with label and error state
 */
export const Input = forwardRef(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const hasError = Boolean(error)

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label className="block text-body-sm font-medium text-text-primary mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          className={`
            w-full h-12 px-4
            ${leftIcon ? 'pl-11' : ''}
            ${rightIcon ? 'pr-11' : ''}
            text-body text-text-primary
            placeholder:text-text-disabled
            bg-white
            border-2 rounded-xl
            ${hasError ? 'border-error' : 'border-border'}
            ${hasError ? 'focus:border-error' : 'focus:border-accent'}
            focus:ring-4
            ${hasError ? 'focus:ring-error/10' : 'focus:ring-accent/10'}
            transition-all duration-200
            disabled:bg-background-secondary disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-tertiary">
            {rightIcon}
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-2 text-body-sm text-text-tertiary">
          {hint}
        </p>
      )}

      {error && (
        <p className="mt-2 text-body-sm text-error">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'
```

### 2.4 Badge Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/ui/Badge.jsx`

```jsx
/**
 * Badge Component - Status indicators
 *
 * Variants: success, warning, error, info, neutral
 */
export const Badge = ({
  children,
  variant = 'neutral',
  dot = false,
  className = '',
}) => {
  const variants = {
    success: 'bg-success-light text-success',
    warning: 'bg-warning-light text-warning',
    error: 'bg-error-light text-error',
    info: 'bg-accent-light text-accent',
    neutral: 'bg-background-tertiary text-text-secondary',
  }

  return (
    <span className={`
      inline-flex items-center gap-1.5
      px-3 py-1
      text-caption font-semibold
      rounded-md
      ${variants[variant]}
      ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-success' :
          variant === 'warning' ? 'bg-warning' :
          variant === 'error' ? 'bg-error' :
          variant === 'info' ? 'bg-accent' :
          'bg-text-secondary'
        }`} />
      )}
      {children}
    </span>
  )
}
```

### 2.5 Empty State Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/ui/EmptyState.jsx`

```jsx
import { Button } from './Button'

/**
 * Empty State Component - Display when no data is available
 */
export const EmptyState = ({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 mb-4 text-4xl opacity-50">
          {icon}
        </div>
      )}

      <h3 className="text-h3 font-semibold text-text-primary mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-body text-text-secondary mb-6 max-w-sm">
          {description}
        </p>
      )}

      {action || (onAction && actionLabel) && (
        action || <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  )
}
```

## Phase 3: Layout Components (Day 2-3)

### 3.1 Main Layout

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/layout/Layout.jsx`

```jsx
import { useState } from 'react'
import { Sidebar } from './Sidebar'
import { MobileHeader } from './MobileHeader'

/**
 * Main Layout - App shell with sidebar navigation
 */
export const Layout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Desktop Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Mobile Sidebar */}
          <Sidebar
            className="lg:hidden"
            onClose={() => setMobileMenuOpen(false)}
          />
        </>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-70">
        {/* Mobile Header */}
        <MobileHeader
          onMenuClick={() => setMobileMenuOpen(true)}
          className="lg:hidden"
        />

        {/* Page Content */}
        <main className="p-4 md:p-6 lg:p-8">
          <div className="max-w-screen-xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
```

### 3.2 Sidebar Navigation

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/layout/Sidebar.jsx`

```jsx
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * Sidebar Component - Main navigation
 */
export const Sidebar = ({ className = '', onClose }) => {
  const { user, logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Workflows', path: '/workflows', icon: '⚡' },
    { name: 'Requests', path: '/requests', icon: '📋' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ]

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-50
      w-70 bg-white
      border-r border-border-light
      flex flex-col
      ${className}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between h-18 px-6 border-b border-border-light">
        <h1 className="text-h3 font-bold text-text-primary">
          MasStock
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden text-text-tertiary hover:text-text-primary"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3
              h-11 px-4
              text-body font-medium
              rounded-xl
              transition-all duration-200
              ${isActive
                ? 'bg-background-tertiary text-accent font-semibold'
                : 'text-text-tertiary hover:text-text-primary hover:bg-background-secondary'
              }
            `}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* User Menu */}
      <div className="p-4 border-t border-border-light">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-background-secondary">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center font-semibold">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium text-text-primary truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-caption text-text-tertiary truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full mt-2 h-11 px-4 text-body-sm font-medium text-error hover:bg-error-light rounded-xl transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

### 3.3 Mobile Header

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/layout/MobileHeader.jsx`

```jsx
/**
 * Mobile Header - Top bar for mobile devices
 */
export const MobileHeader = ({ onMenuClick, className = '' }) => {
  return (
    <header className={`
      sticky top-0 z-40
      h-18 px-4
      bg-white
      border-b border-border-light
      flex items-center justify-between
      ${className}
    `}>
      <h1 className="text-h3 font-bold text-text-primary">
        MasStock
      </h1>

      <button
        onClick={onMenuClick}
        className="w-11 h-11 flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-background-tertiary rounded-xl transition-all"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
    </header>
  )
}
```

## Phase 4: Dashboard Components (Day 3-4)

### 4.1 Stat Card Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/dashboard/StatCard.jsx`

```jsx
import { Card } from '../ui/Card'

/**
 * Stat Card - Display key metrics
 */
export const StatCard = ({
  label,
  value,
  trend,
  trendLabel,
  icon,
}) => {
  const isPositive = trend?.startsWith('+')
  const trendColor = isPositive ? 'text-success' : 'text-error'
  const trendIcon = isPositive ? '↑' : '↓'

  return (
    <Card padding="md">
      <div className="flex items-start justify-between mb-3">
        <span className="text-caption text-text-tertiary uppercase tracking-wider">
          {label}
        </span>
        {trend && (
          <span className={`inline-flex items-center gap-1 text-caption font-semibold ${trendColor}`}>
            <span className="text-xs">{trendIcon}</span>
            {trend}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <p className="text-h1 font-bold text-text-primary">
          {value}
        </p>
        {icon && (
          <span className="text-3xl opacity-50">
            {icon}
          </span>
        )}
      </div>

      {trendLabel && (
        <p className="text-body-sm text-text-tertiary mt-2">
          {trendLabel}
        </p>
      )}
    </Card>
  )
}
```

### 4.2 Workflow Card Component

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/components/dashboard/WorkflowCard.jsx`

```jsx
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

/**
 * Workflow Card - Display workflow information
 */
export const WorkflowCard = ({
  id,
  name,
  description,
  icon = '⚡',
  iconBg = 'bg-accent-light',
  executions = 0,
  status = 'active',
  trend,
  onClick,
}) => {
  const statusVariant = status === 'active' ? 'success' : 'neutral'

  return (
    <Card interactive padding="md" onClick={onClick}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center text-2xl`}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-h4 font-semibold text-text-primary truncate">
              {name}
            </h3>
            <Badge variant={statusVariant} dot>
              {status}
            </Badge>
          </div>

          <p className="text-body-sm text-text-secondary line-clamp-2 mb-3">
            {description || 'No description provided'}
          </p>

          {/* Metadata */}
          <div className="flex items-center gap-4">
            <span className="text-caption text-text-tertiary">
              {executions} {executions === 1 ? 'execution' : 'executions'}
            </span>
            {trend && (
              <span className={`inline-flex items-center gap-1 text-caption font-semibold ${
                trend.startsWith('+') ? 'text-success' : 'text-error'
              }`}>
                {trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
```

## Phase 5: Refactor Pages (Day 4-6)

### 5.1 Updated Dashboard Page

**File:** `/Users/dorian/Documents/MASSTOCK/frontend/src/pages/Dashboard.jsx`

```jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { StatCard } from '../components/dashboard/StatCard'
import { WorkflowCard } from '../components/dashboard/WorkflowCard'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import { useAuth } from '../hooks/useAuth'
import { workflowService } from '../services/workflows'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    try {
      const response = await workflowService.list()
      const workflowsData = response.data?.workflows || response.workflows || []
      setWorkflows(workflowsData)
    } catch (error) {
      console.error('Failed to load workflows:', error)
      setWorkflows([])
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    {
      label: 'Active Workflows',
      value: workflows.length.toString(),
      trend: '+12%',
      trendLabel: 'vs last month',
      icon: '⚡',
    },
    {
      label: 'Total Executions',
      value: '1,234',
      trend: '+18%',
      trendLabel: 'vs last month',
      icon: '🚀',
    },
    {
      label: 'Success Rate',
      value: '98.5%',
      trend: '+2.1%',
      trendLabel: 'Last 30 days',
      icon: '✓',
    },
    {
      label: 'Time Saved',
      value: '42h',
      trend: '+8h',
      trendLabel: 'This month',
      icon: '⏱',
    },
  ]

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-h1 font-bold text-text-primary mb-2">
            Welcome back, {user?.name || 'User'}
          </h1>
          <p className="text-body text-text-secondary">
            Here's what's happening with your workflows today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Recent Workflows Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-h2 font-semibold text-text-primary">
              Recent Workflows
            </h2>
            <Button
              variant="ghost"
              onClick={() => navigate('/workflows')}
            >
              View all →
            </Button>
          </div>

          {workflows.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
              {workflows.slice(0, 6).map((workflow, index) => (
                <WorkflowCard
                  key={workflow.id}
                  {...workflow}
                  icon={getWorkflowIcon(index)}
                  iconBg={getWorkflowIconBg(index)}
                  executions={workflow.execution_count || 0}
                  status="active"
                  trend={`+${Math.floor(Math.random() * 20)}%`}
                  onClick={() => navigate(`/workflows/${workflow.id}/execute`)}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon="⚡"
              title="No workflows yet"
              description="Get started by creating your first automation workflow to streamline your content creation process."
              actionLabel="Create Workflow"
              onAction={() => navigate('/workflows/new')}
            />
          )}
        </div>
      </div>
    </Layout>
  )
}

// Helper functions
function getWorkflowIcon(index) {
  const icons = ['📊', '📈', '📉', '💼', '📋', '⚡', '🚀', '💰', '📄']
  return icons[index % icons.length]
}

function getWorkflowIconBg(index) {
  const colors = [
    'bg-blue-100',
    'bg-green-100',
    'bg-purple-100',
    'bg-orange-100',
    'bg-cyan-100',
    'bg-indigo-100',
    'bg-pink-100',
    'bg-emerald-100',
    'bg-violet-100',
  ]
  return colors[index % colors.length]
}
```

## Testing Checklist

After implementing each phase, test the following:

### Visual Testing
- [ ] Colors match design system specifications
- [ ] Typography scales correctly on all screen sizes
- [ ] Spacing is consistent (8px grid)
- [ ] Shadows are subtle and appropriate
- [ ] Border radius is consistent

### Responsive Testing
- [ ] Mobile (375px): All elements accessible, no horizontal scroll
- [ ] Tablet (768px): Layout adapts appropriately
- [ ] Desktop (1280px+): Max width applied, content centered

### Interaction Testing
- [ ] Buttons have hover, active, focus states
- [ ] Forms have proper validation and error states
- [ ] Links and interactive elements have 44x44px touch targets
- [ ] Animations are smooth (200ms transitions)
- [ ] Loading states display correctly

### Accessibility Testing
- [ ] Color contrast ratio ≥ 4.5:1 (normal text)
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works (Tab, Enter, Esc)
- [ ] Screen reader announces content correctly
- [ ] All images have alt text
- [ ] Form inputs have associated labels

## Performance Checklist
- [ ] No layout shift on page load
- [ ] Images lazy load
- [ ] CSS is purged in production
- [ ] No unnecessary re-renders
- [ ] Bundle size is optimized

## Next Steps

1. **Week 1:** Implement Phases 1-3 (Foundation + Core Components)
2. **Week 2:** Implement Phase 4-5 (Dashboard + Remaining Pages)
3. **Week 3:** Polish, test, and iterate based on feedback

---

**Need help?** Refer to the main design system document for detailed specifications.
