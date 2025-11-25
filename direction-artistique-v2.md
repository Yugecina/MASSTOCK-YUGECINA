# Direction Artistique V2 - Nouvelle Vision MasStock

**Date:** 2025-11-24
**Version:** 2.0 - The Trusted Magician
**Status:** Vision stratégique pour refonte UI

---

## 1. Vision Stratégique

### 1.1 Identité de Marque

#### Émotion Principale
**Confiance & Sécurité** - L'utilisateur doit se sentir en contrôle, dans un environnement fiable et robuste où tout fonctionne comme prévu.

#### Archétype de Marque
**Le Magicien** - Transformation, automatisation qui semble magique, capacité à faire l'impossible avec élégance.

#### Positionnement
> "MasStock transforme vos workflows complexes en automatisations fluides et fiables. Là où d'autres promettent, nous livrons avec précision."

#### Valeurs Clés
1. **Fiabilité** - Ça marche, toujours
2. **Transformation** - Automatisation qui semble magique
3. **Clarté** - Interface ultra minimale, zéro friction
4. **Sophistication** - Premium sans être intimidant

### 1.2 Personnalité de la Marque

**Nous sommes:**
- ✅ Confiants mais pas arrogants
- ✅ Sophistiqués mais pas compliqués
- ✅ Innovants mais pas expérimentaux
- ✅ Précis mais pas robotiques

**Nous ne sommes pas:**
- ❌ Playful ou colorés à l'excès
- ❌ Minimalistes au point d'être froids
- ❌ Corporate au point d'être ennuyeux
- ❌ Techniques au point d'être intimidants

### 1.3 Références Visuelles

**Inspirations principales:**
1. **Linear** - Vitesse, fluidité, minimal avec personnalité
2. **Vercel** - Premium tech, dark accents, developer focus
3. **Stripe** - Confiance, élégance, clarté
4. **Notion** - Information-rich, flexible, workspace feel

**Moodboard textuel:**
```
Confiance  →  Bleus profonds, contrastes nets, typographie geometric
Magie      →  Glassmorphism, animations fluides, transitions delightful
Minimal    →  Espace blanc généreux, hiérarchie claire, focus intentionnel
Premium    →  Détails soignés, micro-interactions, polish partout
```

---

## 2. Palette de Couleurs - 3 Options à Valider

### Option 1: "Electric Trust" (Recommandée)

**Primary - Electric Indigo**
```css
--primary-50: #EEF2FF;   /* Ultra light */
--primary-100: #E0E7FF;  /* Very light */
--primary-200: #C7D2FE;  /* Light */
--primary-300: #A5B4FC;  /* Light medium */
--primary-400: #818CF8;  /* Medium */
--primary-500: #6366F1;  /* Base - Electric Indigo */
--primary-600: #4F46E5;  /* Medium dark */
--primary-700: #4338CA;  /* Dark */
--primary-800: #3730A3;  /* Very dark */
--primary-900: #312E81;  /* Ultra dark */
```

**Accent - Bright Cyan**
```css
--accent-50: #ECFEFF;
--accent-100: #CFFAFE;
--accent-200: #A5F3FC;
--accent-300: #67E8F9;
--accent-400: #22D3EE;
--accent-500: #06B6D4;  /* Base - Bright Cyan */
--accent-600: #0891B2;
--accent-700: #0E7490;
--accent-800: #155E75;
--accent-900: #164E63;
```

**Neutral - Deep Navy + Warm Grays**
```css
--neutral-50: #F8FAFC;   /* Canvas white */
--neutral-100: #F1F5F9;  /* Very light gray */
--neutral-200: #E2E8F0;  /* Light gray */
--neutral-300: #CBD5E1;  /* Gray */
--neutral-400: #94A3B8;  /* Medium gray */
--neutral-500: #64748B;  /* Dark gray */
--neutral-600: #475569;  /* Very dark gray */
--neutral-700: #334155;  /* Navy gray */
--neutral-800: #1E293B;  /* Deep navy */
--neutral-900: #0F172A;  /* Ultra deep navy */
--neutral-950: #020617;  /* Black navy */
```

**Semantic Colors**
```css
--success-light: #D1FAE5;
--success: #10B981;       /* Green */
--success-dark: #065F46;

--warning-light: #FEF3C7;
--warning: #F59E0B;       /* Amber */
--warning-dark: #92400E;

--error-light: #FEE2E2;
--error: #EF4444;         /* Red */
--error-dark: #991B1B;

--info-light: #E0E7FF;
--info: #6366F1;          /* Indigo */
--info-dark: #312E81;
```

