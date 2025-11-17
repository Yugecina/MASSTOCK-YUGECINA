# MasStock Design System - Quick Reference Card

**Print this page and keep it on your desk during implementation**

---

## Color Tokens (Copy-Paste Ready)

### Backgrounds
```jsx
bg-background-primary     // #FFFFFF - main background
bg-background-secondary   // #F9FAFB - page background
bg-background-tertiary    // #F3F4F6 - card backgrounds
```

### Text Colors
```jsx
text-text-primary     // #1F2937 - headings, primary text
text-text-secondary   // #4B5563 - body text
text-text-tertiary    // #6B7280 - muted text, labels
text-text-disabled    // #9CA3AF - disabled states
text-text-inverse     // #FFFFFF - on dark backgrounds
```

### Accent & Status
```jsx
// Accent (Apple Blue)
bg-accent             // #007AFF
bg-accent-hover       // #0051D5
bg-accent-active      // #003D99
bg-accent-light       // #E8F4FF

// Status
text-success          // #34C759
bg-success-light      // #ECFDF5
text-warning          // #FF9500
bg-warning-light      // #FFF7ED
text-error            // #FF3B30
bg-error-light        // #FEF2F2
```

### Borders
```jsx
border-border-light   // #F3F4F6 - barely visible
border-border         // #E5E7EB - default
border-border-medium  // #D1D5DB - emphasized
border-border-dark    // #9CA3AF - strong separation
```

---

## Typography Scale

```jsx
// Headings
text-display font-bold     // 48px/700 - Hero only
text-h1 font-bold          // 32px/700 - Page title
text-h2 font-semibold      // 24px/600 - Section header
text-h3 font-semibold      // 20px/600 - Card title
text-h4 font-semibold      // 18px/600 - Small headers

// Body
text-body-lg               // 18px/400 - Large body
text-body                  // 16px/400 - Default
text-body-sm               // 14px/400 - Small text
text-caption font-medium   // 12px/500 - Labels
```

---

## Spacing (8px Grid)

```jsx
gap-1    // 4px  - Icon + text
gap-2    // 8px  - Tight spacing
gap-4    // 16px - Default
gap-6    // 24px - Section spacing
gap-8    // 32px - Large spacing
gap-12   // 48px - Major sections

p-4      // 16px padding
p-6      // 24px padding (default card)
p-8      // 32px padding
```

---

## Border Radius

```jsx
rounded-md     // 6px  - Badges
rounded-lg     // 12px - Buttons, inputs
rounded-xl     // 16px - Buttons (alternative)
rounded-2xl    // 20px - Cards
rounded-3xl    // 24px - Modals
```

---

## Shadows

```jsx
shadow-sm      // 0 1px 3px rgba(0,0,0,0.08)     - Default
shadow-md      // 0 4px 6px rgba(0,0,0,0.08)     - Slight elevation
shadow-lg      // 0 10px 15px rgba(0,0,0,0.08)   - Hover state
shadow-xl      // 0 20px 25px rgba(0,0,0,0.08)   - Modal
shadow-focus   // 0 0 0 4px rgba(0,122,255,0.1)  - Focus ring
```

---

## Common Component Classes

### Primary Button
```jsx
<button className="
  inline-flex items-center justify-center gap-2
  h-12 px-6
  bg-accent hover:bg-accent-hover active:bg-accent-active
  text-white font-semibold text-body
  rounded-xl
  shadow-sm hover:shadow-md
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  Button Text
</button>
```

### Secondary Button
```jsx
<button className="
  inline-flex items-center justify-center gap-2
  h-12 px-6
  bg-white hover:bg-background-secondary active:bg-background-tertiary
  text-text-primary font-semibold text-body
  border-2 border-border hover:border-border-medium
  rounded-xl
  transition-all duration-200
">
  Secondary
</button>
```

### Card
```jsx
<div className="
  bg-white
  rounded-2xl
  p-6
  border border-border-light
  shadow-sm hover:shadow-lg
  transition-shadow duration-300
">
  {children}
</div>
```

### Input
```jsx
<input className="
  w-full h-12 px-4
  text-body text-text-primary
  placeholder:text-text-disabled
  bg-white
  border-2 border-border
  rounded-xl
  focus:border-accent
  focus:ring-4 focus:ring-accent/10
  transition-all duration-200
" />
```

### Badge (Success)
```jsx
<span className="
  inline-flex items-center gap-1.5
  px-3 py-1
  text-caption font-semibold
  bg-success-light text-success
  rounded-md
">
  <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
  Active
</span>
```

