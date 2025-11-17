# MasStock Design System Documentation

## Overview
Design system complet pour MasStock - SaaS d'automatisation de workflows pour agences IA.

**Stack:** React 18 + TailwindCSS
**Timeline:** 2-3 jours
**Figma File:** [Lien public Figma à générer]

---

## 1. COLOR PALETTE

### Primary (Actions principales)
```css
--color-primary-main: #007AFF;
--color-primary-dark: #0051D5;
--color-primary-light: #E8F4FF;
--color-primary-hover: #0051D5;
--color-primary-active: #003D99;
```

### Success (Positif)
```css
--color-success-main: #34C759;
--color-success-dark: #2EA04D;
--color-success-light: #E8F5E9;
```

### Warning (Attention)
```css
--color-warning-main: #FF9500;
--color-warning-dark: #E68900;
--color-warning-light: #FFF3E0;
```

### Error (Erreurs)
```css
--color-error-main: #FF3B30;
--color-error-dark: #E63929;
--color-error-light: #FFEBEE;
```

### Neutral (Base)
```css
--color-neutral-900: #1F2937; /* Text dark */
--color-neutral-600: #6B7280; /* Text medium */
--color-neutral-400: #9CA3AF; /* Text light/placeholder */
--color-neutral-300: #D1D5DB; /* Borders */
--color-neutral-100: #F3F4F6; /* Backgrounds */
--color-neutral-50: #F9FAFB;  /* Light backgrounds */
--color-white: #FFFFFF;
```

### Usage Examples
- **Primary buttons:** `bg-primary-main hover:bg-primary-hover`
- **Secondary buttons:** `bg-white border-2 border-neutral-300 text-neutral-900`
- **Success badges:** `bg-success-light text-success-dark`
- **Error messages:** `bg-error-light text-error-main border-error-main`

---

## 2. TYPOGRAPHY

### Font Family
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
```

Import depuis Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **H1** | 32px | 600 | 1.2 | Page titles (Dashboard, Workflows) |
| **H2** | 24px | 600 | 1.2 | Section titles |
| **H3** | 20px | 600 | 1.3 | Card titles, subsections |
| **Body** | 16px | 400 | 1.5 | Default paragraph text |
| **Body Small** | 14px | 400 | 1.5 | Secondary text, descriptions |
| **Label** | 12px | 500 | 1.4 | Form labels, captions |
| **Code** | 14px | 400 | 1.4 | IDs, timestamps, error messages |

### Tailwind Classes
```css
.text-h1 { @apply text-[32px] font-semibold leading-tight; }
.text-h2 { @apply text-2xl font-semibold leading-tight; }
.text-h3 { @apply text-xl font-semibold leading-normal; }
.text-body { @apply text-base font-normal leading-relaxed; }
.text-body-sm { @apply text-sm font-normal leading-relaxed; }
.text-label { @apply text-xs font-medium leading-snug; }
```

---

## 3. SPACING SYSTEM

Basé sur grille 8px (conforme à Tailwind):

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| xs | 4px | `p-1` / `m-1` | Tight spacing, badges |
| sm | 8px | `p-2` / `m-2` | Small gaps |
| md | 16px | `p-4` / `m-4` | Default element spacing |
| lg | 24px | `p-6` / `m-6` | Card padding, sections |
| xl | 32px | `p-8` / `m-8` | Large sections |
| 2xl | 48px | `p-12` / `m-12` | Hero sections |

### Common Patterns
- **Button padding:** `py-3 px-6` (12px 24px)
- **Card padding:** `p-6` (24px)
- **Section spacing:** `space-y-8` (32px between sections)
- **Element spacing:** `gap-4` (16px between elements)

---

## 4. COMPONENTS LIBRARY

### 4.1 BUTTON

#### Variants

**Primary (Default)**
```jsx
<button className="
  bg-primary-main hover:bg-primary-hover active:bg-primary-active
  text-white font-medium
  px-6 py-3 rounded-xl
  transition-all duration-200
  disabled:bg-neutral-300 disabled:text-neutral-400 disabled:cursor-not-allowed
">
  Label
</button>
```

**Secondary**
```jsx
<button className="
  bg-white hover:bg-neutral-50
  border-2 border-neutral-300 hover:border-neutral-400
  text-neutral-900 font-medium
  px-6 py-3 rounded-xl
  transition-all duration-200
">
  Label
</button>
```

**Danger**
```jsx
<button className="
  bg-error-main hover:bg-error-dark
  text-white font-medium
  px-6 py-3 rounded-xl
  transition-all duration-200
">
  Label
