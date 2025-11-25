# MasStock Design System

**Last Updated:** 2025-11-25
**Version:** 7.3 - Dark Premium Bleu Pétrole

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Component Library](#component-library)
6. [Page Structure](#page-structure)
7. [CSS Architecture](#css-architecture)
8. [Dark/Light Mode](#darklight-mode)
9. [Responsive Design](#responsive-design)
10. [Related Documentation](#related-documentation)

---

## Overview

MasStock uses a **Dark Premium** design system inspired by Linear, Vercel, and modern SaaS applications. The design prioritizes:

- **Clean, minimal interfaces** with solid cards (no glassmorphism)
- **Dark-first approach** with proper light mode support
- **Bleu Pétrole accent color** (#2E6B7B) throughout
- **Pure CSS only** - NO Tailwind (code review blocker)
- **Consistent spacing and typography** using CSS variables

### Visual Identity

| Aspect | Description |
|--------|-------------|
| Style | Dark Premium, Linear/Vercel inspired |
| Primary Color | Bleu Pétrole (#2E6B7B) |
| Background (Dark) | Soft dark gray-blue (#16181D) |
| Background (Light) | Off-white (#FAFAFA) |
| Cards | Solid with subtle borders, no glassmorphism |
| Effects | Minimal - subtle shadows, no glows/pulses |

---

## Design Philosophy

### Core Principles

1. **Dark-first**: Dark mode is the default experience
2. **Solid over glass**: Cards use solid backgrounds with borders, not transparency
3. **Minimal effects**: No excessive shadows, glows, or animations
4. **Single source of truth**: All colors reference CSS variables
5. **Component consistency**: Same styling across client and admin interfaces

### What We Avoid

- ❌ Tailwind CSS classes
- ❌ Glassmorphism / blur effects
- ❌ Gradient backgrounds on cards
- ❌ Neon glows or pulse animations
- ❌ Heavy shadows
- ❌ Inline styles (prefer CSS classes)

---

## Color System

### Accent Color Palette (Single Source of Truth)

```css
/* ACCENT COLOR PALETTE - SINGLE SOURCE OF TRUTH */
--accent-base: #2E6B7B;          /* Main accent - Bleu Pétrole */
--accent-light: #3D8A9C;         /* Lighter variant */
--accent-dark: #245560;          /* Darker variant */
--accent-darker: #1A3F48;        /* Darkest variant */

/* Light mode accent variants */
--accent-base-light: #245560;
--accent-light-light: #2E6B7B;
--accent-dark-light: #1A3F48;

/* Accent-tinted backgrounds */
--accent-bg-dark: #1A2E33;
--accent-bg-light: #F0F7F9;
```

### Dark Mode Colors (Default)

```css
/* Backgrounds */
--background: #16181D;           /* Soft dark gray-blue */
--card: #1E2028;                 /* Slightly lighter cards */
--muted: #252830;                /* Soft muted backgrounds */

/* Text */
--foreground: #F4F4F5;           /* Off-white text */
--muted-foreground: #8B8D98;     /* Softer gray text */

/* Borders */
--border: #32353F;               /* Softer border */

/* Primary (references accent) */
--primary: var(--accent-base);   /* #2E6B7B */
--primary-foreground: #FFFFFF;
```

### Light Mode Colors (`.dark` class)

```css
/* Backgrounds */
--background: #FAFAFA;
--card: #FFFFFF;
--muted: #F4F4F5;

/* Text */
--foreground: #18181B;
--muted-foreground: #71717A;

/* Borders */
--border: #E4E4E7;

/* Primary (darker for contrast) */
--primary: var(--accent-base-light);  /* #245560 */
```

### Semantic Colors

```css
/* Success */
--success: #4ADE80;
--success-light: rgba(34, 197, 94, 0.15);

/* Warning */
--warning: #F59E0B;
--warning-light: rgba(245, 158, 11, 0.15);

/* Destructive/Error */
--destructive: #EF4444;
--destructive-light: rgba(220, 38, 38, 0.15);
```

---

## Typography

### Font Stack

```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
```

### Scale

| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| Page Title | 32px | 700 | Main page headers |
| Section Title | 18-20px | 600 | Card titles, section headers |
| Body | 14-15px | 400/500 | Regular text |
| Label | 11-13px | 500 | Form labels, badges |
| Mono | 12-14px | 400 | Code, IDs, timestamps |

### Letter Spacing

- Titles: `-0.02em`
- Uppercase labels: `0.05em`
- Body: `normal`

---

## Component Library

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: var(--primary);
  color: white;
  border-radius: 8px;
  padding: 10px 20px;
}

.btn-primary:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--foreground);
}

/* Danger Button */
.btn-danger {
  background: var(--destructive);
  color: white;
}

/* Small Button */
.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
```

### Cards

```css
/* Standard Card */
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
}

/* Workflow Card (clickable) */
.workflow-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.workflow-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Badges

```css
.badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 6px;
  background: var(--muted);
  color: var(--muted-foreground);
}

.badge--primary { background: var(--accent); color: var(--primary); }
.badge--success { background: var(--success-light); color: var(--success); }
.badge--warning { background: var(--warning-light); color: #D97706; }
.badge--danger { background: var(--destructive-light); color: var(--destructive); }
```

### Inputs

```css
.input {
  padding: 10px 14px;
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 14px;
  color: var(--foreground);
  transition: all 150ms ease-out;
}

.input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(46, 107, 123, 0.15);
}
```

---

## Page Structure

### Client Layout

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px)  │  Main Content                    │
│                  │                                   │
│ ┌──────────────┐ │  ┌─────────────────────────────┐ │
│ │ Logo         │ │  │ Page Header                 │ │
│ │              │ │  │ - Title (32px, bold)        │ │
│ │ Navigation   │ │  │ - Subtitle (muted)          │ │
│ │ - Dashboard  │ │  └─────────────────────────────┘ │
│ │ - Workflows  │ │                                   │
│ │ - Executions │ │  ┌─────────────────────────────┐ │
│ │ - Settings   │ │  │ Content Area                │ │
│ │              │ │  │ - Cards, tables, forms      │ │
│ │ Dark Toggle  │ │  │ - max-width: 1200px         │ │
│ │ User Info    │ │  │ - padding: 48px             │ │
│ │ Logout       │ │  └─────────────────────────────┘ │
│ └──────────────┘ │                                   │
└─────────────────────────────────────────────────────┘
```

### Page Components

| Page | Key Components |
|------|---------------|
| Dashboard | Stats grid (4 cards), Workflow cards grid |
| Workflows | Search + sort, Workflow cards grid |
| WorkflowExecute | Step indicator, Form card, Progress, Results |
| Executions | Stats pills, Filters, Execution list |
| Settings | Info cards, Team management, Security |
| Login | Centered card, Logo, Form, Dev buttons |

### Admin Layout

Same structure as Client Layout with admin-specific navigation:
- Dashboard, Users, Clients, Workflows, Tickets, Errors, Finances, Settings

---

## CSS Architecture

### File Location

All styles are in: `frontend/src/styles/global.css`

### Section Organization

```css
/* ========================================
   1. CSS VARIABLES (Root)
   ======================================== */

/* ========================================
   2. BASE STYLES
   ======================================== */

/* ========================================
   3. DARK MODE TOGGLE
   ======================================== */

/* ========================================
   4. BUTTON SYSTEM
   ======================================== */

/* ========================================
   5. SIDEBAR
   ======================================== */

/* ========================================
   6. DASHBOARD
   ======================================== */

/* ... more sections ... */

/* ========================================
   15. SETTINGS PAGE
   ======================================== */

/* ========================================
   16. ADMIN PAGES
   ======================================== */

/* ========================================
   17. LOGIN PAGE
   ======================================== */
```

### Naming Conventions

| Pattern | Example | Use Case |
|---------|---------|----------|
| `.page-name` | `.dashboard`, `.settings-page` | Page containers |
| `.page-element` | `.dashboard-title`, `.settings-card` | Page-specific elements |
| `.component-name` | `.workflow-card`, `.admin-badge` | Reusable components |
| `.component-element` | `.workflow-card-title` | Component children |
| `.modifier--state` | `.badge--success`, `.btn--active` | State variations |

### CSS Variables Usage

```jsx
// ✅ CORRECT - Use CSS variables
<div style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>

// ✅ BETTER - Use CSS classes
<div className="workflow-card">

// ❌ WRONG - Hardcoded colors
<div style={{ background: '#1E2028', border: '1px solid #32353F' }}>

// ❌ WRONG - Tailwind classes
<div className="bg-slate-800 border-slate-600">
```

---

## Dark/Light Mode

### How It Works

- **Default**: Dark mode (no class on `<html>`)
- **Light mode**: Add `.dark` class to `<html>` (inverted naming for compatibility)
- **Toggle**: `DarkModeToggle` component in sidebar
- **Persistence**: LocalStorage (`theme` key)

### Implementation

```jsx
// DarkModeToggle.jsx
const [isLight, setIsLight] = useState(() => {
  const saved = localStorage.getItem('theme')
  return saved === 'light'  // Default to dark (false)
})

useEffect(() => {
  if (isLight) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'light')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'dark')
  }
}, [isLight])
```

### CSS Pattern for Light Mode

```css
/* Dark mode (default) */
:root {
  --background: #16181D;
  --foreground: #F4F4F5;
}

/* Light mode */
.dark {
  --background: #FAFAFA;
  --foreground: #18181B;
}

/* Component-specific overrides */
.dark .login-card {
  background: #FFFFFF;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}
```

---

## Responsive Design

### Breakpoints

```css
/* Mobile first approach */
@media (max-width: 768px) {
  .admin-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .sidebar {
    width: 100%;
    position: relative;
  }
}

@media (max-width: 480px) {
  .admin-stats-grid {
    grid-template-columns: 1fr;
  }
}
```

### Key Responsive Rules

| Element | Desktop | Mobile |
|---------|---------|--------|
| Sidebar | Fixed 240px | Full width or hidden |
| Stats grid | 4 columns | 2 or 1 column |
| Cards grid | Auto-fill, min 320px | 1 column |
| Page padding | 48px | 24px |

---

## Quick Reference

### Common CSS Classes

```css
/* Layouts */
.admin-page, .settings-page, .dashboard, .workflows-page

/* Headers */
.admin-header, .settings-header, .workflows-header

/* Titles */
.admin-title, .settings-title, .workflows-title  /* 32px, bold */
.admin-subtitle, .settings-subtitle              /* 15px, muted */

/* Cards */
.admin-card, .settings-card, .workflow-card

/* Badges */
.admin-badge, .settings-badge, .workflow-card-badge
.admin-badge--primary, .admin-badge--success, .admin-badge--danger

/* Grids */
.admin-stats-grid, .workflows-grid, .admin-cards-grid

/* Empty States */
.admin-empty, .settings-empty, .workflows-empty
```

### Color Variables Quick Reference

```css
/* Background */
var(--background)      /* Page bg */
var(--card)            /* Card bg */
var(--muted)           /* Secondary bg */

/* Text */
var(--foreground)      /* Primary text */
var(--muted-foreground) /* Secondary text */

/* Accent */
var(--primary)         /* Accent color */
var(--accent)          /* Light accent bg */

/* Borders */
var(--border)          /* Standard border */

/* Status */
var(--success)         /* Green */
var(--warning)         /* Orange */
var(--destructive)     /* Red */
```

---

## Related Documentation

- **[Project Architecture](./project_architecture.md)** - Overall system architecture
- **[SOP: Add Component](../SOP/add_component.md)** - How to create new React components
- **[CLAUDE.md](../../CLAUDE.md)** - Styling rules and development workflow

---

## Changelog

### v7.3 (2025-11-25)
- Refactored all pages to Dark Premium style
- Added Settings page styles
- Added Admin pages styles (Dashboard, Users, Clients, Workflows, Finances, Tickets, Errors, Settings)
- Unified AdminLayout and AdminSidebar with client counterparts
- Softened dark mode colors (was too intense black)

### v7.2 (2025-11-24)
- Switched accent from Bronze to Bleu Pétrole (#2E6B7B)
- Reorganized CSS with single source of truth for accent colors
- Simplified executions stats to pills
- Simplified sidebar to 240px width

### v7.1 (2025-11-23)
- Initial Dark Premium design
- Bronze accent color
- Dashboard and Workflows pages

---

**Happy designing! 🎨**
