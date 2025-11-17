# MasStock Design System Documentation

**Apple-Inspired Minimalist Design**

This directory contains the complete design system documentation for the MasStock platform redesign.

---

## Quick Start

**New to the project?** Start here:

1. Read the [Design System Overview](#design-system-overview) below
2. Review [APPLE_DESIGN_SYSTEM.md](./APPLE_DESIGN_SYSTEM.md) for complete specifications
3. Check [VISUAL_MOCKUPS.md](./VISUAL_MOCKUPS.md) for visual references
4. Keep [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) handy while coding

**Ready to implement?**

1. Read [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
2. Follow [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
3. Refer to [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for code snippets

---

## Design System Overview

### Philosophy

**Clarity. Simplicity. Depth.**

The MasStock design system is inspired by Apple's design language - clean, sophisticated, and functional. Every element serves a purpose. No decoration without function.

### Core Principles

1. **Clarity Above All**
   - Strong visual hierarchy
   - High contrast for readability
   - Explicit labels and actions
   - No ambiguity

2. **Generous White Space**
   - Breathing room between elements (16px minimum)
   - 8px grid system for consistency
   - Empty states are opportunities
   - Content density balanced with comfort

3. **Subtle Depth**
   - Soft shadows (0.08 opacity max)
   - Maximum 3 elevation levels
   - Borders used sparingly
   - Focus on content, not chrome

4. **Purposeful Animation**
   - 200ms for micro-interactions
   - Transform and opacity only
   - Ease-out for entering
   - Never distracting

5. **Accessible by Default**
   - WCAG AA compliance (4.5:1 contrast)
   - 44x44px touch targets
   - Keyboard navigation
   - Screen reader tested

---

## Document Structure

### 1. [APPLE_DESIGN_SYSTEM.md](./APPLE_DESIGN_SYSTEM.md)
**The Complete Specification**

Everything you need to know about the design system:
- Design principles
- Color system (with hex values)
- Typography scale
- Spacing & layout grid
- Complete component library
- Page layouts
- Implementation guidelines

**Best for:** Understanding the system deeply, reference during design decisions

**Read time:** 30-45 minutes

---

### 2. [IMPLEMENTATION_GUIDE.md](./IMPLEMENTATION_GUIDE.md)
**Step-by-Step Code Implementation**

Practical guide for developers:
- Phase-by-phase implementation
- Complete Tailwind config
- Copy-paste component code
- Testing checklist
- Accessibility checklist
- Performance tips

**Best for:** Actually building the components

**Read time:** 20-30 minutes (reference as needed)

---

### 3. [VISUAL_MOCKUPS.md](./VISUAL_MOCKUPS.md)
**Visual References & ASCII Mockups**

See what you're building:
- ASCII mockups of all pages
- Component state variations
- Layout specifications
- Animation references
- Color contrast ratios
- Export-ready CSS snippets

**Best for:** Visualizing the final result, quick reference

**Read time:** 15-20 minutes

---

### 4. [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
**Developer Cheat Sheet**

One-page reference card:
- Color tokens
- Typography classes
- Spacing scale
- Common component classes
- Layout patterns
- Accessibility checklist

**Best for:** Printing and keeping on your desk, quick lookups

**Read time:** 5 minutes (reference material)

---

### 5. [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)
**6-Day Implementation Plan**

Complete migration strategy:
- Phase-by-phase breakdown
- Timeline estimates
- Risk mitigation
- Testing strategy
- Rollback plan
- Success metrics

**Best for:** Planning the redesign rollout

**Read time:** 25-30 minutes

---

## Design System at a Glance

### Colors

**Accent (Apple Blue)**
- Primary: `#007AFF`
- Hover: `#0051D5`
- Active: `#003D99`

**Status**
- Success: `#34C759` (green)
- Warning: `#FF9500` (orange)
- Error: `#FF3B30` (red)

**Neutrals**
- Text Primary: `#1F2937` (almost black)
- Text Secondary: `#4B5563` (dark gray)
- Background: `#F9FAFB` (light gray)
- Border: `#E5E7EB` (very light gray)

### Typography

- **Display:** 48px/700 - Hero sections only
- **H1:** 32px/700 - Page titles
- **H2:** 24px/600 - Section headers
- **H3:** 20px/600 - Card titles
- **Body:** 16px/400 - Default text
- **Body SM:** 14px/400 - Secondary text
- **Caption:** 12px/500 - Labels

### Spacing (8px Grid)

- 4px - Tight spacing
- 8px - Small gaps
- 16px - Default spacing
- 24px - Section spacing
- 32px - Large spacing
- 48px - Major sections

### Border Radius

- 6px - Badges
- 12px - Buttons, inputs
- 20px - Cards
- 24px - Modals

---

## File Locations

### Design Documentation
```
/Users/dorian/Documents/MASSTOCK/docs/design/
├── README.md                    # This file
├── APPLE_DESIGN_SYSTEM.md       # Complete specification
├── IMPLEMENTATION_GUIDE.md      # Step-by-step code guide
├── VISUAL_MOCKUPS.md            # Visual references
├── QUICK_REFERENCE.md           # Developer cheat sheet
└── MIGRATION_PLAN.md            # 6-day rollout plan
```

### Frontend Implementation
```
/Users/dorian/Documents/MASSTOCK/frontend/
├── tailwind.config.js           # Design tokens
├── src/
│   ├── components/
│   │   ├── ui/                  # Base UI components
│   │   ├── layout/              # Layout components
│   │   └── dashboard/           # Dashboard components
│   └── pages/                   # Page components
```

---

## Key Design Decisions

### Why Apple-Inspired?

1. **Proven Excellence**: Apple's design language is tested at massive scale
2. **Timeless**: Won't feel dated in 6 months
3. **Professional**: Conveys quality and trust
4. **Familiar**: Users already understand these patterns
5. **Accessible**: Built-in accessibility best practices

### Why Single Accent Color?

1. **Focus**: One accent = clear hierarchy
2. **Simplicity**: Easier to maintain consistency
3. **Professional**: Multi-color systems can look juvenile
4. **Accessibility**: Easier to ensure contrast ratios
5. **Scalability**: Simpler to extend later

### Why 8px Grid?

1. **Consistency**: Eliminates spacing decisions
2. **Divisibility**: 8 divides evenly at all breakpoints
3. **Math**: Easy mental arithmetic (2x, 3x, 4x)
4. **Industry Standard**: Used by Material, Bootstrap, etc.
5. **Developer Friendly**: Fewer magic numbers

---

## Component Library

### Base UI Components

| Component | File | Purpose |
|-----------|------|---------|
| Button | `ui/Button.jsx` | All button variants |
| Card | `ui/Card.jsx` | Content containers |
| Input | `ui/Input.jsx` | Form inputs |
| Select | `ui/Select.jsx` | Dropdowns |
| Checkbox | `ui/Checkbox.jsx` | Checkboxes |
| Badge | `ui/Badge.jsx` | Status indicators |
| Modal | `ui/Modal.jsx` | Dialogs |
| Spinner | `ui/Spinner.jsx` | Loading states |
| Skeleton | `ui/Skeleton.jsx` | Loading placeholders |
| EmptyState | `ui/EmptyState.jsx` | Empty states |

### Layout Components

| Component | File | Purpose |
|-----------|------|---------|
| Layout | `layout/Layout.jsx` | Main app shell |
| Sidebar | `layout/Sidebar.jsx` | Navigation |
| MobileHeader | `layout/MobileHeader.jsx` | Mobile top bar |

### Dashboard Components

| Component | File | Purpose |
|-----------|------|---------|
| StatCard | `dashboard/StatCard.jsx` | Metric cards |
| WorkflowCard | `dashboard/WorkflowCard.jsx` | Workflow cards |
| ChartCard | `dashboard/ChartCard.jsx` | Chart wrappers |

---

## Page Layouts

### Main Pages

1. **Dashboard** - Overview with stats and recent workflows
2. **Workflows** - Grid of available workflows
3. **Requests** - Table/list of execution history
4. **Settings** - User profile and preferences

Each page follows the same structure:
1. Page header (title + description)
2. Filters/actions (if applicable)
3. Main content (grid/table/form)
4. Empty state (if no data)

---

## Responsive Breakpoints

| Breakpoint | Width | Target Device | Layout |
|------------|-------|---------------|--------|
| `sm` | 640px | Mobile landscape | Single column |
| `md` | 768px | Tablet portrait | 2 columns |
| `lg` | 1024px | Tablet landscape | 3 columns + sidebar |
| `xl` | 1280px | Desktop | Max width applied |

---

## Browser Support

### Fully Supported
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Graceful Degradation
- IE 11 (basic functionality, simplified design)

---

## Accessibility Standards

### WCAG 2.1 Level AA Compliance

- Color contrast ≥ 4.5:1 (normal text)
- Color contrast ≥ 3:1 (large text 18px+)
- Touch targets ≥ 44x44px
- Keyboard navigation support
- Screen reader compatible
- Focus indicators visible
- Form labels present
- ARIA attributes where needed

### Testing Tools

- Chrome Lighthouse
- WAVE browser extension
- axe DevTools
- VoiceOver (Mac)
- NVDA (Windows)

---

## Performance Targets

### Lighthouse Scores
- Performance: ≥ 90
- Accessibility: 100
- Best Practices: ≥ 95
- SEO: ≥ 90

### Web Vitals
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

### Bundle Size
- Initial bundle: < 200KB gzipped
- Route chunks: < 100KB each

---

## Development Workflow

### Before Starting

1. Read complete design system docs
2. Review visual mockups
3. Understand migration plan
4. Set up development environment

### During Development

1. Keep Quick Reference open
2. Follow TDD approach (write tests first)
3. Test on real devices frequently
4. Check accessibility at each step
5. Profile performance regularly

### Before Committing

1. Run all tests (`npm test`)
2. Check bundle size
3. Test responsive behavior
4. Verify accessibility
5. Review code for consistency

---

## Common Patterns

### Page Structure
```jsx
<Layout>
  <div className="space-y-8">
    {/* Header */}
    <div>
      <h1 className="text-h1 font-bold text-text-primary mb-2">
        Page Title
      </h1>
      <p className="text-body text-text-secondary">
        Description
      </p>
    </div>

    {/* Content */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Cards */}
    </div>
  </div>
</Layout>
```

### Form Field
```jsx
<div className="space-y-2">
  <label className="block text-body-sm font-medium text-text-primary">
    Label
  </label>
  <input
    className="w-full h-12 px-4 border-2 border-border rounded-xl focus:border-accent focus:ring-4 focus:ring-accent/10"
  />
</div>
```

### Card with Hover
```jsx
<Card interactive onClick={handleClick}>
  <h3 className="text-h3 font-semibold text-text-primary">
    Card Title
  </h3>
  <p className="text-body-sm text-text-secondary mt-2">
    Description
  </p>
</Card>
```

---

## Troubleshooting

### Design doesn't match specifications?

1. Check Tailwind config is loaded
2. Restart dev server (`npm run dev`)
3. Clear browser cache
4. Verify correct import paths
5. Compare with Visual Mockups doc

### Component not responsive?

1. Use mobile-first approach
2. Check breakpoint order (sm < md < lg < xl)
3. Test at actual breakpoints (375px, 768px, 1024px)
4. Use Chrome DevTools device mode

### Performance issues?

1. Profile with React DevTools
2. Check bundle size (`npm run build`)
3. Lazy load heavy components
4. Optimize images
5. Use React.memo for expensive renders

---

## Getting Help

### Resources

1. **This documentation** - Most questions answered here
2. **Implementation Guide** - Code examples for everything
3. **Visual Mockups** - See what it should look like
4. **Quick Reference** - Fast lookup of classes/tokens

### Still Stuck?

1. Check existing components for patterns
2. Review React/Tailwind docs
3. Create GitHub issue with `design-system` label
4. Ask team lead

---

## Contributing

### Adding New Components

1. Follow existing component structure
2. Use design tokens (no hardcoded values)
3. Support all states (hover, active, disabled)
4. Write tests
5. Document props
6. Add to this README

### Updating Design System

1. Discuss changes with team
2. Update specification docs
3. Update implementation guide
4. Update visual mockups
5. Migrate existing components
6. Update this README

---

## Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [x] Design system specification
- [x] Implementation guide
- [x] Visual mockups
- [x] Migration plan
- [ ] Tailwind config update
- [ ] Core UI components

### Phase 2: Migration (Weeks 3-4)
- [ ] Layout components
- [ ] Dashboard migration
- [ ] Workflows migration
- [ ] Requests migration
- [ ] Settings migration

### Phase 3: Polish (Week 5)
- [ ] Cleanup old code
- [ ] Final testing
- [ ] Performance optimization
- [ ] Accessibility audit

### Phase 4: Launch (Week 6)
- [ ] Deploy to staging
- [ ] User testing
- [ ] Deploy to production
- [ ] Monitor & iterate

### Future Enhancements
- [ ] Dark mode support
- [ ] Advanced components (tables, charts)
- [ ] Animation library
- [ ] Design system documentation site
- [ ] Figma component library

---

## Changelog

### v1.0.0 - 2025-11-16
- Initial design system specification
- Complete implementation guide
- Visual mockups created
- Migration plan documented
- Quick reference card created

---

## License

This design system is proprietary to MasStock and should not be used outside this project without permission.

---

## Credits

**Designed by:** Claude Code (AI Design Assistant)
**Inspiration:** Apple Design Language
**Stack:** React 19 + Tailwind CSS 4.1.17
**Timeline:** 6-day sprint implementation

---

**Questions?** Start with the [Quick Reference](./QUICK_REFERENCE.md) or [Implementation Guide](./IMPLEMENTATION_GUIDE.md).

**Ready to build?** Follow the [Migration Plan](./MIGRATION_PLAN.md).

**Need inspiration?** Check the [Visual Mockups](./VISUAL_MOCKUPS.md).