---

## Layout Patterns

### Main Layout
```jsx
<div className="min-h-screen bg-background-secondary">
  <Sidebar /> {/* 280px fixed left */}
  <div className="lg:pl-70">
    <main className="p-4 md:p-6 lg:p-8">
      <div className="max-w-screen-xl mx-auto">
        {children}
      </div>
    </main>
  </div>
</div>
```

### Page Header
```jsx
<div className="mb-8">
  <h1 className="text-h1 font-bold text-text-primary mb-2">
    Page Title
  </h1>
  <p className="text-body text-text-secondary">
    Page description or subtitle
  </p>
</div>
```

### Grid (3 columns)
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Stats Grid (4 columns)
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
  {stats.map(stat => <StatCard key={stat.label} {...stat} />)}
</div>
```

---

## Responsive Breakpoints

```jsx
sm:   // 640px  - Mobile landscape
md:   // 768px  - Tablet portrait
lg:   // 1024px - Tablet landscape / Desktop
xl:   // 1280px - Large desktop

// Examples:
className="p-4 md:p-6 lg:p-8"
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="text-body-sm md:text-body"
```

---

## Transitions

```jsx
// Standard
transition-all duration-200

// Specific (better performance)
transition-colors duration-200
transition-transform duration-200
transition-shadow duration-300

// Hover effects
hover:-translate-y-1      // Lift up
hover:scale-105           // Scale up slightly
hover:shadow-lg           // Increase shadow
```

---

## Icon Sizes

```jsx
w-4 h-4     // 16px - Small icons (in buttons, badges)
w-5 h-5     // 20px - Standard icons (sidebar, inputs)
w-6 h-6     // 24px - Large icons (mobile header)
w-12 h-12   // 48px - Feature icons (workflow cards)
```

---

## Touch Targets (Mobile)

```jsx
// Minimum size for all interactive elements
min-h-11    // 44px minimum height
h-11        // 44px button
h-12        // 48px input (more comfortable)

// Spacing between touch targets
gap-2       // 8px minimum
```

---

## Z-Index Scale

```jsx
z-40        // Sticky header
z-50        // Sidebar
z-[1000]    // Dropdown menus
z-[2000]    // Modals
z-[3000]    // Toasts
```

---

## Common Patterns Cheat Sheet

### Section Header with Action
```jsx
<div className="flex items-center justify-between mb-6">
  <h2 className="text-h2 font-semibold text-text-primary">
    Section Title
  </h2>
  <button className="text-accent hover:text-accent-hover font-medium text-body-sm">
    View all →
  </button>
</div>
```

### Empty State
```jsx
<div className="flex flex-col items-center justify-center py-16 px-4 text-center">
  <div className="text-4xl mb-4 opacity-50">📋</div>
  <h3 className="text-h3 font-semibold text-text-primary mb-2">
    No items yet
  </h3>
  <p className="text-body text-text-secondary mb-6 max-w-sm">
    Description of empty state
  </p>
  <button className="btn-primary">
    Create First Item
  </button>
</div>
```

### Loading Spinner
```jsx
<div className="flex items-center justify-center min-h-[60vh]">
  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
</div>
```

### Form Field
```jsx
<div className="space-y-2">
  <label className="block text-body-sm font-medium text-text-primary">
    Field Label
  </label>
  <input
    type="text"
    className="w-full h-12 px-4 border-2 border-border rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10"
  />
  <p className="text-body-sm text-text-tertiary">
    Helper text
  </p>
</div>
```

---

## Accessibility Checklist

- [ ] All interactive elements ≥ 44x44px
- [ ] Color contrast ≥ 4.5:1 (normal text)
- [ ] Color contrast ≥ 3:1 (large text 18px+)
- [ ] Focus indicators visible (ring-4 ring-accent/10)
- [ ] Alt text on all images
- [ ] Labels for all form inputs
- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] ARIA labels where needed

---

## Performance Tips

1. Use specific transitions (not `transition-all`)
2. Animate only `transform` and `opacity`
3. Use `will-change` sparingly
4. Lazy load images
5. Code-split routes with `React.lazy`

---

## Common Mistakes to Avoid

- Don't mix spacing units (stick to 8px grid)
- Don't use custom colors (use design tokens)
- Don't create new font sizes (use scale)
- Don't forget hover/focus/active states
- Don't make touch targets < 44px
- Don't use more than 3 levels of shadow depth
- Don't animate more than 3 properties at once

---

**Print Date:** November 16, 2025
**Version:** 1.0
**For:** MasStock Implementation Team
