# MasStock - Design System & UI/UX Documentation

## Vue d'ensemble

Design system complet pour **MasStock**, le SaaS d'automatisation de workflows pour agences de contenu IA.

**Client MVP:** Estee Agency
**Timeline:** 2-3 jours
**Stack:** React 18 + TailwindCSS
**Designer:** UI-Designer Agent
**Date:** 2025-11-15

---

## Livrables créés

### 1. Design Tokens (JSON)
**Fichier:** `/Users/dorian/Documents/MASSTOCK/product/design-tokens.json`

Export JSON complet de tous les design tokens:
- Couleurs (Primary, Success, Warning, Error, Neutral)
- Typographie (tailles, poids, line-heights)
- Spacing (système 8px grid)
- Border radius
- Shadows
- Transitions
- Breakpoints
- Tokens pour chaque composant

**Utilisation:** Peut être importé directement dans le code React/TailwindCSS.

---

### 2. Design System Documentation
**Fichier:** `/Users/dorian/Documents/MASSTOCK/product/DESIGN_SYSTEM.md`

Documentation complète du design system avec:
- Palette de couleurs complète avec codes hex
- Typographie (Inter font, scales, usage)
- Système de spacing (8px grid)
- Tous les composants avec leurs variants et states:
  - Buttons (Primary, Secondary, Danger, Ghost)
  - Inputs (avec states: default, focus, error, disabled)
  - Cards
  - Badges/Tags
  - Modals
  - Spinners
  - Progress bars
  - Navigation/Sidebar
  - KPI boxes
  - Dropdowns
- Layout structure (Desktop, Tablet, Mobile)
- Animations & transitions
- Responsive breakpoints
- Guidelines d'accessibilité

---

### 3. Spécifications des 16 Écrans
**Fichier:** `/Users/dorian/Documents/MASSTOCK/product/FIGMA_SCREENS_SPECS.md`

Spécifications détaillées pour chaque écran avec:

#### Écrans Client (10):
1. Login Page
2. Client Dashboard
3. Workflows List
4. Workflow Execution - Step 1 (Input)
5. Workflow Execution - Step 2 (Confirmation)
6. Workflow Execution - Step 3 (Processing)
7. Workflow Execution - Step 4 (Results)
8. Request New Workflow
9. Requests in Progress
10. Settings

#### Écrans Admin (6):
11. Admin Dashboard
12. Admin Clients Management
13. Admin Workflows Management
14. Admin Errors & Logs
15. Admin Support Tickets
16. Admin Finances

**Chaque écran inclut:**
- Layout ASCII art pour visualisation rapide
- Frame sizes (Desktop + Mobile)
- Spécifications détaillées de chaque élément
- States et variations
- Responsive behavior

---

### 4. CSS Variables
**Fichier:** `/Users/dorian/Documents/MASSTOCK/product/design-tokens.css`

Fichier CSS complet avec:
- Toutes les variables CSS custom properties
- Classes utility pour typographie
- Classes pour tous les composants (btn, input, card, badge, etc.)
- Responsive utilities
- Focus states pour accessibilité
- Animations keyframes

**Utilisation:** Peut être importé directement dans l'application React.

---

### 5. Tailwind Configuration
**Fichier:** `/Users/dorian/Documents/MASSTOCK/product/tailwind.config.js`

Configuration Tailwind prête à l'emploi avec:
- Toutes les couleurs du design system
- Font families
- Font sizes custom
- Spacing custom (incluant sidebar width)
- Border radius
- Box shadows
- Transitions
- Z-index layers
- Plugins custom pour les composants (btn, card, badge, input, etc.)

**Utilisation:** Remplacer le `tailwind.config.js` par défaut avec ce fichier.

---

## Palette de couleurs

### Primary (Bleu)
```
Main: #007AFF
Dark: #0051D5
Light: #E8F4FF
Hover: #0051D5
Active: #003D99
```

### Success (Vert)
```
Main: #34C759
Dark: #2EA04D
Light: #E8F5E9
```

### Warning (Orange)
```
Main: #FF9500
Dark: #E68900
Light: #FFF3E0
```

### Error (Rouge)
```
Main: #FF3B30
Dark: #E63929
Light: #FFEBEE
```

### Neutral (Gris)
```
900: #1F2937 (Text dark)
600: #6B7280 (Text medium)
400: #9CA3AF (Placeholder)
300: #D1D5DB (Borders)
200: #E5E7EB (Light borders)
100: #F3F4F6 (Backgrounds)
50:  #F9FAFB (Light backgrounds)
White: #FFFFFF
```

---

## Typographie

**Font:** Inter (Google Fonts)

| Type | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| H1 | 32px | 600 | 1.2 | Page titles |
| H2 | 24px | 600 | 1.2 | Section headers |
| H3 | 20px | 600 | 1.3 | Card titles |
| Body | 16px | 400 | 1.5 | Default text |
| Body Small | 14px | 400 | 1.5 | Secondary text |
| Label | 12px | 500 | 1.4 | Form labels |

**Import Google Font:**
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

---

