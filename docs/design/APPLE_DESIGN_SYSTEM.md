# MasStock - Apple-Inspired Minimalist Design System

**Design Philosophy:** Clarity, Simplicity, Depth
**Inspiration:** Apple's design language - clean, sophisticated, functional
**Implementation:** React 19 + TailwindCSS 4.1.17

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Layout](#spacing--layout)
5. [Component Library](#component-library)
6. [Page Layouts](#page-layouts)
7. [Implementation Guidelines](#implementation-guidelines)

---

## Design Principles

### 1. Clarity Above All
- Every element has a clear purpose
- No decorative elements that don't serve function
- Strong visual hierarchy guides user attention
- High contrast for readability (WCAG AAA compliant)

### 2. Generous White Space
- Breathing room between elements (minimum 16px)
- Avoid cramped layouts
- Use white space to create visual groups
- Empty states are opportunities, not failures

### 3. Subtle Depth
- Use shadows sparingly and subtly
- Prefer soft shadows over hard borders
- Elevation creates hierarchy, not decoration
- Maximum 3 levels of depth on any screen

### 4. Purposeful Animation
- 200ms for micro-interactions
- 300ms for page transitions
- Ease-out for entering, ease-in for exiting
- Never animate more than 3 properties simultaneously

### 5. Consistent Touch Targets
- Minimum 44x44px for all interactive elements
- 8px minimum spacing between touch targets
- Clear hover/active states for all clickable elements

---

## Color System

### Primary Palette (Minimal & Refined)

```javascript
// BACKGROUND COLORS
background: {
  primary: '#FFFFFF',      // Main background - pure white
  secondary: '#F9FAFB',    // Subtle gray for sections
  tertiary: '#F3F4F6',     // Deeper gray for cards/containers
}

// TEXT COLORS (High Contrast)
text: {
  primary: '#1F2937',      // Headings, primary text - almost black
  secondary: '#4B5563',    // Body text - dark gray
  tertiary: '#6B7280',     // Secondary info - medium gray
  disabled: '#9CA3AF',     // Disabled states - light gray
  inverse: '#FFFFFF',      // Text on dark backgrounds
}

// ACCENT COLOR (Single, Strategic)
accent: {
  primary: '#007AFF',      // Apple blue - CTAs, links, primary actions
  hover: '#0051D5',        // Hover state - darker
  active: '#003D99',       // Active/pressed state - darkest
  light: '#E8F4FF',        // Light backgrounds for accent sections
  focus: 'rgba(0, 122, 255, 0.3)', // Focus ring
}

// STATUS COLORS (Minimal, Clear)
status: {
  success: '#34C759',      // Apple green
  successLight: '#ECFDF5',
  warning: '#FF9500',      // Apple orange
  warningLight: '#FFF7ED',
  error: '#FF3B30',        // Apple red
  errorLight: '#FEF2F2',
  info: '#007AFF',         // Uses accent color
  infoLight: '#EFF6FF',
}

// BORDERS & DIVIDERS (Ultra Subtle)
border: {
  light: '#F3F4F6',        // Barely visible
  default: '#E5E7EB',      // Standard dividers
  medium: '#D1D5DB',       // Emphasized borders
  dark: '#9CA3AF',         // Input borders, strong separation
}
```

### Tailwind Implementation

Update `/Users/dorian/Documents/MASSTOCK/frontend/tailwind.config.js`:

```javascript
colors: {
  // Simplified to match Apple aesthetic
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
}
```

---

## Typography

### Font Stack

```css
/* Primary: SF Pro Display (Apple's font) fallback to system fonts */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

/* Monospace: For code, data, numbers */
font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Courier, monospace;
```

### Type Scale (Mobile-First, Simplified)

```javascript
fontSize: {
  // Display - Hero sections only
  'display': ['48px', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.02em' }],

  // Headings - Clear hierarchy
  'h1': ['32px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-0.01em' }],
  'h2': ['24px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.01em' }],
  'h3': ['20px', { lineHeight: '1.4', fontWeight: '600' }],
  'h4': ['18px', { lineHeight: '1.4', fontWeight: '600' }],

  // Body - Optimal readability
  'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
  'body': ['16px', { lineHeight: '1.6', fontWeight: '400' }],
  'body-sm': ['14px', { lineHeight: '1.5', fontWeight: '400' }],

  // UI Elements
  'caption': ['12px', { lineHeight: '1.4', fontWeight: '500' }],
  'overline': ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase' }],
}

// Font Weights (Limited Selection)
fontWeight: {
  normal: '400',    // Body text
  medium: '500',    // Emphasis
  semibold: '600',  // Subheadings
  bold: '700',      // Headings
}
```

### Usage Guidelines

- **Display (48px/700):** Hero sections, marketing pages only
- **H1 (32px/700):** Page titles - one per page
- **H2 (24px/600):** Major section headers
- **H3 (20px/600):** Subsection headers, card titles
- **H4 (18px/600):** Small section headers
- **Body (16px/400):** Default text, paragraphs
- **Body SM (14px/400):** Secondary information, descriptions
- **Caption (12px/500):** Labels, metadata
- **Overline (11px/600/UPPERCASE):** Category labels, eyebrows

---

## Spacing & Layout

### Spacing Scale (8px Grid System)

```javascript
spacing: {
  '0': '0px',
  '1': '4px',      // 0.25rem - Tight spacing (icon + text)
  '2': '8px',      // 0.5rem - Small gaps
  '3': '12px',     // 0.75rem - Compact spacing
  '4': '16px',     // 1rem - DEFAULT spacing
  '5': '20px',     // 1.25rem - Comfortable spacing
  '6': '24px',     // 1.5rem - Section spacing
  '8': '32px',     // 2rem - Large spacing
  '10': '40px',    // 2.5rem - Extra large
  '12': '48px',    // 3rem - Major sections
  '16': '64px',    // 4rem - Hero spacing
  '20': '80px',    // 5rem - Page margins
}
```

### Layout Grid

```javascript
// Container widths
maxWidth: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet portrait
  'lg': '1024px',  // Tablet landscape
  'xl': '1280px',  // Desktop (DEFAULT max width)
  '2xl': '1536px', // Large desktop (avoid using)
}

// Common padding/margins
padding: {
  page: {
    mobile: '16px',   // Minimum screen edge padding
    tablet: '24px',   // Tablet edge padding
    desktop: '32px',  // Desktop edge padding
  },
  section: {
    mobile: '32px',   // Between major sections
    desktop: '48px',  // Between major sections desktop
  },
}
```

### Responsive Breakpoints

```javascript
screens: {
  'sm': '640px',   // Mobile landscape
  'md': '768px',   // Tablet portrait
  'lg': '1024px',  // Tablet landscape / Small desktop
  'xl': '1280px',  // Desktop
}
```

---

## Component Library

### 1. Buttons

#### Primary Button
```jsx
// Visual Specs:
// Height: 44px (mobile), 48px (desktop)
// Padding: 16px 24px
// Border radius: 12px
// Font: 16px/600
// Color: white on #007AFF
// Shadow: 0 1px 3px rgba(0,0,0,0.1)
// Hover: Background #0051D5, shadow 0 2px 6px rgba(0,0,0,0.15)
// Active: Background #003D99, shadow inset 0 2px 4px rgba(0,0,0,0.1)
// Transition: all 200ms ease

<button className="
  inline-flex items-center justify-center gap-2
  h-11 md:h-12 px-6
  bg-accent hover:bg-accent-hover active:bg-accent-active
  text-white font-semibold text-body
  rounded-xl
  shadow-sm hover:shadow-md active:shadow-inner
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Button Text
</button>
```

#### Secondary Button
```jsx
// Visual Specs:
// Same dimensions as primary
// Background: white
// Border: 2px solid #E5E7EB
// Text color: #1F2937
// Hover: Background #F9FAFB, border #D1D5DB
// Active: Background #F3F4F6

<button className="
  inline-flex items-center justify-center gap-2
  h-11 md:h-12 px-6
  bg-white hover:bg-background-secondary active:bg-background-tertiary
  text-text-primary font-semibold text-body
  border-2 border-border hover:border-border-medium
  rounded-xl
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Secondary
</button>
```

#### Ghost Button
```jsx
// Visual Specs:
// No background, no border
// Text color: #007AFF
// Hover: Background #F3F4F6
// Active: Background #E5E7EB

<button className="
  inline-flex items-center justify-center gap-2
  h-11 md:h-12 px-4
  text-accent hover:text-accent-hover font-semibold text-body
  hover:bg-background-tertiary active:bg-border
  rounded-xl
  transition-all duration-200
">
  Ghost Button
</button>
```

#### Icon Button
```jsx
// Visual Specs:
// Size: 44x44px (perfect square)
// Border radius: 12px
// Icon: 20x20px
// Hover: Background #F3F4F6

<button className="
  flex items-center justify-center
  w-11 h-11
  text-text-secondary hover:text-text-primary
  hover:bg-background-tertiary active:bg-border
  rounded-xl
  transition-all duration-200
">
  <svg className="w-5 h-5">...</svg>
</button>
```

### 2. Cards

#### Standard Card
```jsx
// Visual Specs:
// Background: white
// Border radius: 16px
// Padding: 24px
// Shadow: 0 1px 3px rgba(0,0,0,0.08)
// Hover: Shadow 0 4px 12px rgba(0,0,0,0.12)
// Border: 1px solid #F3F4F6

<div className="
  bg-white
  rounded-2xl
  p-6
  border border-border-light
  shadow-sm hover:shadow-lg
  transition-shadow duration-300
">
  <h3 className="text-h3 font-semibold text-text-primary mb-2">Card Title</h3>
  <p className="text-body-sm text-text-secondary">Card content goes here</p>
</div>
```

#### Stat Card (Metric Display)
```jsx
// Visual Specs:
// Same as standard card
// Number: 32px/700
// Label: 14px/500, text-secondary
// Trend indicator: 12px/600 with icon

<div className="
  bg-white rounded-2xl p-6
  border border-border-light shadow-sm
">
  <div className="flex items-start justify-between mb-2">
    <span className="text-caption text-text-tertiary uppercase tracking-wider">
      Total Workflows
    </span>
    <span className="inline-flex items-center gap-1 text-caption font-semibold text-success">
      <svg className="w-3 h-3">↑</svg>
      12%
    </span>
  </div>
  <p className="text-h1 font-bold text-text-primary">24</p>
  <p className="text-body-sm text-text-tertiary mt-1">+3 this week</p>
</div>
```

#### Workflow Card (Clickable)
```jsx
// Visual Specs:
// Same as standard card + clickable state
// Hover: Lift (translateY -2px) + shadow increase
// Cursor: pointer

<button className="
  w-full text-left
  bg-white rounded-2xl p-6
  border border-border-light
  shadow-sm hover:shadow-lg
  transition-all duration-200
  hover:-translate-y-1
  active:translate-y-0
">
  <div className="flex items-start gap-4">
    {/* Icon */}
    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-accent-light flex items-center justify-center text-2xl">
      📊
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <h3 className="text-h3 font-semibold text-text-primary mb-1 truncate">
        Workflow Name
      </h3>
      <p className="text-body-sm text-text-secondary line-clamp-2">
        Brief description of what this workflow does
      </p>

      {/* Metadata */}
      <div className="flex items-center gap-4 mt-3">
        <span className="text-caption text-text-tertiary">24 executions</span>
        <span className="inline-flex items-center gap-1 text-caption font-semibold text-success">
          +18%
        </span>
      </div>
    </div>
  </div>
</button>
```

### 3. Form Elements

#### Text Input
```jsx
// Visual Specs:
// Height: 48px
// Padding: 12px 16px
// Border: 2px solid #E5E7EB
// Border radius: 12px
// Font: 16px/400
// Focus: Border #007AFF, ring 0 0 0 3px rgba(0,122,255,0.1)

<div className="space-y-2">
  <label className="block text-body-sm font-medium text-text-primary">
    Label Text
  </label>
  <input
    type="text"
    placeholder="Placeholder text"
    className="
      w-full h-12 px-4
      text-body text-text-primary
      placeholder:text-text-disabled
      bg-white
      border-2 border-border rounded-xl
      focus:border-accent focus:ring-4 focus:ring-accent/10
      transition-all duration-200
      disabled:bg-background-secondary disabled:cursor-not-allowed
    "
  />
</div>
```

#### Select / Dropdown
```jsx
// Visual Specs:
// Same as text input
// Right chevron icon (12x12px)

<div className="space-y-2">
  <label className="block text-body-sm font-medium text-text-primary">
    Select Option
  </label>
  <div className="relative">
    <select className="
      w-full h-12 px-4 pr-10
      text-body text-text-primary
      bg-white
      border-2 border-border rounded-xl
      focus:border-accent focus:ring-4 focus:ring-accent/10
      transition-all duration-200
      appearance-none
      cursor-pointer
    ">
      <option>Option 1</option>
      <option>Option 2</option>
    </select>
    <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-text-tertiary pointer-events-none">
      {/* Chevron down icon */}
    </svg>
  </div>
</div>
```

#### Checkbox
```jsx
// Visual Specs:
// Size: 20x20px
// Border: 2px solid #D1D5DB
// Border radius: 6px
// Checked: Background #007AFF, white checkmark
// Hover: Border #007AFF

<label className="inline-flex items-center gap-3 cursor-pointer group">
  <input
    type="checkbox"
    className="
      w-5 h-5
      rounded-md border-2 border-border-medium
      text-accent
      focus:ring-4 focus:ring-accent/10
      transition-all duration-200
      cursor-pointer
      checked:bg-accent checked:border-accent
      hover:border-accent
    "
  />
  <span className="text-body text-text-primary group-hover:text-text-primary">
    Checkbox label
  </span>
</label>
```

### 4. Badges & Tags

#### Status Badge
```jsx
// Visual Specs:
// Height: 24px
// Padding: 4px 12px
// Border radius: 6px
// Font: 12px/600
// Background: Light variant of status color

{/* Success */}
<span className="
  inline-flex items-center gap-1
  px-3 py-1
  text-caption font-semibold
  bg-success-light text-success
  rounded-md
">
  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
  Active
</span>

{/* Warning */}
<span className="inline-flex items-center gap-1 px-3 py-1 text-caption font-semibold bg-warning-light text-warning rounded-md">
  <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
  Pending
</span>

{/* Error */}
<span className="inline-flex items-center gap-1 px-3 py-1 text-caption font-semibold bg-error-light text-error rounded-md">
  <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
  Failed
</span>
```

### 5. Navigation

#### Sidebar Item
```jsx
// Visual Specs:
// Height: 44px
// Padding: 12px 16px
// Border radius: 10px
// Gap between icon and text: 12px
// Active: Background #F3F4F6, text #007AFF, medium weight
// Inactive: Text #6B7280
// Hover: Background #F9FAFB

<button className="
  w-full
  flex items-center gap-3
  h-11 px-4
  text-body font-medium
  text-text-tertiary hover:text-text-primary
  hover:bg-background-secondary
  rounded-xl
  transition-all duration-200

  /* Active state */
  aria-[current=page]:bg-background-tertiary
  aria-[current=page]:text-accent
  aria-[current=page]:font-semibold
">
  <svg className="w-5 h-5 flex-shrink-0">...</svg>
  <span>Dashboard</span>
</button>
```

#### Tab Navigation
```jsx
// Visual Specs:
// Height: 44px
// Padding: 12px 20px
// Bottom border: 2px
// Active: Border #007AFF, text #007AFF/600
// Inactive: Border transparent, text #6B7280

<div className="border-b border-border">
  <nav className="flex gap-1 -mb-px">
    <button className="
      px-5 py-3
      text-body font-medium
      text-text-tertiary hover:text-text-primary
      border-b-2 border-transparent
      transition-all duration-200

      /* Active */
      aria-[current=page]:border-accent
      aria-[current=page]:text-accent
      aria-[current=page]:font-semibold
    ">
      Tab 1
    </button>
    <button className="px-5 py-3 text-body font-medium text-text-tertiary hover:text-text-primary border-b-2 border-transparent">
      Tab 2
    </button>
  </nav>
</div>
```

### 6. Loading States

#### Spinner
```jsx
// Visual Specs:
// Size: 24px (sm), 32px (md), 48px (lg)
// Border width: 3px
// Color: #007AFF
// Animation: 800ms linear infinite

<div className="inline-block">
  <svg className="animate-spin h-8 w-8 text-accent" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
  </svg>
</div>
```

#### Skeleton
```jsx
// Visual Specs:
// Background: #F3F4F6
// Animation: Pulse 2s ease-in-out infinite
// Border radius: Match element being loaded

<div className="animate-pulse space-y-4">
  <div className="h-4 bg-background-tertiary rounded w-3/4"></div>
  <div className="h-4 bg-background-tertiary rounded w-1/2"></div>
  <div className="h-4 bg-background-tertiary rounded w-5/6"></div>
</div>
```

### 7. Modals & Overlays

#### Modal
```jsx
// Visual Specs:
// Max width: 600px
// Padding: 32px
// Border radius: 20px
// Shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)
// Backdrop: rgba(0,0,0,0.4) blur(4px)

<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

  {/* Modal */}
  <div className="
    relative
    w-full max-w-lg
    bg-white
    rounded-3xl
    p-8
    shadow-2xl
    transform transition-all
  ">
    {/* Header */}
    <div className="flex items-start justify-between mb-6">
      <h2 className="text-h2 font-bold text-text-primary">Modal Title</h2>
      <button className="text-text-tertiary hover:text-text-primary">
        <svg className="w-6 h-6">✕</svg>
      </button>
    </div>

    {/* Content */}
    <div className="mb-6">
      <p className="text-body text-text-secondary">Modal content goes here</p>
    </div>

    {/* Actions */}
    <div className="flex items-center justify-end gap-3">
      <button className="btn-secondary">Cancel</button>
      <button className="btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### 8. Empty States

```jsx
// Visual Specs:
// Icon: 64x64px, opacity 0.5
// Text: Center aligned
// Primary text: 20px/600
// Secondary text: 16px/400
// Spacing: 16px between elements

<div className="flex flex-col items-center justify-center py-16 px-4">
  <div className="w-16 h-16 mb-4 opacity-50">
    <svg>...</svg>
  </div>
  <h3 className="text-h3 font-semibold text-text-primary mb-2">
    No workflows yet
  </h3>
  <p className="text-body text-text-secondary text-center mb-6 max-w-sm">
    Get started by creating your first automation workflow
  </p>
  <button className="btn-primary">
    Create Workflow
  </button>
</div>
```

---

## Page Layouts

### 1. Main Layout Structure

```jsx
// Visual Specs:
// Sidebar: 280px wide (desktop), full screen overlay (mobile)
// Header: 72px height
// Content: Max width 1280px, padding 32px
// Background: #F9FAFB

<div className="min-h-screen bg-background-secondary">
  {/* Sidebar - Desktop */}
  <aside className="
    hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col
    w-70 bg-white border-r border-border-light
  ">
    {/* Logo */}
    <div className="flex items-center h-18 px-6 border-b border-border-light">
      <h1 className="text-h3 font-bold text-text-primary">MasStock</h1>
    </div>

    {/* Navigation */}
    <nav className="flex-1 px-4 py-6 space-y-1">
      {/* Sidebar items */}
    </nav>

    {/* User Menu */}
    <div className="p-4 border-t border-border-light">
      {/* User profile */}
    </div>
  </aside>

  {/* Main Content */}
  <div className="lg:pl-70">
    {/* Header - Mobile */}
    <header className="lg:hidden sticky top-0 z-40 bg-white border-b border-border-light h-18">
      {/* Mobile header content */}
    </header>

    {/* Page Content */}
    <main className="p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        {/* Page content */}
      </div>
    </main>
  </div>
</div>
```

### 2. Dashboard Page

```jsx
// Layout Structure:
// 1. Page Header (Welcome + subtitle)
// 2. Stats Grid (2 cols mobile, 4 cols desktop)
// 3. Charts Section (Optional)
// 4. Recent Workflows Grid (1 col mobile, 3 cols desktop)

<div className="space-y-8">
  {/* Page Header */}
  <div>
    <h1 className="text-h1 font-bold text-text-primary mb-2">
      Welcome back, John
    </h1>
    <p className="text-body text-text-secondary">
      Here's what's happening with your workflows today
    </p>
  </div>

  {/* Stats Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
    <StatCard label="Active Workflows" value="24" trend="+12%" />
    <StatCard label="Total Executions" value="1,234" trend="+18%" />
    <StatCard label="Success Rate" value="98.5%" trend="+2.1%" />
    <StatCard label="Time Saved" value="42h" trend="+8h" />
  </div>

  {/* Recent Workflows Section */}
  <div>
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-h2 font-semibold text-text-primary">
        Recent Workflows
      </h2>
      <button className="text-accent hover:text-accent-hover font-medium text-body-sm">
        View all →
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <WorkflowCard {...workflow1} />
      <WorkflowCard {...workflow2} />
      <WorkflowCard {...workflow3} />
    </div>
  </div>
</div>
```

### 3. Workflows List Page

```jsx
// Layout Structure:
// 1. Page Header with Search + Filter
// 2. Grid of Workflow Cards
// 3. Pagination (if needed)

<div className="space-y-6">
  {/* Page Header */}
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 className="text-h1 font-bold text-text-primary mb-2">
        Workflows
      </h1>
      <p className="text-body text-text-secondary">
        Manage and execute your automation workflows
      </p>
    </div>

    <button className="btn-primary whitespace-nowrap">
      + New Workflow
    </button>
  </div>

  {/* Search & Filters */}
  <div className="flex flex-col sm:flex-row gap-4">
    <div className="flex-1">
      <input
        type="search"
        placeholder="Search workflows..."
        className="w-full h-12 px-4 text-body border-2 border-border rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10"
      />
    </div>
    <select className="h-12 px-4 border-2 border-border rounded-xl">
      <option>All Status</option>
      <option>Active</option>
      <option>Paused</option>
    </select>
  </div>

  {/* Workflows Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
    {workflows.map(workflow => (
      <WorkflowCard key={workflow.id} {...workflow} />
    ))}
  </div>

  {/* Empty State */}
  {workflows.length === 0 && <EmptyState />}
</div>
```

### 4. Requests (History) Page

```jsx
// Layout Structure:
// 1. Page Header with Filters
// 2. Table View (desktop) or List View (mobile)
// 3. Pagination

<div className="space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-h1 font-bold text-text-primary mb-2">
      Request History
    </h1>
    <p className="text-body text-text-secondary">
      View all workflow execution requests
    </p>
  </div>

  {/* Filters */}
  <div className="flex flex-col sm:flex-row gap-4">
    <select className="h-12 px-4 border-2 border-border rounded-xl">
      <option>All Workflows</option>
    </select>
    <select className="h-12 px-4 border-2 border-border rounded-xl">
      <option>All Status</option>
      <option>Completed</option>
      <option>Processing</option>
      <option>Failed</option>
    </select>
    <input
      type="date"
      className="h-12 px-4 border-2 border-border rounded-xl"
    />
  </div>

  {/* Table (Desktop) */}
  <div className="hidden lg:block bg-white rounded-2xl border border-border-light overflow-hidden">
    <table className="w-full">
      <thead className="bg-background-secondary">
        <tr>
          <th className="px-6 py-4 text-left text-caption font-semibold text-text-tertiary uppercase tracking-wider">
            Workflow
          </th>
          <th className="px-6 py-4 text-left text-caption font-semibold text-text-tertiary uppercase tracking-wider">
            Status
          </th>
          <th className="px-6 py-4 text-left text-caption font-semibold text-text-tertiary uppercase tracking-wider">
            Date
          </th>
          <th className="px-6 py-4 text-left text-caption font-semibold text-text-tertiary uppercase tracking-wider">
            Duration
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-border-light">
        <tr className="hover:bg-background-secondary transition-colors">
          <td className="px-6 py-4 text-body text-text-primary font-medium">
            Content Generation
          </td>
          <td className="px-6 py-4">
            <span className="badge-success">Completed</span>
          </td>
          <td className="px-6 py-4 text-body-sm text-text-secondary">
            Nov 16, 2025 14:32
          </td>
          <td className="px-6 py-4 text-body-sm text-text-secondary">
            2m 14s
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  {/* List (Mobile) */}
  <div className="lg:hidden space-y-3">
    <div className="bg-white rounded-xl p-4 border border-border-light">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-body font-semibold text-text-primary">
          Content Generation
        </h3>
        <span className="badge-success">Completed</span>
      </div>
      <div className="space-y-2 text-body-sm text-text-secondary">
        <div>Nov 16, 2025 14:32</div>
        <div>Duration: 2m 14s</div>
      </div>
    </div>
  </div>
</div>
```

### 5. Settings Page

```jsx
// Layout Structure:
// 1. Page Header
// 2. Tab Navigation (Profile, Security, Notifications, etc.)
// 3. Form Sections with clear grouping

<div className="space-y-6">
  {/* Page Header */}
  <div>
    <h1 className="text-h1 font-bold text-text-primary mb-2">
      Settings
    </h1>
    <p className="text-body text-text-secondary">
      Manage your account settings and preferences
    </p>
  </div>

  {/* Tab Navigation */}
  <div className="border-b border-border">
    <nav className="flex gap-1 -mb-px">
      <button className="px-5 py-3 text-body font-semibold text-accent border-b-2 border-accent">
        Profile
      </button>
      <button className="px-5 py-3 text-body font-medium text-text-tertiary hover:text-text-primary border-b-2 border-transparent">
        Security
      </button>
      <button className="px-5 py-3 text-body font-medium text-text-tertiary hover:text-text-primary border-b-2 border-transparent">
        Notifications
      </button>
    </nav>
  </div>

  {/* Form Content */}
  <div className="max-w-2xl">
    {/* Section */}
    <div className="bg-white rounded-2xl border border-border-light p-6">
      <h2 className="text-h3 font-semibold text-text-primary mb-6">
        Personal Information
      </h2>

      <div className="space-y-5">
        {/* Form Fields */}
        <div>
          <label className="block text-body-sm font-medium text-text-primary mb-2">
            Full Name
          </label>
          <input
            type="text"
            className="w-full h-12 px-4 border-2 border-border rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </div>

        <div>
          <label className="block text-body-sm font-medium text-text-primary mb-2">
            Email Address
          </label>
          <input
            type="email"
            className="w-full h-12 px-4 border-2 border-border rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <button className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## Implementation Guidelines

### 1. Component File Structure

```
frontend/src/components/
├── ui/                          # Basic UI components
│   ├── Button.jsx              # All button variants
│   ├── Card.jsx                # Card component
│   ├── Badge.jsx               # Status badges
│   ├── Input.jsx               # Form inputs
│   ├── Select.jsx              # Dropdowns
│   ├── Checkbox.jsx            # Checkboxes
│   ├── Modal.jsx               # Modal dialogs
│   ├── Spinner.jsx             # Loading spinners
│   ├── Skeleton.jsx            # Skeleton loaders
│   └── EmptyState.jsx          # Empty states
│
├── layout/                      # Layout components
│   ├── Sidebar.jsx             # Navigation sidebar
│   ├── Header.jsx              # Mobile header
│   ├── Layout.jsx              # Main layout wrapper
│   └── Container.jsx           # Content container
│
├── dashboard/                   # Dashboard specific
│   ├── StatCard.jsx            # Metric cards
│   ├── WorkflowCard.jsx        # Workflow cards
│   └── ChartCard.jsx           # Chart wrappers
│
└── shared/                      # Shared components
    ├── UserMenu.jsx            # User dropdown
    ├── SearchBar.jsx           # Search component
    └── Pagination.jsx          # Pagination
```

### 2. Tailwind Config Updates

Update `/Users/dorian/Documents/MASSTOCK/frontend/tailwind.config.js` with the new design tokens:

```javascript
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  theme: {
    extend: {
      // Use colors from "Color System" section above
      colors: { /* ... */ },

      // Use typography from "Typography" section
      fontSize: { /* ... */ },
      fontWeight: { /* ... */ },

      // Use spacing from "Spacing & Layout" section
      spacing: { /* ... */ },

      // Border radius (softer, more Apple-like)
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
      },

      // Animation timing
      transitionDuration: {
        'fast': '100ms',
        'normal': '200ms',
        'slow': '300ms',
      },

      // Z-index scale
      zIndex: {
        'dropdown': '1000',
        'modal': '2000',
        'toast': '3000',
      },
    },
  },
  plugins: [],
}
```

### 3. Development Workflow

#### Step 1: Update Tailwind Config
```bash
cd /Users/dorian/Documents/MASSTOCK/frontend
# Backup existing config
cp tailwind.config.js tailwind.config.js.backup
# Update with new design tokens (see section above)
```

#### Step 2: Create Base UI Components
```bash
# Create components in order of dependency:
# 1. Button, Input, Card (no dependencies)
# 2. Modal, Badge (use Button)
# 3. Layout components (use all above)
```

#### Step 3: Refactor Pages
```bash
# Update pages one at a time:
# 1. Dashboard (most visible, highest impact)
# 2. Workflows (core functionality)
# 3. Requests (data display)
# 4. Settings (forms)
```

#### Step 4: Test Responsive Behavior
```bash
# Test at breakpoints:
# - 375px (iPhone SE)
# - 768px (iPad portrait)
# - 1024px (iPad landscape)
# - 1280px (Desktop)
```

### 4. Accessibility Checklist

- [ ] All interactive elements have min 44x44px touch targets
- [ ] Color contrast ratio ≥ 4.5:1 for normal text
- [ ] Color contrast ratio ≥ 3:1 for large text (18px+)
- [ ] Focus indicators visible on all interactive elements
- [ ] All images have alt text
- [ ] Form inputs have associated labels
- [ ] Semantic HTML (headings, nav, main, etc.)
- [ ] Keyboard navigation works for all interactions
- [ ] Screen reader tested (VoiceOver/NVDA)

### 5. Performance Optimization

- [ ] Images optimized (WebP format, lazy loading)
- [ ] Icons use inline SVG (no icon font)
- [ ] CSS purged in production (Tailwind automatically does this)
- [ ] Animations use transform/opacity only (GPU accelerated)
- [ ] Critical CSS inlined for above-the-fold content
- [ ] Code-split routes (React.lazy + Suspense)

---

## Quick Reference

### Color Usage

| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Page background | #F9FAFB | `bg-background-secondary` |
| Card background | #FFFFFF | `bg-white` |
| Heading text | #1F2937 | `text-text-primary` |
| Body text | #4B5563 | `text-text-secondary` |
| Muted text | #6B7280 | `text-text-tertiary` |
| Primary button | #007AFF | `bg-accent` |
| Success | #34C759 | `text-success` |
| Warning | #FF9500 | `text-warning` |
| Error | #FF3B30 | `text-error` |
| Border | #E5E7EB | `border-border` |

### Spacing Scale

| Size | Value | Tailwind | Usage |
|------|-------|----------|--------|
| XS | 4px | `space-1` | Icon + text gap |
| SM | 8px | `space-2` | Tight spacing |
| MD | 16px | `space-4` | Default spacing |
| LG | 24px | `space-6` | Section spacing |
| XL | 32px | `space-8` | Large spacing |
| 2XL | 48px | `space-12` | Major sections |

### Typography Scale

| Element | Size/Weight | Tailwind Class | Usage |
|---------|-------------|----------------|--------|
| Display | 48px/700 | `text-display font-bold` | Hero only |
| H1 | 32px/700 | `text-h1 font-bold` | Page title |
| H2 | 24px/600 | `text-h2 font-semibold` | Section header |
| H3 | 20px/600 | `text-h3 font-semibold` | Card title |
| Body | 16px/400 | `text-body` | Default text |
| Body SM | 14px/400 | `text-body-sm` | Secondary text |
| Caption | 12px/500 | `text-caption font-medium` | Labels |

### Border Radius

| Size | Value | Tailwind | Usage |
|------|-------|----------|--------|
| SM | 6px | `rounded-md` | Badges |
| MD | 8px | `rounded-lg` | Inputs |
| LG | 12px | `rounded-xl` | Buttons |
| XL | 16px | `rounded-2xl` | Cards |
| 2XL | 20px | `rounded-3xl` | Modals |

---

## Next Steps

1. **Review & Approve** this design system
2. **Update Tailwind Config** with new tokens
3. **Create Base Components** (Button, Card, Input)
4. **Refactor Dashboard Page** as proof of concept
5. **Iterate on remaining pages**
6. **Conduct usability testing**
7. **Polish & ship**

---

**Document Version:** 1.0
**Last Updated:** November 16, 2025
**Designer:** Claude Code
**Project:** MasStock SaaS Platform
