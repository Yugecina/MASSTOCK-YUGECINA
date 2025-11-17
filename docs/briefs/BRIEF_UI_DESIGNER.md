# 📗 BRIEF #2 : UI-DESIGNER

```
═══════════════════════════════════════════════════════════════════
PROJECT: MasStock - SaaS Automation Workflows for Agencies
PHASE: UI/UX Design & Design System
AGENT: UI-Designer
TIMELINE: 2-3 jours
═══════════════════════════════════════════════════════════════════

## 🎯 CONTEXTE DU PROJET

MasStock est un SaaS premium qui permet aux agences de génération de
contenu IA d'automatiser leurs workflows.

**Client MVP:** Estee (agence IA)
- Utilisatrices: Elle + son équipe (2-5 personnes)
- Cas d'usage: Générer images en batch, rédiger articles, etc.
- Fréquence: Sporadic (projet par projet)
- Priorités: Vitesse de livraison + Facilité d'utilisation

**Tech stack:**
- Frontend: React (version 18+)
- Styling: TailwindCSS recommended (ou styled-components)
- Components library: À définir
- Deployment: Vercel/Netlify

---

## 🎨 DESIGN SYSTEM À CRÉER

### COULEURS (Palette de base)
```
Primary (Bleu - Actions principales):
- #007AFF (Main)
- #0051D5 (Hover/Dark)
- #E8F4FF (Light background)

Success (Vert - Actions positives):
- #34C759 (Main)
- #2EA04D (Dark)
- #E8F5E9 (Light background)

Warning (Orange - Attention):
- #FF9500 (Main)
- #E68900 (Dark)
- #FFF3E0 (Light background)

Error (Rouge - Erreurs):
- #FF3B30 (Main)
- #E63929 (Dark)
- #FFEBEE (Light background)

Neutral (Gris - Base):
- #1F2937 (Text dark)
- #6B7280 (Text medium)
- #D1D5DB (Borders)
- #F3F4F6 (Backgrounds)
- #FFFFFF (White)

Usage:
- Primary buttons: #007AFF
- Secondary buttons: White border + #1F2937 text
- Error messages: #FF3B30
- Success messages: #34C759
- Disabled state: #D1D5DB
```

### TYPOGRAPHIE
```
Font family: Inter (ou système: -apple-system, BlinkMacSystemFont, etc.)

Heading 1: 32px, Bold (600), line-height 1.2
  → Page titles (Dashboard, Workflows)

Heading 2: 24px, Bold (600), line-height 1.2
  → Section titles

Heading 3: 20px, Bold (600), line-height 1.3
  → Card titles, subsections

Body: 16px, Regular (400), line-height 1.5
  → Default paragraph text

Body small: 14px, Regular (400), line-height 1.5
  → Secondary text, descriptions

Label: 12px, Medium (500), line-height 1.4
  → Form labels, captions

Code: 14px, Monospace (Monaco/Courier)
  → Error messages, IDs, timestamps
```

### SPACING
```
Use 8px grid system:
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px

Examples:
- Button padding: 12px 24px (vertical, horizontal)
- Card padding: 24px
- Section spacing: 32px
- Element spacing: 8px-16px
```

### COMPONENTS (À créer en Figma)

#### Primary Button
```
States:
- Default: #007AFF background, white text, 12px border-radius
- Hover: #0051D5 background
- Active: darker shade
- Disabled: #D1D5DB background, #9CA3AF text
- Loading: spinner animation

Sizes:
- Small: 32px height, 12px horizontal padding
- Medium: 40px height, 16px horizontal padding (default)
- Large: 48px height, 20px horizontal padding

Variations:
- Solid (default)
- Outline (border, no fill)
- Ghost (transparent, text only)
```

#### Input Field
```
States:
- Default: white background, #D1D5DB border
- Focus: #007AFF border, blue shadow
- Error: #FF3B30 border
- Disabled: #F3F4F6 background, #9CA3AF text
- Filled: white bg, #1F2937 text