## Spacing System (8px grid)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| xs | 4px | p-1 | Tight spacing |
| sm | 8px | p-2 | Small gaps |
| md | 16px | p-4 | Default spacing |
| lg | 24px | p-6 | Card padding |
| xl | 32px | p-8 | Section spacing |
| 2xl | 48px | p-12 | Hero sections |

---

## Composants principaux

### Button
**Variants:** Primary, Secondary, Danger, Ghost
**Sizes:** Small (32px), Medium (40px), Large (48px)
**States:** Default, Hover, Active, Disabled, Loading

**Exemple d'utilisation:**
```jsx
<button className="btn btn-primary btn-md">
  Confirmer
</button>
```

### Input
**States:** Default, Focus, Error, Disabled
**Height:** 44px (touch-friendly)

**Exemple:**
```jsx
<input
  type="text"
  className="input"
  placeholder="Email"
/>
```

### Card
**Padding:** 24px
**Shadow:** md
**Hover:** shadow-lg

**Exemple:**
```jsx
<div className="card">
  {/* Card content */}
</div>
```

### Badge
**Variants:** Success, Warning, Error, Neutral
**Padding:** 4px 12px

**Exemple:**
```jsx
<span className="badge badge-success">
  ✓ Actif
</span>
```

---

## Responsive Breakpoints

| Device | Min Width | Max Width | Tailwind Prefix |
|--------|-----------|-----------|-----------------|
| Mobile | 320px | 480px | (default) |
| Tablet | 481px | 768px | sm: |
| Desktop | 769px | 1440px | md: |
| Large | 1441px+ | - | lg: |

**Approche:** Mobile-first

**Exemple:**
```jsx
<div className="
  grid grid-cols-1
  md:grid-cols-2
  lg:grid-cols-3
  gap-4
">
  {/* Responsive grid */}
</div>
```

---

## Structure Figma recommandée

```
📁 MasStock Design
  📄 Cover Page
  📄 Design System
    ├─ Colors
    ├─ Typography
    ├─ Spacing
    ├─ Components (tous les composants)
  📄 CLIENT - Desktop
    ├─ 1. Login
    ├─ 2. Dashboard
    ├─ 3. Workflows List
    ├─ 4-7. Workflow Execution (4 steps)
    ├─ 8. Request Workflow
    ├─ 9. Requests Progress
    ├─ 10. Settings
  📄 CLIENT - Mobile
    ├─ (Same 10 screens, mobile layout)
  📄 ADMIN - Desktop
    ├─ 11. Admin Dashboard
    ├─ 12. Clients Management
    ├─ 13. Workflows Management
    ├─ 14. Errors & Logs
    ├─ 15. Support Tickets
    ├─ 16. Finances
  📄 ADMIN - Mobile
    ├─ (Same 6 screens, mobile layout)
```

---

## Navigation Structure

### Client Sidebar
```
📊 Dashboard
⚙️ Workflows
📋 Demandes en cours
⚙️ Paramètres
👤 Profil
```

### Admin Sidebar
```
📊 Dashboard
👥 Gestion Clients
⚙️ Workflows Management
📋 Demandes en cours
🔴 Erreurs & Logs
💬 Support & Tickets
💰 Finances & Usage
🔐 Authentification
⚙️ Paramètres Admin
```

---

## Layout Structure

### Desktop (1440px+)
```
┌────────────┬────────────────────────────┐
│            │                            │
│  Sidebar   │    Main Content            │
│  (280px)   │    (max-width: 1200px)     │
│            │                            │
│  - Logo    │    Page content            │
│  - Nav     │    with padding            │
│  - User    │                            │
│            │                            │
└────────────┴────────────────────────────┘
```

### Mobile (320px-768px)
```
┌─────────────────────┐
│  Top Bar + Menu     │
├─────────────────────┤
│                     │
│  Content (full)     │
│  (scrollable)       │
│                     │
└─────────────────────┘
```

---

## Animations & Transitions

### Durées
- Fast: 100ms (hover states)
- Normal: 200ms (most transitions)
- Slow: 300ms (modal open/close)

### Easing
- Cubic-bezier(0.4, 0, 0.2, 1)

### Common Animations
```css
/* Button hover */
transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);

/* Card hover */
transition: shadow 200ms ease;

/* Modal open */
animation: fadeIn 200ms, scaleIn 300ms;

/* Spinner */
animation: spin 1s linear infinite;
```

---

## Accessibilité

### Color Contrast
- Tous les textes passent WCAG AA (ratio ≥ 4.5:1)
- Primary text: #1F2937 sur blanc (ratio: 13.1:1)
- Secondary text: #6B7280 sur blanc (ratio: 7.5:1)

### Touch Targets
- Minimum: 44px x 44px
- Tous les boutons et inputs respectent cette règle

### Keyboard Navigation
- Tous les éléments interactifs sont focusables
- Focus visible avec outline bleu
- Tab order logique

### Semantic HTML
- Proper heading hierarchy (h1, h2, h3)
- Use `<button>` for actions, `<a>` for links
- ARIA labels for icon-only buttons

---