</button>
```

**Ghost**
```jsx
<button className="
  bg-transparent hover:bg-neutral-100
  text-neutral-900 font-medium
  px-6 py-3 rounded-xl
  transition-all duration-200
">
  Label
</button>
```

#### Sizes

| Size | Height | Padding | Font Size | Class |
|------|--------|---------|-----------|-------|
| Small | 32px | 8px 16px | 14px | `h-8 px-4 text-sm` |
| Medium | 40px | 12px 24px | 16px | `h-10 px-6 text-base` |
| Large | 48px | 16px 32px | 16px | `h-12 px-8 text-base` |

#### States
- **Default:** Base styles
- **Hover:** `hover:bg-primary-hover`
- **Active:** `active:bg-primary-active active:scale-95`
- **Disabled:** `disabled:opacity-50 disabled:cursor-not-allowed`
- **Loading:** Show spinner, disable interaction

---

### 4.2 INPUT FIELD

#### Base Input
```jsx
<div className="space-y-2">
  <label className="block text-label text-neutral-900 font-medium">
    Email
  </label>
  <input
    type="text"
    placeholder="votre@email.com"
    className="
      w-full h-11 px-4 py-3
      bg-white border-2 border-neutral-300
      rounded-xl
      text-base text-neutral-900 placeholder:text-neutral-400
      focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-light
      disabled:bg-neutral-100 disabled:text-neutral-400
      transition-all duration-200
    "
  />
</div>
```

#### States
- **Default:** `border-neutral-300`
- **Focus:** `focus:border-primary-main focus:ring-4 focus:ring-primary-light`
- **Error:** `border-error-main focus:ring-error-light`
- **Disabled:** `disabled:bg-neutral-100 disabled:cursor-not-allowed`

#### With Error Message
```jsx
<div className="space-y-2">
  <label className="block text-label text-neutral-900 font-medium">
    Email
  </label>
  <input
    className="border-error-main focus:ring-error-light ..."
  />
  <p className="text-sm text-error-main">Email invalide</p>
</div>
```

---

### 4.3 CARD

#### Base Card
```jsx
<div className="
  bg-white
  rounded-lg
  shadow-md
  p-6
  hover:shadow-lg
  transition-shadow duration-200
">
  {/* Card content */}
</div>
```

#### Workflow Card (with actions)
```jsx
<div className="bg-white rounded-lg shadow-md p-6 space-y-4">
  {/* Header */}
  <div className="flex items-start justify-between">
    <div>
      <h3 className="text-h3 text-neutral-900">Batch Image Generator</h3>
      <span className="inline-flex items-center px-3 py-1 mt-2 rounded-md bg-success-light text-success-dark text-label font-medium">
        ✓ Active
      </span>
    </div>
  </div>

  {/* Description */}
  <p className="text-body-sm text-neutral-600">
    Génère des images en batch avec Midjourney ou DALL-E
  </p>

  {/* Stats */}
  <div className="flex gap-4 text-body-sm text-neutral-600">
    <span>Dernière utilisation: Il y a 2h</span>
    <span>Usage ce mois: 12 fois</span>
  </div>

  {/* Actions */}
  <div className="flex gap-3 pt-2">
    <button className="btn-primary">Utiliser</button>
    <button className="btn-secondary">Historique</button>
  </div>
</div>
```

---

### 4.4 BADGE / TAG

#### Variants

**Success**
```jsx
<span className="
  inline-flex items-center px-3 py-1
  rounded-md bg-success-light text-success-dark
  text-label font-medium
">
  ✓ Active
</span>
```

**Warning**
```jsx
<span className="
  inline-flex items-center px-3 py-1
  rounded-md bg-warning-light text-warning-dark
  text-label font-medium
">
  ⏳ En attente
</span>
```

**Error**
```jsx
<span className="
  inline-flex items-center px-3 py-1
  rounded-md bg-error-light text-error-dark
  text-label font-medium
">
  ✕ Erreur
</span>
```

**Neutral**
```jsx
<span className="
  inline-flex items-center px-3 py-1
  rounded-md bg-neutral-100 text-neutral-900
  text-label font-medium
">
  Info
</span>
```

---

### 4.5 MODAL / DIALOG

```jsx
{/* Overlay */}
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

{/* Modal */}
<div className="
  fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
  bg-white rounded-2xl shadow-2xl
  w-full max-w-2xl max-h-[90vh] overflow-y-auto
  p-8
  z-50
