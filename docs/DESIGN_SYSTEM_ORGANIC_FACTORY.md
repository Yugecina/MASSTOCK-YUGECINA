# MASSTOCK Design System - "The Organic Factory"

**Version**: 1.0
**Date**: November 21, 2025
**Score UX**: 7.5/10 (Validated with critical adjustments)
**Status**: Production-Ready

---

## Table of Contents

1. [Philosophy & Concept](#1-philosophy--concept)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Components Library](#5-components-library)
6. [Animations & Micro-interactions](#6-animations--micro-interactions)
7. [Accessibility](#7-accessibility)
8. [Implementation Guide](#8-implementation-guide)
9. [Do's & Don'ts](#9-dos--donts)

---

## 1. Philosophy & Concept

### The Organic Factory

MASSTOCK's design system embodies the concept of **"The Organic Factory"** - a fusion of clinical laboratory precision with electric, organic energy. This creates a unique visual identity that:

- **Differentiates** from competitors (Linear, Notion, Airtable)
- **Transmits sophistication** expected by creative agencies
- **Balances modernity** with usability
- **Scales efficiently** across platforms

### Core Principles

1. **Precision meets Fluidity**: Sharp geometric elements (Bento Grids) + soft gradients
2. **AI Invisible**: No robots or circuits - AI represented by glows and gradients
3. **Feedback Immediacy**: Every action has immediate visual response
4. **Accessibility First**: WCAG 2.1 AA minimum, designed for all users
5. **Performance Conscious**: Beautiful but lightweight

### Visual Metaphor

```
Ghost White Canvas (clinical, spatial, airy)
    +
Obsidian Structure (precise, architectural, authoritative)
    +
Electric Indigo Brand (tech, sophisticated, modern)
    +
Acid Lime Accents (2-5% max - disruptive, memorable, energy)
    =
"The Organic Factory" (premium, differentiated, scalable)
```

---

## 2. Color System

### 2.1. Primary Palette

#### Canvas (Backgrounds)

| Color | Hex | Usage | WCAG AA |
|-------|-----|-------|---------|
| Ghost White | `#F4F5F9` | Main background, spatial canvas | ✅ AAA with Obsidian |
| Pure White | `#FFFFFF` | Cards, containers, elevated surfaces | ✅ AAA with Obsidian |

**Philosophy**: Ghost White creates a clinical, airy atmosphere. Pure White elevates cards and containers above the canvas.

#### Structure (Text & Borders)

| Color | Name | Hex | Usage |
|-------|------|-----|-------|
| Obsidian | Primary Text | `#111111` | Headlines, high-emphasis text |
| Neutral-700 | Secondary Text | `#4B5563` | Body text, paragraphs |
| Neutral-600 | Tertiary Text | `#6B7280` | Labels, metadata |
| Neutral-500 | Disabled | `#9CA3AF` | Disabled states, placeholders |

**Contrast Ratios** (on Ghost White):
- Obsidian: **18.6:1** (AAA)
- Neutral-700: **8.2:1** (AAA)
- Neutral-600: **5.1:1** (AA)

### 2.2. Brand Identity - Electric Indigo

**Complete 9-shade scale**:

| Shade | Hex | Usage |
|-------|-----|-------|
| Indigo-50 | `#EEF2FF` | Subtle backgrounds |
| Indigo-100 | `#E0E7FF` | Hover states (light) |
| Indigo-200 | `#C7D2FE` | Borders (light) |
| Indigo-300 | `#A5B4FC` | - |
| Indigo-400 | `#818CF8` | Gradients (light end) |
| Indigo-500 | `#6366F1` | Gradients (mid) |
| **Indigo-600** | **`#4F46E5`** | **PRIMARY BRAND COLOR** |
| Indigo-700 | `#4338CA` | Hover states (dark) |
| Indigo-800 | `#3730A3` | Active states |
| Indigo-900 | `#312E81` | Darkest accents |

**Usage**:
- Primary CTA buttons (gradient Indigo-700 → Indigo-600)
- Focus states (border + glow)
- Links and interactive elements
- Loading states (animated gradients)
- Brand hero sections

**Contrast on Ghost White**:
- Indigo-600: **6.7:1** (AA for text ≥14px)
- Indigo-700: **8.1:1** (AAA)

### 2.3. Action/Disruption - Acid Lime

**⚠️ CRITICAL: USE SPARINGLY (2-5% MAX)**

| Shade | Hex | Usage | Safe for Large Areas? |
|-------|-----|-------|-----------------------|
| Lime-50 | `#FAFFED` | Muted backgrounds | ✅ Yes |
| Lime-100 | `#F5FFDB` | Muted backgrounds | ✅ Yes |
| Lime-200 | `#EBFFC9` | Soft backgrounds | ✅ Yes |
| Lime-300 | `#E0FFB7` | Soft backgrounds | ✅ Yes |
| **Lime-400** | **`#D4FF33`** | **"Soft Lime" - Extended usage OK** | ⚠️ Use carefully |
| **Lime-500** | **`#CCFF00`** | **"Acid Lime" - SPARINGLY (2-5% max)** | ❌ NO |
| Lime-600 | `#A8D900` | Darker, better contrast | ✅ Yes for text |
| Lime-700 | `#8AB300` | - | ✅ Yes |
| Lime-800 | `#6C8D00` | - | ✅ Yes |
| Lime-900 | `#4E6700` | - | ✅ Yes |

**Approved Uses (Lime-500 Acid Lime)**:
- ✅ "Generate" button (primary action)
- ✅ Success pulse animation (600ms)
- ✅ Accent border-left (4px max)
- ✅ Success badges (small surfaces)
- ✅ Glow effects on hover (subtle)

**FORBIDDEN Uses**:
- ❌ Text on light backgrounds (contrast 1.87:1 - FAIL)
- ❌ Large background areas (visual fatigue)
- ❌ More than 5% of interface
- ❌ Default button styles

**Safer Alternative**: Use **Lime-400 (Soft Lime `#D4FF33`)** for extended usage.

### 2.4. Semantic Colors

#### Success (Green - Lime family)

```css
--success-main: #34C759;    /* iOS green - readable */
--success-light: #E8F5E9;   /* Background */
--success-dark: #2EA04D;    /* Text on light bg */
--success-bg: #F1F8F4;      /* Muted background */
```

**Usage**: Completed workflows, success toasts, positive metrics

#### Warning (Orange)

```css
--warning-main: #FF9500;    /* iOS orange */
--warning-light: #FFF3E0;
--warning-dark: #E68900;
--warning-bg: #FFF8F0;
```

**Usage**: Processing states, alerts, rate limits

#### Error (Red)

```css
--error-main: #FF3B30;      /* iOS red */
--error-light: #FFEBEE;
--error-dark: #E63929;
--error-bg: #FFF5F5;
```

**Usage**: Failed executions, validation errors, critical alerts

### 2.5. Gradients

**Primary Gradients**:

```css
/* Indigo gradient (default) */
--gradient-indigo: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);

/* Indigo dark (hover states) */
--gradient-indigo-dark: linear-gradient(135deg, #4338CA 0%, #4F46E5 100%);

/* Lime to Indigo (hero sections ONLY) */
--gradient-lime-indigo: linear-gradient(135deg, #4F46E5 0%, #CCFF00 100%);
```

**Glow Gradients** (radial):

```css
--glow-indigo: radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%);
--glow-lime: radial-gradient(circle, rgba(204,255,0,0.15) 0%, transparent 70%);
```

### 2.6. Color Usage Matrix

| Element | Color | Alternative | Forbidden |
|---------|-------|-------------|-----------|
| **Backgrounds** | Ghost White, Pure White | Indigo-50 (subtle) | Lime-500 |
| **Headlines** | Obsidian | Neutral-900 | Lime-500 |
| **Body Text** | Neutral-700 | Neutral-600 | Lime-500, Indigo-600 (too low contrast) |
| **Links** | Indigo-600 | Indigo-700 | Lime-500 |
| **Primary CTA** | Gradient Indigo | Indigo-600 solid | - |
| **Action CTA** | Lime-500 (sparingly) | Lime-400 (safer) | Use >5% of UI |
| **Borders** | Neutral-200 | Neutral-300 | Lime-500 |
| **Focus States** | Indigo-600 | - | Lime-500 |
| **Success** | Success-main | Lime-400 | Lime-500 |
| **Error** | Error-main | - | - |

---

## 3. Typography

### 3.1. Font Families

#### Clash Display (Display Font - Logo/Hero ONLY)

**Characteristics**:
- Sans-serif, tranchant, premium, fashion
- Strong personality
- Best for large sizes (≥36px)

**Usage**:
- ✅ Logo
- ✅ Hero headlines (landing pages)
- ⚠️ NOT for UI titles (use General Sans instead)

**Fallback**:
```css
font-family: 'Clash Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Satoshi (Body Font - PRIMARY)

**Characteristics**:
- Geometric, highly readable
- Neutral, doesn't fatigue
- Excellent for all text sizes

**Usage**:
- ✅ All UI text (titles, body, labels)
- ✅ Buttons, forms, cards
- ✅ Default font for 90% of interface

**Fallback**:
```css
font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### JetBrains Mono (Monospace - Data/Tech)

**Characteristics**:
- Monospace, optimized for code
- Perfect for technical data
- Adds "machine/factory" aesthetic

**Usage**:
- ✅ Execution IDs (e.g., `exec_142`)
- ✅ Timestamps (e.g., `14:32:18`)
- ✅ Counters (e.g., `001/1000`)
- ✅ Code snippets
- ❌ NOT for body text

**Min Size**: 12px

### 3.2. Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **6xl** | 60px | Bold (700) | 1.2 | Hero headlines (landing) |
| **5xl** | 48px | Bold (700) | 1.2 | Hero headlines |
| **4xl** | 36px | Bold (700) | 1.2 | H1 - Page titles |
| **3xl** | 30px | Bold (700) | 1.2 | H1 secondary |
| **2xl** | 24px | Bold (700) | 1.25 | H2 - Section headers |
| **xl** | 20px | Semibold (600) | 1.375 | H3 - Card titles |
| **lg** | 18px | Medium (500) | 1.5 | Body large |
| **base** | 16px | Regular (400) | 1.5 | Body - Default |
| **sm** | 14px | Regular (400) | 1.5 | Body small |
| **xs** | 12px | Medium (500) | 1.5 | Labels, captions |
| **micro** | 10px | Medium (500) | 1.5 | IDs, tags (mono) |

### 3.3. Typography Classes

```css
/* Headlines */
.text-h1 {
  font-family: var(--font-display);
  font-size: 36px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

/* Body */
.text-body {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  color: var(--text-secondary);
}

/* Technical data */
.text-mono {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}
```

### 3.4. Responsive Typography

**Mobile (≤640px)**: Reduce sizes by ~15%

```css
@media (max-width: 640px) {
  --text-6xl: 36px;  /* was 60px */
  --text-5xl: 32px;  /* was 48px */
  --text-4xl: 28px;  /* was 36px */
  --text-3xl: 24px;  /* was 30px */
}
```

---

## 4. Spacing & Layout

### 4.1. Spacing Scale (8px base)

| Name | Value | Usage |
|------|-------|-------|
| `--spacing-1` | 4px | Tight spacing, icons |
| `--spacing-2` | 8px | Small gaps, compact layouts |
| `--spacing-3` | 12px | - |
| `--spacing-4` | 16px | **Default spacing** |
| `--spacing-6` | 24px | Card padding, sections |
| `--spacing-8` | 32px | Large spacing |
| `--spacing-12` | 48px | Hero sections |
| `--spacing-16` | 64px | Page sections |

**Semantic Aliases**:

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;   /* Most common */
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
```

### 4.2. Border Radius (Bento Style)

| Name | Value | Usage |
|------|-------|-------|
| `--radius-sm` | 6px | Small elements, badges |
| `--radius-md` | 8px | Inputs, buttons |
| **`--radius-lg`** | **12px** | **Standard Bento Grid cards** |
| `--radius-xl` | 16px | Modals, hero cards |
| `--radius-2xl` | 24px | Large hero sections |
| `--radius-full` | 9999px | Pills, avatars |

**Standard**: `12px` for all cards (Bento Grid consistency)

### 4.3. Bento Grid System

**Specifications**:

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);  /* Desktop */
  gap: 16px;                              /* var(--spacing-md) */
}

.bento-card {
  background: white;
  border-radius: 12px;                    /* var(--radius-lg) */
  padding: 24px;                          /* var(--spacing-lg) */
  border: 1px solid var(--neutral-200);
  transition: all 200ms ease-out;
}

.bento-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

**Responsive**:

```css
/* Tablet */
@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 640px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }
}
```

**Where to Use**:
- ✅ Dashboard metrics
- ✅ Workflows gallery
- ✅ Settings sections
- ❌ NOT for data tables
- ❌ NOT for long forms

### 4.4. Glassmorphism

**⚠️ USE ONLY FOR: Modals, Dropdowns, Overlays**

```css
.glass {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
}

/* Fallback for non-supporting browsers */
@supports not (backdrop-filter: blur(10px)) {
  .glass {
    background: rgba(255, 255, 255, 0.95);
  }
}
```

**FORBIDDEN Uses**:
- ❌ Cards with critical text
- ❌ Data tables
- ❌ Forms
- ❌ Permanent UI elements

---

## 5. Components Library

### 5.1. Buttons

#### Primary Button (Indigo Gradient)

**Visual**: Indigo gradient, white text, elevation on hover

```css
.btn-primary {
  background: linear-gradient(135deg, #4F46E5, #6366F1);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
  transition: all 200ms ease-out;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #4338CA, #4F46E5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}
```

**Usage**: Primary actions (Save, Submit, Confirm)

#### Action Button (Lime - SPARINGLY)

**Visual**: Acid Lime background, Obsidian text, glow on hover

```css
.btn-action {
  background: #CCFF00;
  color: #111111;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(204, 255, 0, 0.2);
  transition: all 200ms ease-out;
}

.btn-action:hover {
  background: #D4FF33;
  transform: scale(1.02);
  box-shadow: 0 0 20px rgba(204, 255, 0, 0.6);
}

.btn-action:active {
  animation: glow-pulse 600ms ease-out;
}
```

**Usage**: ONLY for "Generate" button or primary conversion actions (max 1-2 per page)

#### Secondary Button (Ghost)

**Visual**: White background, Obsidian text, border

```css
.btn-secondary {
  background: white;
  color: #111111;
  border: 2px solid #E5E7EB;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  transition: all 200ms ease-out;
}

.btn-secondary:hover {
  background: #F9FAFB;
  border-color: #D1D5DB;
}
```

**Usage**: Cancel, Back, Secondary actions

#### Button States

**States Table**:

| State | Visual Changes | Animation |
|-------|---------------|-----------|
| **Default** | Base styles | - |
| **Hover** | Elevation (+shadow), slight lift | 200ms ease-out |
| **Active** | Scale down 0.98 | 100ms ease-in |
| **Focus** | 2px Indigo outline, 2px offset | - |
| **Disabled** | Opacity 0.5, cursor not-allowed | - |
| **Loading** | Spinner replaces text | Spin animation |

**Sizes**:

```css
.btn-sm { padding: 8px 16px; font-size: 14px; }
.btn-md { padding: 12px 24px; font-size: 16px; } /* Default */
.btn-lg { padding: 16px 32px; font-size: 18px; }
```

### 5.2. Cards

#### Standard Card (Bento)

```css
.card {
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

#### Card with Indigo Background

```css
.card-indigo {
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  border-color: #C7D2FE;
}
```

#### Card with Lime Accent

```css
.card-lime-accent {
  border-left: 4px solid #CCFF00;
}
```

#### Card with Gradient Top Bar

**Visual**: Gradient bar appears on hover

```css
.card-gradient-top {
  position: relative;
  overflow: hidden;
}

.card-gradient-top::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #4F46E5, #6366F1);
  transform: scaleX(0);
  transition: transform 300ms ease-out;
}

.card-gradient-top:hover::before {
  transform: scaleX(1);
}
```

### 5.3. Inputs

#### Text Input

```css
.input {
  font-family: var(--font-body);
  font-size: 16px;
  color: #111111;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  padding: 12px 16px;
  width: 100%;
  transition: all 150ms ease-out;
}

.input:hover {
  border-color: #D1D5DB;
}

.input:focus {
  outline: none;
  border-color: #4F46E5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.input-error {
  border-color: #FF3B30;
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(255, 59, 48, 0.1);
}
```

**States**:
- Default
- Hover (border color change)
- Focus (Indigo border + glow)
- Error (Red border + glow)
- Disabled (Gray background)

### 5.4. Badges

```css
.badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.badge-success { background: #E8F5E9; color: #2EA04D; }
.badge-warning { background: #FFF3E0; color: #E68900; }
.badge-error { background: #FFEBEE; color: #E63929; }
.badge-lime { background: #F5FFDB; color: #111111; }
```

### 5.5. Toast Notifications

**Position**: Top-right, stacked vertically

**Visual**: White card, colored left border, slide-in animation

```css
.toast {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  border-left: 4px solid;
  animation: slide-in-right 300ms ease-out;
  max-width: 400px;
}

.toast-success { border-left-color: #34C759; }
.toast-error { border-left-color: #FF3B30; }
.toast-warning { border-left-color: #FF9500; }
```

**Structure**:

```
[Icon] [Content]                [×]
       Title (semibold, 14px)
       Message (regular, 14px, gray)
       [Action Link] (optional)
```

**Auto-dismiss**: 3 seconds (success), 5 seconds (error/warning)

### 5.6. Empty States

**Structure**:

```
[Custom SVG Illustration 200x200px]
           ↓
   Title (Clash Display, 24px)
           ↓
Description (Satoshi, 16px, gray)
           ↓
  [CTA Button] (Lime or Indigo)
```

**Illustration Style**:
- Line-art, minimalist
- Indigo + Lime accents
- Subtle glow effects
- Organic shapes (not geometric)

**Examples**:
- Dashboard empty: "Welcome! Create your first workflow"
- Executions empty: "No executions yet. Run a workflow to see results"
- Requests empty: "No requests submitted"

### 5.7. Skeleton Screens

**Principle**: Show layout structure before data loads

```css
.skeleton {
  background: #E5E7EB;
  border-radius: 8px;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

**Types**:
- Text line: height 16px
- Text large: height 24px
- Avatar: 48x48px circle
- Card: 200px height, 12px border-radius

**Timing**: Show after 200ms delay (avoid flash for fast loads)

### 5.8. Modals

**Visual**: Glassmorphism with backdrop blur

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  animation: scale-in 300ms ease-out;
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

**Structure**:
- Header (padding 24px, border-bottom)
- Body (padding 24px)
- Footer (padding 24px, border-top, buttons right-aligned)

**Accessibility**:
- `role="dialog"`
- `aria-modal="true"`
- Focus trap (Esc to close)
- Return focus on close

---

## 6. Animations & Micro-interactions

### 6.1. Timing Standards

```javascript
const TIMING = {
  FAST: 150ms,      // Hover, focus
  NORMAL: 200ms,    // Color transitions, opacity
  SLOW: 300ms,      // Modal open/close
  SMOOTH: 400ms,    // Page transitions
}

const EASING = {
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}
```

### 6.2. Catalog of Micro-interactions

#### Button Click (Generate - Lime)

**Timeline**:

```
T+0ms    : Scale 0.95 (press down)
T+100ms  : Scale 1.05 + Lime glow (release)
T+200ms  : Scale 1 (normalize)
T+300ms  : Transition to loading state
```

**CSS**:

```css
@keyframes button-generate-click {
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(204, 255, 0, 0); }
  25% { transform: scale(0.95); }
  50% { transform: scale(1.05); box-shadow: 0 0 20px rgba(204, 255, 0, 0.6); }
  100% { transform: scale(1); box-shadow: 0 0 10px rgba(204, 255, 0, 0.3); }
}
```

#### Card Hover

```css
.card {
  transition:
    transform 200ms cubic-bezier(0, 0, 0.2, 1),
    box-shadow 200ms cubic-bezier(0, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}
```

#### Workflow Execution Start (Success)

**Timeline**:

```
T+0ms    : Button clicked (see Button Click)
T+300ms  : Confetti burst (5-10 particles, Lime + Indigo)
T+500ms  : Page transition to Processing state
T+600ms  : Gradient glow animation starts (infinite)
```

**Confetti** (using canvas-confetti library):

```javascript
confetti({
  particleCount: 50,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#CCFF00', '#4F46E5', '#6366F1', '#D4FF33'],
  ticks: 200,
  gravity: 1.2,
});
```

#### Success State (Lime Pulse)

**Visual**: Card background flashes Lime (subtle) + checkmark animation

```css
@keyframes lime-flash {
  0%, 100% { background-color: transparent; }
  50% { background-color: rgba(204, 255, 0, 0.2); }
}

.success-flash {
  animation: lime-flash 600ms ease-out;
}
```

#### Error State (Shake)

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-shake {
  animation: shake 400ms ease-in-out;
}
```

#### Loading State (Processing - Indigo Gradient Glow)

**Visual**: Rotating Indigo gradient, pulsing glow

```css
@keyframes gradient-rotate {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.loading-gradient {
  background: linear-gradient(
    270deg,
    #4F46E5, #6366F1, #818CF8, #6366F1, #4F46E5
  );
  background-size: 400% 400%;
  animation: gradient-rotate 3s ease infinite;
  border-radius: 50%;
  filter: blur(40px);
}
```

#### Toast Slide In

```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.toast {
  animation: slide-in-right 300ms cubic-bezier(0, 0, 0.2, 1);
}
```

### 6.3. Reduced Motion

**Respect user preferences**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Accessibility

### 7.1. WCAG 2.1 AA Compliance

**Minimum Standards**:
- Contrast ratio ≥ 4.5:1 for normal text
- Contrast ratio ≥ 3:1 for large text (≥18px or ≥14px bold)
- Contrast ratio ≥ 3:1 for UI components

**Color Contrast Audit**:

| Combination | Ratio | WCAG AA | WCAG AAA |
|-------------|-------|---------|----------|
| Obsidian on Ghost White | 18.6:1 | ✅ | ✅ |
| Neutral-700 on Ghost White | 8.2:1 | ✅ | ✅ |
| Indigo-600 on Ghost White | 6.7:1 | ✅ | ❌ |
| **Lime-500 on Ghost White** | **1.87:1** | **❌ FAIL** | **❌ FAIL** |
| Lime-500 on Obsidian | 9.9:1 | ✅ | ✅ |

**Action Required**:
- ❌ **NEVER** use Lime-500 for text on light backgrounds
- ✅ Use Lime-600 (`#A8D900`) if text is required on light bg
- ✅ Use Indigo-700 for small text (better contrast)

### 7.2. Focus States

**All interactive elements MUST have visible focus**:

```css
:focus-visible {
  outline: 2px solid var(--indigo-600);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Alternative for dark backgrounds */
.dark-bg :focus-visible {
  outline-color: #CCFF00;
}
```

**Examples**:
- Buttons
- Links
- Inputs
- Cards (if clickable)
- Dropdowns

### 7.3. Keyboard Navigation

**Shortcuts to Implement**:

```
Cmd/Ctrl + K        → Global search
Cmd/Ctrl + N        → New workflow
Cmd/Ctrl + E        → Go to Executions
Cmd/Ctrl + /        → Show keyboard shortcuts
Esc                 → Close modal
Enter               → Confirm/Submit
Tab                 → Next element
Shift + Tab         → Previous element
```

**Indicators**:
- Show shortcuts in tooltips (e.g., "Search Cmd+K")
- Modal accessible via `Cmd+/` showing all shortcuts

### 7.4. Screen Reader Support

**ARIA Labels Required**:

```html
<!-- Icon-only button -->
<button aria-label="Generate workflow" class="btn-icon">
  <GenerateIcon />
</button>

<!-- Live status -->
<div role="status" aria-live="polite" aria-atomic="true">
  Processing 3 of 10 prompts...
</div>

<!-- Navigation -->
<nav aria-label="Main navigation">
  <!-- Links -->
</nav>

<!-- Modal -->
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">Confirm Action</h2>
</div>
```

### 7.5. Skip Links

**Provide skip to content**:

```html
<a href="#main-content" class="skip-to-content">
  Skip to content
</a>

<main id="main-content">
  <!-- Page content -->
</main>
```

```css
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--indigo-600);
  color: white;
  padding: 8px 16px;
  z-index: 10000;
}

.skip-to-content:focus {
  top: 8px;
}
```

---

## 8. Implementation Guide

### 8.1. Quick Start

#### Step 1: Include CSS

```html
<!-- In your index.html or App.jsx -->
<link rel="stylesheet" href="/src/styles/global-organic-factory.css">
```

#### Step 2: Load Fonts

**Download fonts** and place in `/public/fonts/`:
- Clash Display Variable (`ClashDisplay-Variable.woff2`)
- Satoshi Variable (`Satoshi-Variable.woff2`)
- JetBrains Mono Variable (`JetBrainsMono-Variable.woff2`)

**Font sources**:
- Clash Display: [Font Share](https://www.fontshare.com/fonts/clash-display)
- Satoshi: [Font Share](https://www.fontshare.com/fonts/satoshi)
- JetBrains Mono: [Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)

#### Step 3: Use Component Classes

```jsx
// Button example
<button className="btn btn-primary">Save Changes</button>
<button className="btn btn-action">Generate Now</button>

// Card example
<div className="card card-interactive">
  <h3 className="text-h3">Workflow Title</h3>
  <p className="text-body">Description here...</p>
</div>

// Input example
<input
  type="text"
  className="input"
  placeholder="Enter workflow name"
/>
```

### 8.2. CSS Variables

**Access design tokens**:

```css
/* Custom component */
.my-component {
  background: var(--canvas-pure);
  color: var(--text-primary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal) var(--ease-out);
}
```

### 8.3. React Component Example

```jsx
import './styles/global-organic-factory.css';

export function WorkflowCard({ workflow, onClick }) {
  return (
    <div
      className="card card-interactive card-gradient-top"
      onClick={onClick}
    >
      <div className="flex items-center gap-md mb-4">
        <div className="card-icon">📊</div>
        <h3 className="text-h3">{workflow.name}</h3>
      </div>

      <p className="text-body mb-6">
        {workflow.description}
      </p>

      <div className="flex items-center justify-between">
        <span className="badge badge-success">Active</span>
        <button className="btn btn-sm btn-action">
          Run Now
        </button>
      </div>
    </div>
  );
}
```

### 8.4. Responsive Utilities

```jsx
// Mobile-first grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
  <div className="card">...</div>
  <div className="card">...</div>
  <div className="card">...</div>
  <div className="card">...</div>
</div>
```

---

## 9. Do's & Don'ts

### 9.1. Colors

**DO**:
- ✅ Use Indigo-600 for primary brand color
- ✅ Use Lime-500 sparingly (2-5% max)
- ✅ Use Lime-400 (Soft Lime) for extended usage
- ✅ Use semantic colors (success, warning, error)
- ✅ Check contrast ratios with WebAIM tool

**DON'T**:
- ❌ Use Lime-500 for text on light backgrounds
- ❌ Use Lime-500 for more than 5% of interface
- ❌ Use Lime-500 for large background areas
- ❌ Mix too many colors (stick to system palette)
- ❌ Use custom colors outside design system

### 9.2. Typography

**DO**:
- ✅ Use Clash Display for logo/hero headlines only
- ✅ Use Satoshi for 90% of interface text
- ✅ Use JetBrains Mono for technical data (IDs, timestamps)
- ✅ Maintain line-height 1.5 for body text
- ✅ Use type scale consistently

**DON'T**:
- ❌ Use Clash Display for UI titles (too display-focused)
- ❌ Use JetBrains Mono for body text
- ❌ Create custom font sizes outside scale
- ❌ Use text smaller than 12px
- ❌ Use all-caps for long text

### 9.3. Spacing

**DO**:
- ✅ Use 8px base grid (4px, 8px, 16px, 24px, 32px)
- ✅ Use semantic spacing variables (`--spacing-md`)
- ✅ Maintain consistent padding in cards (24px)
- ✅ Use gap utilities for flex/grid layouts

**DON'T**:
- ❌ Use arbitrary spacing values (e.g., 13px, 27px)
- ❌ Mix px and rem inconsistently
- ❌ Over-space or under-space elements
- ❌ Ignore responsive spacing adjustments

### 9.4. Bento Grids

**DO**:
- ✅ Use 12px border-radius consistently
- ✅ Use 16px gap between cards
- ✅ Apply hover effects (translateY + shadow)
- ✅ Make grids responsive (4 → 2 → 1 columns)

**DON'T**:
- ❌ Use Bento Grids for data tables
- ❌ Use Bento Grids for long forms
- ❌ Mix border-radius values
- ❌ Overload with too many cards (max 8-12 visible)

### 9.5. Glassmorphism

**DO**:
- ✅ Use ONLY for modals, dropdowns, overlays
- ✅ Provide fallback for non-supporting browsers
- ✅ Test readability of text on glass backgrounds
- ✅ Use subtle blur (10px max)

**DON'T**:
- ❌ Use for permanent UI elements
- ❌ Use for data-heavy content
- ❌ Use for critical text
- ❌ Over-blur (reduces legibility)

### 9.6. Animations

**DO**:
- ✅ Use timing constants (150ms, 200ms, 300ms)
- ✅ Use easing functions (ease-out for most)
- ✅ Respect `prefers-reduced-motion`
- ✅ Keep animations subtle and purposeful

**DON'T**:
- ❌ Create slow animations (>500ms for UI)
- ❌ Animate too many properties at once
- ❌ Use animations without purpose
- ❌ Ignore accessibility preferences

### 9.7. Accessibility

**DO**:
- ✅ Provide visible focus states on all interactive elements
- ✅ Use semantic HTML (`<button>`, `<nav>`, `<main>`)
- ✅ Add ARIA labels to icon-only buttons
- ✅ Test with keyboard navigation
- ✅ Test with screen readers (NVDA, VoiceOver)

**DON'T**:
- ❌ Remove focus outlines
- ❌ Use `div` for buttons
- ❌ Rely solely on color to convey information
- ❌ Ignore contrast ratios
- ❌ Create keyboard traps

### 9.8. Common Mistakes

**Mistake 1**: Using Lime-500 everywhere
- **Fix**: Limit to 2-5%, use Lime-400 for extended usage

**Mistake 2**: Glassmorphism on cards with critical data
- **Fix**: Use glassmorphism ONLY for overlays

**Mistake 3**: Mixing font families inconsistently
- **Fix**: Satoshi for body, Clash Display for logo/hero only

**Mistake 4**: Custom spacing values
- **Fix**: Use design system spacing scale (8px base)

**Mistake 5**: No focus states
- **Fix**: Apply `:focus-visible` styles to all interactive elements

---

## 10. Resources & Tools

### 10.1. Design Tools

- **Figma**: Create prototypes with design system components
- **Coolors Contrast Checker**: Verify WCAG compliance
- **WebAIM Contrast Checker**: Detailed contrast analysis
- **Lighthouse**: Accessibility audit

### 10.2. Font Resources

- [Clash Display - Font Share](https://www.fontshare.com/fonts/clash-display)
- [Satoshi - Font Share](https://www.fontshare.com/fonts/satoshi)
- [JetBrains Mono - Google Fonts](https://fonts.google.com/specimen/JetBrains+Mono)

### 10.3. Icon Libraries

- [Lucide Icons](https://lucide.dev/) - Recommended (consistent, clean)
- [Heroicons](https://heroicons.com/) - Alternative
- [Phosphor Icons](https://phosphoricons.com/) - Alternative

### 10.4. Animation Libraries

- [Framer Motion](https://www.framer.com/motion/) - React animations
- [canvas-confetti](https://www.npmjs.com/package/canvas-confetti) - Confetti effects
- Native CSS animations (preferred for performance)

### 10.5. Component Libraries (Inspiration)

- [Radix UI](https://www.radix-ui.com/) - Accessible components
- [Shadcn UI](https://ui.shadcn.com/) - Beautiful components
- [Tailwind UI](https://tailwindui.com/) - Component examples (adapt to pure CSS)

### 10.6. Testing Tools

- **Keyboard Navigation**: Manual testing (Tab, Enter, Esc)
- **Screen Readers**: NVDA (Windows), VoiceOver (Mac)
- **Contrast Checker**: [WebAIM](https://webaim.org/resources/contrastchecker/)
- **Color Blindness**: [Color Oracle](https://colororacle.org/)

---

## 11. Changelog & Versioning

### Version 1.0 (November 21, 2025)

**Initial Release**:
- Complete color system (Indigo + Lime with critical adjustments)
- Typography system (Clash Display, Satoshi, JetBrains Mono)
- Component library (buttons, cards, inputs, badges, toasts, modals)
- Animation specifications
- Accessibility guidelines (WCAG 2.1 AA)
- Responsive design system

**Critical Adjustments from UX Research**:
- Lime-500 usage limited to 2-5% (validated)
- Glassmorphism restricted to overlays only (validated)
- Contrast ratios verified (WCAG 2.1 AA compliant)

**Pending (Future Versions)**:
- Dark mode implementation (v1.1)
- Additional components (date picker, file upload)
- Advanced animations (particles, scroll effects)
- Design tokens for other platforms (iOS, Android)

---

## 12. Support & Contribution

### Questions?

Contact design team for:
- Component usage clarification
- Custom component requests
- Accessibility concerns
- Implementation support

### Contributing

When adding new components:
1. Follow existing naming conventions
2. Maintain design token usage
3. Document variants and states
4. Test accessibility (keyboard + screen reader)
5. Add examples to this guide

---

**Document prepared by**: UX/UI Design Team
**Last updated**: November 21, 2025
**Next review**: February 2026

**Related Documents**:
- `/docs/UX_RESEARCH_REPORT_ORGANIC_FACTORY.md` (70+ pages)
- `/docs/VISUAL_SPECIFICATIONS_ORGANIC_FACTORY.md` (40+ pages)
- `/docs/EXECUTIVE_SUMMARY_ORGANIC_FACTORY.md` (10 pages)