---

### Option 2: "Obsidian Glow"

**Primary - Obsidian Dark**
```css
--primary-50: #F5F5F5;
--primary-100: #E5E5E5;
--primary-200: #CCCCCC;
--primary-300: #B3B3B3;
--primary-400: #999999;
--primary-500: #18181B;   /* Base - Obsidian */
--primary-600: #09090B;
--primary-700: #000000;
--primary-800: #000000;
--primary-900: #000000;
```

**Accent - Neon Blue**
```css
--accent-50: #EFF6FF;
--accent-100: #DBEAFE;
--accent-200: #BFDBFE;
--accent-300: #93C5FD;
--accent-400: #60A5FA;
--accent-500: #0EA5E9;   /* Base - Neon Blue */
--accent-600: #0284C7;
--accent-700: #0369A1;
--accent-800: #075985;
--accent-900: #0C4A6E;
```

**Neutral - Grayscale**
```css
--neutral-50: #FAFAFA;
--neutral-100: #F4F4F5;
--neutral-200: #E4E4E7;
--neutral-300: #D4D4D8;
--neutral-400: #A1A1AA;
--neutral-500: #71717A;
--neutral-600: #52525B;
--neutral-700: #3F3F46;
--neutral-800: #27272A;
--neutral-900: #18181B;
--neutral-950: #09090B;
```

---

### Option 3: "Royal Midnight"

**Primary - Royal Purple**
```css
--primary-50: #FAF5FF;
--primary-100: #F3E8FF;
--primary-200: #E9D5FF;
--primary-300: #D8B4FE;
--primary-400: #C084FC;
--primary-500: #A855F7;   /* Base - Royal Purple */
--primary-600: #9333EA;
--primary-700: #7E22CE;
--primary-800: #6B21A8;
--primary-900: #581C87;
```

**Accent - Arctic Cyan**
```css
--accent-50: #F0FDFA;
--accent-100: #CCFBF1;
--accent-200: #99F6E4;
--accent-300: #5EEAD4;
--accent-400: #2DD4BF;
--accent-500: #14B8A6;   /* Base - Arctic Cyan */
--accent-600: #0D9488;
--accent-700: #0F766E;
--accent-800: #115E59;
--accent-900: #134E4A;
```

**Neutral - Midnight Blue**
```css
--neutral-50: #F8FAFC;
--neutral-100: #F1F5F9;
--neutral-200: #E2E8F0;
--neutral-300: #CBD5E1;
--neutral-400: #94A3B8;
--neutral-500: #64748B;
--neutral-600: #475569;
--neutral-700: #334155;
--neutral-800: #1E293B;   /* Midnight Blue */
--neutral-900: #0F172A;
--neutral-950: #020617;
```

---

## 3. Typographie - Geometric Moderne

### 3.1 Font Stack

#### Display (Headings, Titres, Logo)
**Première option: Space Grotesk**
```css
--font-display: 'Space Grotesk', 'Inter', -apple-system, sans-serif;
```
- Geometric, moderne, distinctif
- Excellent pour titres et headings
- Open source (Google Fonts)
- Poids: 300, 400, 500, 600, 700

**Alternative: Aeonik**
- Plus premium, commercial
- Utilisé par Linear, Vercel

#### Body (Texte courant)
**Première option: Inter**
```css
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```
- Optimal lisibilité
- Designed for screens
- Variable font support
- Poids: 300, 400, 500, 600, 700

**Alternative: Geist**
- Créé par Vercel
- Très moderne, clean

#### Data/Mono (IDs, timestamps, code)
**Conserver: JetBrains Mono**
```css
--font-mono: 'JetBrains Mono', 'Courier New', monospace;
```
- Excellent pour data
- Très lisible
- Style tech/dev

### 3.2 Échelle Typographique

```css
/* Sizes */
--text-xs: 12px;      /* Labels, micro */
--text-sm: 14px;      /* Body small, captions */
--text-base: 16px;    /* Body default */
--text-lg: 18px;      /* Large body */
--text-xl: 20px;      /* H3, subheadings */
--text-2xl: 24px;     /* H2 */
--text-3xl: 30px;     /* H1 */
--text-4xl: 36px;     /* Hero */
--text-5xl: 48px;     /* Display, landing */

/* Line Heights */
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;

/* Letter Spacing */
--tracking-tighter: -0.05em;
--tracking-tight: -0.025em;
--tracking-normal: 0;
--tracking-wide: 0.025em;
--tracking-wider: 0.05em;

/* Font Weights */
--font-light: 300;
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### 3.3 Typographie Classes

```css
/* Headings */
.text-h1 {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
}