">
  {/* Close button */}
  <button className="absolute top-4 right-4 p-2 rounded-lg hover:bg-neutral-100">
    ✕
  </button>

  {/* Header */}
  <h2 className="text-h2 text-neutral-900 mb-6">
    Titre du modal
  </h2>

  {/* Content */}
  <div className="space-y-4 mb-8">
    {/* Modal content */}
  </div>

  {/* Actions */}
  <div className="flex justify-end gap-3">
    <button className="btn-secondary">Annuler</button>
    <button className="btn-primary">Confirmer</button>
  </div>
</div>
```

---

### 4.6 SPINNER / LOADING

```jsx
<div className="
  inline-block h-6 w-6
  border-3 border-primary-main border-t-transparent
  rounded-full
  animate-spin
" />
```

Sizes:
- Small: `h-4 w-4 border-2`
- Medium: `h-6 w-6 border-3`
- Large: `h-8 w-8 border-3`

---

### 4.7 SIDEBAR NAVIGATION

```jsx
<aside className="
  fixed left-0 top-0 bottom-0
  w-70 bg-neutral-50
  border-r border-neutral-200
  p-6
  overflow-y-auto
">
  {/* Logo */}
  <div className="mb-8">
    <h1 className="text-h2 text-primary-main font-bold">MasStock</h1>
  </div>

  {/* Navigation */}
  <nav className="space-y-2">
    {/* Active item */}
    <a href="#" className="
      flex items-center gap-3 px-4 py-3
      bg-primary-light text-primary-main
      rounded-lg font-medium
    ">
      <span>📊</span>
      <span>Dashboard</span>
    </a>

    {/* Inactive item */}
    <a href="#" className="
      flex items-center gap-3 px-4 py-3
      text-neutral-600 hover:bg-neutral-100
      rounded-lg font-medium
      transition-colors duration-200
    ">
      <span>⚙️</span>
      <span>Workflows</span>
    </a>
  </nav>

  {/* User section (bottom) */}
  <div className="absolute bottom-6 left-6 right-6">
    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
      <div className="h-10 w-10 bg-primary-main rounded-full flex items-center justify-center text-white font-medium">
        E
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-900">Estee</p>
        <p className="text-xs text-neutral-600">estee@agency.com</p>
      </div>
    </div>
  </div>
</aside>
```

---

### 4.8 KPI BOX

```jsx
<div className="bg-white rounded-lg shadow-md p-6">
  <div className="flex items-center justify-between mb-2">
    <span className="text-label text-neutral-600 uppercase tracking-wide">
      Workflows actifs
    </span>
    <span className="text-2xl">⚙️</span>
  </div>
  <p className="text-h1 text-neutral-900 font-bold mb-1">
    12
  </p>
  <p className="text-body-sm text-success-main">
    +3 ce mois
  </p>
</div>
```

---

### 4.9 PROGRESS BAR

```jsx
<div className="space-y-2">
  <div className="flex justify-between text-body-sm text-neutral-600">
    <span>Progression</span>
    <span>65%</span>
  </div>
  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
    <div
      className="h-full bg-primary-main rounded-full transition-all duration-500"
      style={{ width: '65%' }}
    />
  </div>
</div>
```

---

### 4.10 DROPDOWN / SELECT

```jsx
<div className="space-y-2">
  <label className="block text-label text-neutral-900 font-medium">
    Model
  </label>
  <select className="
    w-full h-11 px-4 py-3
    bg-white border-2 border-neutral-300
    rounded-xl
    text-base text-neutral-900
    focus:outline-none focus:border-primary-main focus:ring-4 focus:ring-primary-light
    cursor-pointer
    transition-all duration-200
  ">
    <option>Midjourney</option>
    <option>DALL-E 3</option>
    <option>Stable Diffusion</option>
  </select>
</div>
```

---

## 5. LAYOUT STRUCTURE

### Desktop (1440px+)
```
┌─────────────────────────────────────────┐
│  Sidebar (280px)  │  Main Content       │
│                   │                     │
│  - Logo           │  Page content       │
│  - Navigation     │  with padding       │
│  - User info      │  (max-width 1200px) │
│                   │                     │
└─────────────────────────────────────────┘
```

### Tablet (768px-1440px)
```
┌─────────────────────────────────────────┐
│ Collapse │  Main Content (full width)   │
│  Sidebar │                              │
│  (icon)  │  Content adapts              │
└─────────────────────────────────────────┘
```

### Mobile (320px-768px)
```
┌─────────────────────┐
│  Top Bar + Hamburger│
├─────────────────────┤
│                     │
│  Content (full)     │
│                     │
└─────────────────────┘
```

### Responsive Classes
```jsx
{/* Sidebar */}
<aside className="
  hidden lg:block
  fixed left-0 top-0 bottom-0 w-70
">
  {/* Sidebar content */}
</aside>