Features:
- 12px border-radius
- 12px vertical padding, 16px horizontal
- Placeholder text: #9CA3AF
- Error message below in #FF3B30
- Optional label above
```

#### Card
```
White background, shadow: 0 1px 3px rgba(0,0,0,0.1)
Border-radius: 8px
Padding: 24px
Used for: Workflow cards, client cards, execution results
```

#### Badge/Tag
```
Background: Light color (e.g., #E8F4FF for info)
Text: Dark color matching theme
Border-radius: 6px
Padding: 4px 12px
Example:
- Status badges: "✅ Active", "⏳ Pending", "❌ Failed"
```

#### Spinner/Loading
```
Animated circle, primary color
Size: 24px x 24px (default)
Used when workflows are processing
```

#### Modal/Dialog
```
Overlay: semi-transparent black
Modal: white, center-aligned
Buttons: Primary (confirm) + Secondary (cancel)
Close button: top-right corner
```

#### Navigation / Sidebar
```
Dark or light theme (to be decided)
Items: icon + label
Active state: background highlight
Hover state: slight background change
```

---

## 📐 PAGE/SCREEN SPECIFICATIONS

### ========================
### CLIENT VIEW SCREENS
### ========================

### 1. LOGIN PAGE
```
Layout: Centered, single column
Content:
  - Logo/Title: "MasStock"
  - Heading: "Connectez-vous à votre compte"
  - Email input field (with label)
  - Password input field (with label)
  - "Se connecter" button (primary, large)
  - "Mot de passe oublié?" link (bottom)
  - Privacy note: "Vos données sont sécurisées" (small text)

Responsive:
  - Desktop: 400px width form
  - Mobile: Full width with 16px margin
  - Tablet: ~500px width

State variations:
  - Loading (button shows spinner)
  - Error (red border on inputs + error message)
  - Success (redirect to dashboard)
```

### 2. CLIENT DASHBOARD (Accueil)
```
Layout:
  - Sidebar (fixed, left) + Main content (scrollable, right)

SIDEBAR:
  - Logo: "MasStock" (top)
  - Navigation items:
    • 📊 Dashboard (active highlight)
    • ⚙️ Workflows
    • 📋 Demandes en cours
    • ⚙️ Paramètres
    • 👤 Profil
  - Bottom: User avatar + name + logout

MAIN CONTENT:
  Section 1: Welcome
    - H1: "Espace Estee"
    - Subtitle: "Bienvenue, [name]"

  Section 2: Your Workflows (Cards grid)
    - "Vos workflows"
    - Grid of 2-3 columns (responsive)
    - Each card shows:
      • Workflow icon/name
      • Status badge ("✅ Actif")
      • Description (2 lines max)
      • Button: "Utiliser ce workflow"
      • Button: "Voir historique"

  Section 3: Statistics (KPI boxes)
    - 4 boxes in row:
      • Active Workflows: 2
      • Requests pending: 1
      • Assets generated (month): 1200
      • Time saved: 42h

  Section 4: Request New Workflow
    - Big button: "📝 Demander un nouveau workflow"
    - Opens modal form

Colors:
  - Sidebar: White or dark gray (#F9FAFB)
  - Main: White
  - Accents: Primary blue
```

### 3. WORKFLOWS LIST PAGE
```
Layout: Same sidebar + main content

MAIN:
  - H1: "Mes Workflows"
  - Search bar + filter dropdown

  Workflow cards (full width, stacked):
    Each card:
    - Title + status badge
    - Description
    - Stats:
      • Last used: [date]
      • Usage this month: [count]
    - Buttons: [Use], [History], [Stats]

Responsive:
  - Desktop: Full width cards
  - Mobile: Stack vertically
```

### 4. WORKFLOW EXECUTION PAGE (Step 1: Input)
```
Layout: Center form, left = sidebar

FORM:
  Section: "Batch Image Generator"

  Step indicator: "Step 1 of 4"

  Form fields (vertical stack):
    1. Model selection (dropdown)
       Label: "Model"
       Options: [Midjourney, DALL-E 3, etc.]

    2. Style selection (dropdown)
       Label: "Style"
       Options: [Photorealistic, Illustration, etc.]

    3. Prompts input (textarea repeated)
       Label: "Entrez vos 10 prompts:"
       10 input fields numbered
       Each field: placeholder "Décrivez l'image..."

    4. Number selector (slider)
       Label: "Images par prompt"
       Slider: 1-20 (default 10)
       Display selected value

  Buttons (bottom):
    - [Vérifier les entrées] (primary)
    - [Annuler] (secondary)
```

### 5. WORKFLOW EXECUTION PAGE (Step 2: Confirmation)
```
Layout: Center card

CARD:
  Title: "Récapitulatif"

  Summary info (read-only):
    - Model: Midjourney
    - Style: Photorealistic
    - Total images: 100 (10 prompts × 10 images)
    - Estimated duration: ~15 minutes
    - Estimated cost: €25

  Buttons:
    - [Lancer le workflow] (primary, large)
    - [Retour] (secondary)
```

### 6. WORKFLOW EXECUTION PAGE (Step 3: Processing)
```
Layout: Center card with animations

CARD:
  Title: "Génération en cours..."

  Progress bar (animated):
    [████████░░] 65%

  Metrics (real-time):
    - Images générées: 65/100
    - Temps écoulé: 9m 45s
    - Temps restant estimé: 5m

  Details (expandable/accordion):
    - Prompts 1-4: ✅ Générées
    - Prompts 5-8: ⏳ En cours
    - Prompts 9-10: ⏱️ En attente

  Buttons:
    - [Voir l'aperçu] (secondary)
    - [Annuler] (danger/red)
```

### 7. WORKFLOW EXECUTION PAGE (Step 4: Results)
```
Layout: Center card with scrollable content

CARD:
  Title: "✅ Workflow complété avec succès!"

  Summary (KPI boxes):
    - 100 images générées
    - Qualité: Excellente
    - Durée: 14m 32s
    - Coût: €25

  Image Gallery (responsive grid):
    - 4 columns on desktop, 2 on mobile
    - Each image: thumbnail with hover preview
    - Pagination or "Load more"

  Link: "Voir toutes les images"

  Download section:
    - [Download ZIP (450 MB)]
    - [Download JSON metadata]
    - [Export to Drive] (optional)

  Buttons (bottom):
    - [Télécharger] (primary)
    - [Réutiliser ce workflow] (secondary)
```

### 8. WORKFLOW REQUESTS PAGE
```
Layout: Form in center card or full-width form

FORM:
  Title: "Demander un nouveau workflow"
  Subtitle: "Décrivez ce que vous aimeriez automatiser"

  Fields (vertical):
    1. Workflow title
       Input: "Titre du workflow (ex: Générer moodboards)"

    2. Detailed description
       Textarea: "Que voulez-vous automatiser?..."
       Min 100 chars, counter shows progress

    3. Use case example
       Textarea: "Exemple: Créer 50 variations..."

    4. Usage frequency
       Radio buttons:
         ○ Quotidien  ○ Hebdo  ○ Mensuel  ○ Sporadic

    5. Budget (optional)
       Input: "Budget mensuel envisagé (€)"
       Placeholder: "ex: 500"

  Buttons:
    - [Soumettre] (primary)
    - [Annuler] (secondary)
```

### 9. REQUESTS IN PROGRESS PAGE
```
Layout: Stacked cards

Each request card:
  - Reference ID: "#WF-20241114-001"
  - Title: "Generateur de moodboards"
  - Status: Badge with color (yellow = negotiation)

  Timeline (vertical steps):
    1. ✓ Demande enregistrée
    2. ✓ Estimation reçue
    3. ⏳ Appel de négociation (next step - highlighted)
    4. ⏱️ Signature du contrat
    5. 📅 Développement
    6. 🚀 Déploiement

  Next action: "Appel demain 10h"

  Button: [Voir détails]
```

### 10. SETTINGS PAGE
```
Layout: Sidebar + main content

MAIN:
  Tabs or sections:

  1. Account Info
     - Name: [input]
     - Email: [input, read-only]
     - Company: [input]
     - Plan: [read-only badge]

  2. Security
     - [Change password button]
     - Active sessions list
     - [Logout from all devices]

  3. Integrations
     - Google Drive: [status toggle + auth button]
     - Slack: [status toggle + auth button]

  4. Notifications
     - Checkboxes:
       ☑ Workflow completed
       ☑ New request accepted
       ☑ Newsletter

  5. Billing
     - Current plan info
     - Next payment date
     - [View invoices]
```

### ========================
### ADMIN VIEW SCREENS
### ========================

### 11. ADMIN DASHBOARD (Overview)
```
Layout: Same sidebar structure as client, but with Admin nav

SIDEBAR NAVIGATION:
  - 📊 Dashboard (active)
  - 👥 Gestion Clients
  - ⚙️ Workflows Management
  - 📋 Demandes en cours
  - 🔴 Erreurs & Logs
  - 💬 Support & Tickets
  - 💰 Finances & Usage
  - 🔐 Authentification
  - ⚙️ Paramètres Admin

MAIN CONTENT:

  Section 1: Health Check (KPI row)
    4 boxes:
    - Uptime: 99.8% ✅
    - Errors (24h): 2 ⚠️
    - Perf API: 250ms ✅
    - Storage cost: $45/mth ✅

  Section 2: Quick Stats (KPI row)
    4 boxes:
    - Active Clients: 1
    - Workflows: 3 (2 deployed, 1 pending)
    - Requests/day: 847
    - Revenue (month): €750

  Section 3: Alerts & Issues
    Red alert boxes:
    - ⚠️ 2 Workflows Failed
    - ⚠️ 1 Client Auth Issue
    - ℹ️ 3 Support Tickets pending

  Section 4: Graphs (row of 2)
    - Request Timeline (7 days): Line chart
    - Usage by Workflow: Pie/Donut chart

  Section 5: Recent Activity
    Scrollable list:
    - [timestamp] - [action] - [client/workflow]
    - E.g.: "15:45 - Workflow executed - Estee"
```

### 12. ADMIN CLIENTS PAGE
```
Layout: Main content area

Search + Filter bar:
  - Search by name/email
  - Filter by status
  - Sort by (name, created date, revenue)

Client cards (list or table):
  Each card shows:
  - Client name + status badge
  - Email, plan
  - Created date
  - Last login
  - Revenue this month
  - Workflows count
  - Buttons: [Details], [Logs], [Disable], [Reset Password]

Expandable detail view (on card click):
  - Full client info
  - Workflows list
  - Usage stats
  - Auth issues
  - Support tickets
  - Audit log timeline
```

### 13. ADMIN WORKFLOWS PAGE
```
Layout: Main content

List of workflows:
  Each row/card:
  - Workflow name + status
  - Client name
  - Executions (24h, week, month)
  - Success rate: [progress bar]
  - Avg duration
  - Revenue this month
  - Buttons: [Details], [Stats], [Edit], [Disable]

Detail modal (on click):
  - Full metrics
  - Performance graph
  - Error analysis
  - Recent executions
  - Configuration settings
```

### 14. ADMIN ERRORS PAGE
```
Layout: Main content

Filters:
  - Severity: Critical, Warning, Info
  - Time range: Last 24h, Last 7 days, etc.
  - Status: Unresolved, Resolved

Error list:
  Each error card:
  - Error type (e.g., "Workflow Timeout")
  - Count (e.g., "8 occurrences")
  - First & last seen
  - Affected clients/workflows
  - Button: [View details]

Detail modal:
  - Full stack trace
  - Affected executions list
  - Root cause analysis
  - Status (mark as resolved)
```

### 15. ADMIN SUPPORT TICKETS PAGE
```
Layout: Main content

Tabs/filters:
  - Status: Open, In Progress, Resolved
  - Priority: Urgent, High, Medium, Low

Ticket cards:
  - ID + title
  - Status badge
  - Client name
  - Priority badge (color-coded)
  - Created date
  - Button: [View details]

Detail modal:
  - Full conversation thread
  - Client message + admin replies
  - Workflow execution context (if relevant)
  - Actions: [Reply], [Resolve], [Escalate]
```

### 16. ADMIN FINANCES PAGE
```
Layout: Main content

KPI boxes (top row):
  - Revenue (month): €750
  - Revenue (year): €750
  - Costs: €245
  - Gross margin: 68%

Charts:
  - Revenue Timeline: Line chart (30 days)
  - Revenue by Workflow: Pie chart
  - Cost vs Revenue: Stacked bar chart
  - Usage by Client: Bar chart

Breakdown table:
  Columns: Client, Subscriptions, Usage, Revenue, Costs, Margin %
  Rows: Each client + Total

Upcoming payments:
  - Estee renewal: Dec 5 → €2,500
  - Custom workflows pending: €3,500
```

---

## 🎭 DESIGN TOKENS (To include in Figma)

Create a design tokens file with:
- Colors (hex codes)
- Typography (font families, sizes, weights)
- Spacing (padding, margins, gaps)
- Border radius (variations)
- Shadows (subtle, medium, large)
- Animations (durations, easing)

Export as JSON for developer hand-off.

---

## 📱 RESPONSIVE DESIGN

Breakpoints:
```
Mobile: 320px - 480px (small phones to large phones)
Tablet: 481px - 768px
Desktop: 769px - 1440px
Large: 1441px+ (widescreen)
```

Approach:
- Mobile-first design
- Flexible layouts (grid, flexbox)
- Touch-friendly targets (min 44px × 44px)
- Readable font sizes (min 14px)

Sidebar behavior:
- Desktop: Fixed sidebar visible
- Tablet: Collapsible sidebar
- Mobile: Hamburger menu

---

## 🎬 INTERACTIONS & ANIMATIONS

Micro-interactions:
```
Button hover: Slight color shift (50ms)
Loading spinner: Continuous rotation (1s)
Success message: Fade in (300ms) → Auto-fade out (2s)
Error message: Slide down (200ms), stays visible
Modal open: Fade in background (200ms) + scale card (300ms)
Card hover: Subtle shadow increase (150ms)
Link hover: Color change + underline (100ms)
```

Page transitions:
```
Between client pages: Fade out (100ms) → Fade in (200ms)
Admin pages: Slide in from right (300ms)
```

---

## 🎨 COLOR APPLICATIONS

Login page:
- Background: White or light gradient
- Primary button: Full blue

Client dashboard:
- Sidebar: Neutral (white or very light gray)
- Active nav item: Blue highlight
- Workflow status badges: Green (active), Yellow (pending), Red (failed)

Admin dashboard:
- Health check section: Green/Yellow/Red based on status
- Error cards: Red background with white text
- Success items: Green checkmarks
- Charts: Use primary palette

---

## 📋 DESIGN DELIVERABLES

1. ✅ **Figma file** with all screens
   - 16 screens as specified above
   - Organized by section (Client, Admin)
   - Responsive variants (mobile, tablet, desktop)

2. ✅ **Component library** (Figma components)
   - Buttons (primary, secondary, danger, ghost)
   - Input fields
   - Cards
   - Modals
   - Badges/Tags
   - Navigation
   - Form elements

3. ✅ **Design system documentation**
   - Colors with hex codes
   - Typography specs
   - Spacing guidelines
   - Component usage rules

4. ✅ **Prototypes/interactions** (if time allows)
   - Modal open/close animations
   - Page transitions
   - Form validation states

5. ✅ **Design tokens export**
   - JSON format for developers
   - Variable names (CSS-friendly)

6. ✅ **Responsive specs**
   - Breakpoints documented
   - Layout changes per breakpoint
   - Mobile-specific considerations

---

## 🎯 DESIGN PHILOSOPHY

**Simplicity over complexity:**
- Clean, minimal UI
- Focus on data, not decoration
- Reduce cognitive load

**Purpose-driven:**
- Every element has a function
- No decorative elements
- Fast, actionable interface

**Accessibility:**
- WCAG 2.1 AA compliant
- Color contrast ratios ≥ 4.5:1 for text
- Keyboard navigation support
- Clear focus states
- Semantic HTML

**Consistency:**
- Reusable components
- Consistent spacing
- Consistent typography
- Consistent color usage

---

## 📞 NOTES FOR FRONTEND DEVELOPER

Once design is complete:
1. Export all components as Figma components with specs
2. Provide Figma link to frontend dev
3. Document pixel-perfect requirements
4. List all state variations (hover, active, disabled, loading)
5. Provide responsive breakpoint specs
6. Include color tokens as CSS variables
7. Document animation timings & easing

---

## 🚀 SUCCESS CRITERIA

Your design is ready when:
- ✅ All 16 screens are designed in Figma
- ✅ Component library is complete
- ✅ Design system is documented
- ✅ Responsive variants are created
- ✅ Interactions are specified
- ✅ Color/typography tokens are defined
- ✅ Frontend dev can build from your designs with minimal questions

---

Bon courage! 🎨

```