.text-h2 {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

.text-h3 {
  font-family: var(--font-display);
  font-size: var(--text-xl);
  font-weight: var(--font-semibold);
  line-height: var(--leading-snug);
}

/* Body */
.text-body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
}

.text-body-sm {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--font-regular);
  line-height: var(--leading-normal);
}

/* Labels */
.text-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--font-medium);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

/* Data */
.text-mono {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-regular);
}
```

---

## 4. Système de Design

### 4.1 Spacing (Garder système 8px)
```css
--spacing-0: 0;
--spacing-1: 4px;
--spacing-2: 8px;
--spacing-3: 12px;
--spacing-4: 16px;
--spacing-5: 20px;
--spacing-6: 24px;
--spacing-8: 32px;
--spacing-10: 40px;
--spacing-12: 48px;
--spacing-16: 64px;
--spacing-20: 80px;
--spacing-24: 96px;
```

### 4.2 Border Radius (Plus prononcés)
```css
--radius-none: 0;
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 16px;    /* Cards principale */
--radius-xl: 20px;
--radius-2xl: 24px;   /* Large cards, modales */
--radius-3xl: 32px;   /* Hero sections */
--radius-full: 9999px;
```

### 4.3 Shadows (Glassmorphism-friendly)
```css
/* Light theme */
--shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 8px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 12px 24px rgba(0, 0, 0, 0.12);
--shadow-2xl: 0 20px 40px rgba(0, 0, 0, 0.15);

/* Dark theme */
--shadow-xs-dark: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-sm-dark: 0 2px 4px rgba(0, 0, 0, 0.4);
--shadow-md-dark: 0 4px 8px rgba(0, 0, 0, 0.5);
--shadow-lg-dark: 0 8px 16px rgba(0, 0, 0, 0.6);
--shadow-xl-dark: 0 12px 24px rgba(0, 0, 0, 0.7);
--shadow-2xl-dark: 0 20px 40px rgba(0, 0, 0, 0.8);

/* Glow effects */
--shadow-glow-primary: 0 0 20px rgba(99, 102, 241, 0.3);
--shadow-glow-accent: 0 0 20px rgba(6, 182, 212, 0.3);
```

### 4.4 Glassmorphism (Everywhere!)

**Light theme:**
```css
--glass-bg-light: rgba(255, 255, 255, 0.7);
--glass-bg-medium: rgba(255, 255, 255, 0.85);
--glass-bg-heavy: rgba(255, 255, 255, 0.95);
--glass-border: rgba(255, 255, 255, 0.3);
--glass-blur: 12px;
--glass-blur-heavy: 20px;
```

**Dark theme:**
```css
--glass-bg-light-dark: rgba(15, 23, 42, 0.7);
--glass-bg-medium-dark: rgba(15, 23, 42, 0.85);
--glass-bg-heavy-dark: rgba(15, 23, 42, 0.95);
--glass-border-dark: rgba(255, 255, 255, 0.1);
```

**Glass card component:**
```css
.glass-card {
  background: var(--glass-bg-medium);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.glass-card-heavy {
  background: var(--glass-bg-heavy);
  backdrop-filter: blur(var(--glass-blur-heavy));
  -webkit-backdrop-filter: blur(var(--glass-blur-heavy));
}

.glass-card-light {
  background: var(--glass-bg-light);
}
```

### 4.5 Animations (Rich & Delightful)

```css
/* Timings */
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 400ms;
--duration-slower: 600ms;

/* Easings */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth: cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Keyframes */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 30px rgba(99, 102, 241, 0.5);
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
}

/* Animation classes */
.animate-fade-in {
  animation: fade-in var(--duration-normal) var(--ease-out);
}

.animate-fade-in-up {
  animation: fade-in-up var(--duration-normal) var(--ease-out);
}

.animate-scale-in {
  animation: scale-in var(--duration-normal) var(--ease-out);
}

.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

---

## 5. Composants UI - Guidelines

### 5.1 Buttons (Solid & Bold)

**Primary Button**
```css
.btn-primary {
  background: var(--primary-500);
  color: white;
  padding: 12px 24px;
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  border: none;
  cursor: pointer;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-primary);
}

.btn-primary:active {
  transform: translateY(0);
}
```