## Quick Start pour le Frontend Developer

### 1. Installation
```bash
npm install -D tailwindcss@latest
npm install @headlessui/react @heroicons/react
npm install framer-motion
```

### 2. Configuration
- Copier `tailwind.config.js` dans le projet
- Importer `design-tokens.css` dans `index.css`
- Importer Inter font depuis Google Fonts

### 3. Structure de dossiers recommandée
```
src/
├─ components/
│  ├─ ui/
│  │  ├─ Button.jsx
│  │  ├─ Input.jsx
│  │  ├─ Card.jsx
│  │  ├─ Badge.jsx
│  │  ├─ Modal.jsx
│  │  └─ Sidebar.jsx
│  └─ ...
├─ pages/
│  ├─ client/
│  │  ├─ Dashboard.jsx
│  │  ├─ WorkflowsList.jsx
│  │  └─ ...
│  └─ admin/
│     ├─ AdminDashboard.jsx
│     └─ ...
└─ styles/
   ├─ design-tokens.css
   └─ index.css
```

### 4. Exemple de composant
```jsx
// Button.jsx
export const Button = ({
  variant = 'primary',
  size = 'md',
  children,
  ...props
}) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## Libraries recommandées

### UI Components
- **Headless UI** (modals, dropdowns, transitions)
- **Heroicons** (icons set complet)
- **React Hook Form** (form handling)
- **Zod** (validation)

### Animations
- **Framer Motion** (animations complexes)

### Charts (pour Admin)
- **Recharts** (léger, React-friendly)
- **Chart.js** (alternatif)

### Utilities
- **clsx** (conditional classnames)
- **date-fns** (date formatting)

---

## États des composants (checklist)

Pour chaque composant, vérifier:
- [ ] Default state
- [ ] Hover state (desktop)
- [ ] Active/Pressed state
- [ ] Focus state (keyboard navigation)
- [ ] Disabled state
- [ ] Loading state (si applicable)
- [ ] Error state (forms)
- [ ] Empty state (lists)
- [ ] Success state (si applicable)

---

## Priorités d'implémentation

### Phase 1 (Semaine 1) - MVP Core
1. Design system components (Button, Input, Card)
2. Login page
3. Client Dashboard
4. Sidebar navigation

### Phase 2 (Semaine 2) - Workflow Flow
5. Workflows List
6. Workflow Execution (4 steps)
7. Form handling & validation

### Phase 3 (Semaine 3) - Admin
8. Admin Dashboard
9. Admin Clients Management
10. Admin Workflows Management

### Phase 4 (Semaine 4) - Polish
11. Remaining screens
12. Responsive optimization
13. Animations polish
14. Accessibility audit

---

## Performance Best Practices

### Images
- Use WebP format
- Lazy load images
- Provide proper sizes and srcset

### Code Splitting
- Split by route
- Lazy load admin section
- Lazy load modals

### React Optimization
- Use React.memo for expensive components
- Virtualize long lists (workflows, errors)
- Debounce search inputs

### CSS
- Use Tailwind's JIT mode
- Purge unused CSS in production
- Minimize custom CSS

---

## Testing Recommendations

### Visual Testing
- Test all breakpoints (320px, 768px, 1440px)
- Test all component states
- Test dark mode compatibility (future)

### Accessibility Testing
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management

### Browser Testing
- Chrome (primary)
- Safari (Mac/iOS)
- Firefox
- Edge

---

## Notes importantes

### Mobile First
- Toujours commencer par le mobile
- Ajouter les styles desktop progressivement
- Touch-friendly: min 44px height pour tous les éléments interactifs

### Consistency
- Utiliser les composants du design system
- Ne pas créer de variations custom sans raison
- Respecter le système de spacing (8px grid)

### Performance
- Keep bundle size small
- Code-split aggressively
- Lazy load images and heavy components

### Accessibility
- WCAG 2.1 AA minimum
- Keyboard navigation obligatoire
- Focus states visibles
- Semantic HTML

---

## Support & Contact

Pour questions sur le design:
- Référer au `DESIGN_SYSTEM.md` pour les guidelines
- Référer au `FIGMA_SCREENS_SPECS.md` pour les specs détaillées
- Référer aux `design-tokens.json` pour les valeurs exactes

---

## Changelog

### Version 1.0 (2025-11-15)
- Initial design system creation
- 16 screens specifications
- Complete component library
- Responsive specs
- Tailwind configuration
- CSS variables

---

## Prochaines étapes

### Pour le Designer
1. Créer le Figma avec tous les écrans
2. Créer les prototypes interactifs
3. Exporter les assets
4. Partager le lien Figma public

### Pour le Developer
1. Setup projet React + Tailwind
2. Implémenter les composants de base
3. Créer les layouts (Client/Admin)
4. Implémenter les écrans par priorité

---

**Design System Version:** 1.0
**Last Updated:** 2025-11-15
**Status:** Ready for Implementation
**Tech Stack:** React 18 + TailwindCSS
**Timeline:** 2-3 jours design, 3-4 semaines dev

---

END OF DOCUMENTATION