{/* Main content */}
<main className="
  lg:ml-70
  p-4 md:p-6 lg:p-8
  max-w-7xl mx-auto
">
  {/* Page content */}
</main>

{/* Mobile hamburger */}
<button className="lg:hidden fixed top-4 left-4 z-50">
  ☰
</button>
```

---

## 6. ANIMATIONS & TRANSITIONS

### Durations
```css
--transition-fast: 100ms;
--transition-normal: 200ms;
--transition-slow: 300ms;
```

### Common Animations

**Button Hover**
```css
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Card Hover**
```css
transition: shadow 200ms ease;
```

**Modal Open**
```css
/* Overlay */
animation: fadeIn 200ms ease;

/* Modal */
animation: scaleIn 300ms cubic-bezier(0.4, 0, 0.2, 1);
```

**Loading Spinner**
```css
animation: spin 1s linear infinite;
```

**Success Message**
```css
animation: slideDown 200ms ease, fadeOut 2s ease 3s;
```

---

## 7. RESPONSIVE BREAKPOINTS

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      'sm': '481px',   // Tablet start
      'md': '769px',   // Desktop start
      'lg': '1024px',  // Large desktop
      'xl': '1441px',  // Extra large
    }
  }
}
```

### Mobile-First Approach
```jsx
{/* Base styles = mobile */}
<div className="
  p-4              {/* Mobile: 16px */}
  md:p-6           {/* Desktop: 24px */}
  lg:p-8           {/* Large: 32px */}
">

<div className="
  grid grid-cols-1    {/* Mobile: 1 column */}
  md:grid-cols-2      {/* Tablet: 2 columns */}
  lg:grid-cols-3      {/* Desktop: 3 columns */}
  gap-4
">
```

---

## 8. ACCESSIBILITY

### Color Contrast
- Text on white: Minimum 4.5:1 ratio
- Primary text: `#1F2937` (passes WCAG AA)
- Secondary text: `#6B7280` (passes WCAG AA)

### Focus States
```css
focus:outline-none focus:ring-4 focus:ring-primary-light
```

### Touch Targets
- Minimum size: 44px x 44px
- Mobile buttons: Use `h-11` minimum (44px)

### Semantic HTML
- Use proper heading hierarchy (h1, h2, h3)
- Use `<button>` for actions, `<a>` for links
- Add `aria-label` for icon-only buttons

---

## 9. FIGMA STRUCTURE

### Pages
1. **Design System** - Tous les composants
2. **Client Screens** - 10 écrans client
3. **Admin Screens** - 6 écrans admin
4. **Responsive Variants** - Mobile + Tablet versions

### Frames (par écran)
- Desktop: 1440px width
- Tablet: 768px width
- Mobile: 375px width

### Components Organization
```
📁 Components
  📁 Buttons
    - Primary
    - Secondary
    - Danger
    - Ghost
  📁 Forms
    - Input
    - Textarea
    - Select
    - Checkbox
  📁 Cards
    - Base Card
    - Workflow Card
    - KPI Card
  📁 Navigation
    - Sidebar
    - Nav Item
  📁 Feedback
    - Badge
    - Modal
    - Spinner
    - Progress Bar
```

---

## 10. DEVELOPER HANDOFF NOTES

### CSS Variables to Define
```css
:root {
  /* Colors */
  --color-primary: #007AFF;
  --color-success: #34C759;
  --color-error: #FF3B30;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;

  /* Typography */
  --font-h1: 32px;
  --font-body: 16px;

  /* Shadows */
  --shadow-md: 0 1px 3px rgba(0,0,0,0.1);
}
```

### TailwindCSS Config
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          main: '#007AFF',
          dark: '#0051D5',
          light: '#E8F4FF',
        },
        // ... other colors
      },
      borderRadius: {
        'xl': '12px',
      }
    }
  }
}
```

### Component Checklist (pour chaque composant)
- [ ] Default state styled
- [ ] Hover state defined
- [ ] Active/pressed state defined
- [ ] Disabled state defined
- [ ] Focus state (accessibility)
- [ ] Loading state (si applicable)
- [ ] Error state (si applicable)
- [ ] Mobile responsive
- [ ] Dark mode variant (future)

---

## SUCCESS CRITERIA

Design system est complet quand:
- ✅ Tous les composants ont leurs states (hover, active, disabled)
- ✅ Tokens sont exportés en JSON
- ✅ Responsive specs sont documentées
- ✅ Accessibility guidelines sont suivies
- ✅ Developer peut implémenter sans questions

---

**Version:** 1.0
**Last Updated:** 2025-11-15
**Designer:** UI-Designer Agent
**Stack:** React 18 + TailwindCSS