**Secondary Button**
```css
.btn-secondary {
  background: transparent;
  color: var(--primary-500);
  border: 2px solid var(--primary-500);
  padding: 10px 24px;
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-secondary:hover {
  background: var(--primary-50);
  transform: translateY(-2px);
}
```

**Ghost Button**
```css
.btn-ghost {
  background: transparent;
  color: var(--neutral-600);
  border: none;
  padding: 10px 16px;
  transition: all var(--duration-fast) var(--ease-out);
}

.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--neutral-900);
}
```

**Sizes:**
- `.btn-sm` - 10px 16px
- `.btn-md` - 12px 24px (default)
- `.btn-lg` - 14px 32px

### 5.2 Cards (Glassmorphism)

**Workflow Card**
```css
.workflow-card {
  background: var(--glass-bg-medium);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  transition: all var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.workflow-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary-200);
}
```

**Stat Card**
```css
.stat-card {
  background: var(--glass-bg-heavy);
  backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-6);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.stat-card-value {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--font-bold);
  color: var(--primary-600);
}

.stat-card-label {
  font-size: var(--text-sm);
  color: var(--neutral-600);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}

.stat-card-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  font-size: var(--text-sm);
}

.stat-card-trend.positive {
  color: var(--success);
}

.stat-card-trend.negative {
  color: var(--error);
}
```

### 5.3 Navigation (Hybrid Collapsible)

**Sidebar Collapsed (64px)**
```css
.sidebar {
  width: 64px;
  background: var(--glass-bg-heavy);
  backdrop-filter: blur(var(--glass-blur-heavy));
  border-right: 1px solid var(--glass-border);
  transition: width var(--duration-slow) var(--ease-smooth);
  overflow: hidden;
}

.sidebar.expanded {
  width: 280px;
}
```

**Nav Item**
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-3) var(--spacing-4);
  margin: var(--spacing-1) var(--spacing-2);
  border-radius: var(--radius-md);
  color: var(--neutral-600);
  transition: all var(--duration-fast) var(--ease-out);
  cursor: pointer;
  white-space: nowrap;
}

.nav-item:hover {
  background: var(--neutral-100);
  color: var(--neutral-900);
}

.nav-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
  font-weight: var(--font-medium);
}

.nav-item-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.nav-item-label {
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-out);
}

.sidebar.expanded .nav-item-label {
  opacity: 1;
}
```

### 5.4 Inputs (Glassmorphism)

```css
.input {
  background: var(--glass-bg-light);
  backdrop-filter: blur(var(--glass-blur));
  border: 1.5px solid var(--neutral-200);
  border-radius: var(--radius-md);
  padding: var(--spacing-3) var(--spacing-4);
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--neutral-900);
  transition: all var(--duration-fast) var(--ease-out);
}

.input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.input::placeholder {
  color: var(--neutral-400);
}
```

### 5.5 Empty States (Illustrated SVG)

```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-16) var(--spacing-8);
  text-align: center;
  animation: fade-in-up var(--duration-slow) var(--ease-out);
}

.empty-state-illustration {
  width: 200px;
  height: 200px;
  margin-bottom: var(--spacing-6);
  opacity: 0.8;
}

.empty-state-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: var(--font-semibold);
  color: var(--neutral-900);
  margin-bottom: var(--spacing-2);
}

.empty-state-description {
  font-size: var(--text-base);
  color: var(--neutral-600);
  max-width: 400px;
  margin-bottom: var(--spacing-6);
}
```

---

## 6. Dark Mode (Dual Theme Égaux)

### 6.1 Variables Dark Mode

```css
:root[data-theme="dark"] {
  /* Primary colors - slightly brighter in dark */
  --primary-500: #818CF8;
  --primary-600: #6366F1;

  /* Neutrals inverted */
  --neutral-50: #0F172A;
  --neutral-100: #1E293B;
  --neutral-200: #334155;
  --neutral-300: #475569;
  --neutral-400: #64748B;
  --neutral-500: #94A3B8;
  --neutral-600: #CBD5E1;
  --neutral-700: #E2E8F0;
  --neutral-800: #F1F5F9;
  --neutral-900: #F8FAFC;

  /* Glass dark mode */
  --glass-bg-light: var(--glass-bg-light-dark);
  --glass-bg-medium: var(--glass-bg-medium-dark);
  --glass-bg-heavy: var(--glass-bg-heavy-dark);
  --glass-border: var(--glass-border-dark);

  /* Shadows dark mode */
  --shadow-xs: var(--shadow-xs-dark);
  --shadow-sm: var(--shadow-sm-dark);
  --shadow-md: var(--shadow-md-dark);
  --shadow-lg: var(--shadow-lg-dark);
  --shadow-xl: var(--shadow-xl-dark);
  --shadow-2xl: var(--shadow-2xl-dark);
}
```

### 6.2 Theme Switcher

```javascript
// Detect system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Set theme
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

// Auto-detect on load
const savedTheme = localStorage.getItem('theme');
const theme = savedTheme || (prefersDark ? 'dark' : 'light');
setTheme(theme);
```

---

## 7. Iconographie - Line Icons (Outline)

### 7.1 Library
**Lucide React** (recommandé)
```bash
npm install lucide-react
```

**Phosphor Icons** (alternative)
```bash
npm install phosphor-react
```

### 7.2 Usage
```jsx
import { Workflow, Play, Settings, Users } from 'lucide-react';

// Icon sizes
<Workflow size={16} /> // sm
<Workflow size={20} /> // md (default)
<Workflow size={24} /> // lg
```

### 7.3 Navigation Icons
- Home/Dashboard: `LayoutDashboard`
- Workflows: `Workflow`
- Executions: `Play`
- Requests: `FileText`
- Settings: `Settings`
- Users: `Users`
- Analytics: `BarChart3`
- Errors: `AlertCircle`
- Support: `MessageCircle`

---

## 8. Data Visualization (Charts Colorés)

### 8.1 Chart Library
**Recharts** (recommandé)
```bash
npm install recharts
```

### 8.2 Chart Colors
```css
--chart-1: var(--primary-500);  /* Electric Indigo */
--chart-2: var(--accent-500);   /* Bright Cyan */
--chart-3: var(--success);      /* Green */
--chart-4: var(--warning);      /* Amber */
--chart-5: var(--error);        /* Red */
```

### 8.3 Chart Style
- Background: Transparent ou glassmorphism
- Grid: Subtle (neutral-200)
- Tooltips: Glassmorphism card
- Animations: Smooth entrance (400ms)

---

## 9. Priorité de Refonte

### 9.1 Phase 1 - WorkflowExecute (Focus Principal)
**Éléments clés:**
1. Progress stepper avec animations fluides
2. Form inputs glassmorphism
3. Résultats en grid glassmorphism
4. Micro-interactions sur chaque action
5. Loading states illustrés

**Impact:** Cœur de l'app, expérience must be perfect

### 9.2 Phase 2 - Dashboard
**Éléments clés:**
1. Stat cards glassmorphism avec illustrated icons
2. Charts colorés avec animations
3. Workflows récents unified design
4. Bento grid layout

### 9.3 Phase 3 - WorkflowsList
**Éléments clés:**
1. Cards glassmorphism unifiées
2. Search bar moderne
3. Filtres élégants
4. Hover effects riches

### 9.4 Phase 4 - Navigation Globale
**Éléments clés:**
1. Sidebar hybrid collapsible
2. Lucide icons
3. Smooth transitions
4. Dark mode toggle

### 9.5 Phase 5 - Autres Pages
Appliquer le système unifié à toutes les autres pages.

---

## 10. Livrables Attendus

### Documentation
- ✅ direction-artistique-v1.md (État actuel)
- ✅ direction-artistique-v2.md (Cette vision)
- 🔲 design-tokens.css (Variables CSS complètes)
- 🔲 components-guidelines.md (Guide d'usage composants)

### Code
- 🔲 `global.css` refactoré avec nouveau système
- 🔲 Composants UI redesignés
- 🔲 Pages refondues (WorkflowExecute → Dashboard → WorkflowsList)
- 🔲 Dark mode implémenté

### Assets
- 🔲 Icons SVG (Lucide intégration)
- 🔲 Illustrations empty states (SVG custom)
- 🔲 Logo updates (si nécessaire)

---

## 11. Validation Requise

### Décision à prendre:
**Quelle palette choisir ?**
1. Option 1: Electric Trust (Electric Indigo + Bright Cyan) - **Recommandée**
2. Option 2: Obsidian Glow (Obsidian Dark + Neon Blue)
3. Option 3: Royal Midnight (Royal Purple + Arctic Cyan)

Après validation, nous procéderons à la refonte selon la roadmap définie.

---

**Document créé le:** 2025-11-24
**Prochaine étape:** Validation palette → Refonte global.css → WorkflowExecute
