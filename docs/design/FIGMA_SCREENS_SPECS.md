# MasStock - Spécifications Complètes des 16 Écrans

## Structure Figma

```
📁 MasStock Design
  📄 Cover Page
  📄 Design System (tokens + components)
  📄 CLIENT - Desktop (10 screens)
  📄 CLIENT - Mobile (10 screens)
  📄 ADMIN - Desktop (6 screens)
  📄 ADMIN - Mobile (6 screens)
```

---

## PARTIE 1: ÉCRANS CLIENT (10 screens)

---

### ÉCRAN 1: LOGIN PAGE

**Frame Size:**
- Desktop: 1440px x 900px
- Mobile: 375px x 812px

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│        [Centered Form Card]         │
│                                     │
│         Logo: "MasStock"            │
│         (Primary blue, 32px)        │
│                                     │
│    "Connectez-vous à votre compte"  │
│         (H1, 32px, centered)        │
│                                     │
│    ┌─────────────────────────┐     │
│    │ Email                   │     │
│    │ [input field]           │     │
│    └─────────────────────────┘     │
│                                     │
│    ┌─────────────────────────┐     │
│    │ Mot de passe            │     │
│    │ [input field]           │     │
│    └─────────────────────────┘     │
│                                     │
│    [Se connecter] (Primary btn)    │
│                                     │
│    Mot de passe oublié? (link)     │
│                                     │
│    Vos données sont sécurisées 🔒  │
│         (small text, neutral)       │
│                                     │
└─────────────────────────────────────┘
```

**Specs:**
- Form card: 400px width (desktop), full-width minus 32px margin (mobile)
- Card padding: 48px (desktop), 24px (mobile)
- Card style: White bg, shadow-xl, rounded-2xl
- Input fields: Full width, 44px height, 16px spacing between
- Button: Full width, 48px height, primary blue
- Logo: #007AFF color, bold, 32px
- Background: Light gradient from #F9FAFB to #E8F4FF

**States:**
1. **Default:** Empty inputs, button enabled
2. **Filled:** Inputs with text
3. **Error:** Red border on inputs + error message "Email ou mot de passe incorrect"
4. **Loading:** Button shows spinner, disabled

---

### ÉCRAN 2: CLIENT DASHBOARD

**Frame Size:**
- Desktop: 1440px x 1024px
- Mobile: 375px x 812px (scrollable)

**Layout:**
```
Desktop:
┌────────────┬────────────────────────────────────┐
│            │  [Main Content Area]               │
│  Sidebar   │                                    │
│  (280px)   │  Welcome Section                   │
│            │  ┌──────────────────────────────┐  │
│  Logo      │  │ Espace Estee                 │  │
│  MasStock  │  │ Bienvenue, Estee             │  │
│            │  └──────────────────────────────┘  │
│  Nav:      │                                    │
│  📊 Dash   │  Your Workflows (Grid 3 cols)      │
│  ⚙️ Work   │  ┌────┐ ┌────┐ ┌────┐            │
│  📋 Reqs   │  │ W1 │ │ W2 │ │ W3 │            │
│  ⚙️ Sett   │  └────┘ └────┘ └────┘            │
│  👤 Prof   │                                    │
│            │  Statistics (4 KPI boxes)          │
│  [User]    │  ┌───┐ ┌───┐ ┌───┐ ┌───┐        │
│  Estee     │  │ 2 │ │ 1 │ │1.2k│ │42h│        │
│  Logout    │  └───┘ └───┘ └───┘ └───┘        │
│            │                                    │
│            │  [📝 Demander un nouveau workflow] │
└────────────┴────────────────────────────────────┘

Mobile:
┌─────────────────────┐
│ ☰  MasStock    👤   │ <- Top bar
├─────────────────────┤
│ Espace Estee        │
│ Bienvenue, Estee    │
├─────────────────────┤
│ Your Workflows      │
│ (stacked, 1 col)    │
│ ┌─────────────────┐ │
│ │  Workflow 1     │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │  Workflow 2     │ │
│ └─────────────────┘ │
├─────────────────────┤
│ Stats (2x2 grid)    │
│ ┌─────┐ ┌─────┐    │
│ │  2  │ │  1  │    │
│ └─────┘ └─────┘    │
└─────────────────────┘
```

**Sidebar Specs (Desktop):**
- Width: 280px
- Background: #F9FAFB
- Border right: 1px solid #E5E7EB
- Padding: 24px 16px
- Logo: 24px font, bold, primary blue
- Nav items:
  - Height: 44px
  - Padding: 12px 16px
  - Gap between icon and text: 12px
  - Active: bg-primary-light, text-primary-main
  - Inactive: text-neutral-600, hover:bg-neutral-100
- User section: Fixed at bottom, 60px height

**Main Content Specs:**
- Padding: 32px (desktop), 16px (mobile)
- Max-width: 1200px
- Sections spacing: 32px

**Welcome Section:**
- H1: "Espace Estee" (32px, bold)
- Subtitle: "Bienvenue, Estee" (16px, neutral-600)

**Workflow Cards:**
- Grid: 3 columns (desktop), 1 column (mobile)
- Gap: 24px
- Card: White, shadow-md, rounded-lg, padding 24px
- Card content:
  - Icon/emoji: 40px size
  - Title: H3 (20px, bold)
  - Status badge: Success green "✓ Actif"
  - Description: Body-small (14px), 2 lines max
  - Buttons: "Utiliser ce workflow" (primary), "Voir historique" (secondary)

**KPI Boxes:**
- Grid: 4 columns (desktop), 2x2 (mobile)
- Gap: 16px
- Box: White, shadow-md, rounded-lg, padding 24px
- Content:
  - Label: 12px uppercase, neutral-600
  - Value: H1 (32px, bold)
  - Change indicator: 14px, success/error color

**Request Button:**
- Full width (mobile) or centered (desktop)
- Height: 56px
- Primary blue, large size

---

### ÉCRAN 3: WORKFLOWS LIST

**Frame Size:** 1440px x 1024px (Desktop)

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Main Content]                    │
│  Sidebar   │                                    │
│  (same)    │  H1: "Mes Workflows"               │
│            │                                    │
│            │  [Search] [Filter ▼] [Sort ▼]     │
│            │                                    │
│            │  Workflow Cards (stacked)          │
│            │  ┌──────────────────────────────┐  │
│            │  │ Batch Image Generator        │  │
│            │  │ ✓ Actif                     │  │
│            │  │ Description...               │  │
│            │  │ Last: 2h ago | Usage: 12/mo │  │
│            │  │ [Use] [History] [Stats]     │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Article Writer               │  │
│            │  │ ⏳ En attente               │  │
│            │  │ ...                          │  │
│            │  └──────────────────────────────┘  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Header: H1 + search/filter bar
- Search input: 300px width, height 40px
- Filter/Sort dropdowns: 150px width each
- Cards: Full width, stacked, 16px gap
- Each card:
  - Padding: 24px
  - Title + badge in flex row (space-between)
  - Description: 2 lines max, text-ellipsis
  - Stats row: Flex, gap 16px, small text
  - Buttons row: Flex, gap 12px, right-aligned

**Card States:**
- Default: White bg, shadow-md
- Hover: shadow-lg, cursor pointer
- Active workflow: Success badge
- Pending workflow: Warning badge
- Disabled workflow: Error badge + opacity 60%

---

### ÉCRAN 4: WORKFLOW EXECUTION - Step 1 (Input)

**Frame Size:** 1440px x 1024px

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Main Content - Centered Form]    │
│  Sidebar   │                                    │
│  (same)    │  Batch Image Generator             │
│            │  Step 1 of 4                       │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Model                        │  │
│            │  │ [Dropdown: Midjourney ▼]    │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Style                        │  │
│            │  │ [Dropdown: Photorealistic ▼]│  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  Entrez vos 10 prompts:            │
│            │  ┌──────────────────────────────┐  │
│            │  │ 1. [input: Décrivez...]     │  │
│            │  │ 2. [input]                  │  │
│            │  │ 3. [input]                  │  │
│            │  │ ... (10 total)              │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  Images par prompt: 10             │
│            │  [━━━━━●━━━━━] (slider 1-20)      │
│            │                                    │
│            │  [Annuler] [Vérifier les entrées]  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Form width: 600px (centered)
- Form card: White bg, shadow-lg, padding 32px
- Step indicator: Badge style, neutral color
- Inputs spacing: 24px between sections
- Dropdowns: Full width, 44px height
- Prompt inputs: Full width, 44px height each, numbered labels
- Slider: Custom styled, primary color
- Buttons: Secondary (Annuler), Primary (Suivant)

---

### ÉCRAN 5: WORKFLOW EXECUTION - Step 2 (Confirmation)

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Centered Card]                   │
│  Sidebar   │                                    │
│            │  Récapitulatif                     │
│            │  Step 2 of 4                       │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Model: Midjourney            │  │
│            │  │ Style: Photorealistic        │  │
│            │  │ Prompts: 10                  │  │
│            │  │ Images par prompt: 10        │  │
│            │  │                              │  │
│            │  │ Total images: 100            │  │
│            │  │ Durée estimée: ~15 minutes   │  │
│            │  │ Coût estimé: €25            │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  ⚠️ Une fois lancé, ce workflow  │
│            │  ne peut pas être annulé          │
│            │                                    │
│            │  [Retour] [Lancer le workflow]     │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Card width: 500px (centered)
- Info rows: Label + value in flex (space-between)
- Divider line between sections
- Total/Duration/Cost: Bold, larger text
- Warning message: Light orange background
- Primary button: Large, full width

---

### ÉCRAN 6: WORKFLOW EXECUTION - Step 3 (Processing)

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Centered Card with Animation]    │
│  Sidebar   │                                    │
│            │  Génération en cours...            │
│            │  Step 3 of 4                       │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ [████████████░░░░░░] 65%    │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  Images générées: 65/100           │
│            │  Temps écoulé: 9m 45s             │
│            │  Temps restant: ~5m               │
│            │                                    │
│            │  Détails (collapsible):            │
│            │  ▼ Progression par prompt          │
│            │    ✓ Prompt 1-4: Générées         │
│            │    ⏳ Prompt 5-8: En cours        │
│            │    ⏱️ Prompt 9-10: En attente     │
│            │                                    │
│            │  [Voir l'aperçu] [Annuler]        │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Card: 600px width
- Progress bar: Full width, 12px height, rounded, animated
- Metrics: Large numbers (24px), labels below
- Details accordion: Expandable section
- Status icons: Color-coded (green check, orange loading, gray waiting)
- Annuler button: Danger (red) variant

**Animation:**
- Progress bar fills smoothly (transition 500ms)
- Percentage updates in real-time
- Loading spinner on card

---

### ÉCRAN 7: WORKFLOW EXECUTION - Step 4 (Results)

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Scrollable Content]              │
│  Sidebar   │                                    │
│            │  ✅ Workflow complété avec succès! │
│            │  Step 4 of 4                       │
│            │                                    │
│            │  Summary (KPI boxes 4 cols)        │
│            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│            │  │100 │ │Exc.│ │14m │ │€25 │     │
│            │  │img │ │Qual│ │32s │ │    │     │
│            │  └────┘ └────┘ └────┘ └────┘     │
│            │                                    │
│            │  Image Gallery (4 cols grid)       │
│            │  ┌──┐ ┌──┐ ┌──┐ ┌──┐             │
│            │  │  │ │  │ │  │ │  │             │
│            │  └──┘ └──┘ └──┘ └──┘             │
│            │  ┌──┐ ┌──┐ ┌──┐ ┌──┐             │
│            │  │  │ │  │ │  │ │  │             │
│            │  └──┘ └──┘ └──┘ └──┘             │
│            │  [Load more...]                    │
│            │                                    │
│            │  Downloads:                        │
│            │  [Download ZIP (450 MB)]           │
│            │  [Download JSON metadata]          │
│            │                                    │
│            │  [Télécharger] [Réutiliser]       │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Success header: Green check icon, H2 text
- KPI boxes: Same as dashboard, 4 columns
- Image grid: 4 columns (desktop), 2 (mobile)
- Image thumbnails: Square, 200px, rounded, hover zoom
- Download buttons: Full width, secondary style
- Bottom actions: Primary + Secondary

---

### ÉCRAN 8: REQUEST NEW WORKFLOW

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Form Card]                       │
│  Sidebar   │                                    │
│            │  Demander un nouveau workflow      │
│            │  Décrivez ce que vous aimeriez     │
│            │  automatiser                       │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Titre du workflow            │  │
│            │  │ [input]                      │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Description détaillée        │  │
│            │  │ [textarea, min 100 chars]    │  │
│            │  │ 145/100 caractères           │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Exemple d'utilisation        │  │
│            │  │ [textarea]                   │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  Fréquence d'utilisation:          │
│            │  ○ Quotidien  ○ Hebdo             │
│            │  ○ Mensuel    ○ Sporadic          │
│            │                                    │
│            │  Budget mensuel (optionnel):       │
│            │  [input: ex: 500]                  │
│            │                                    │
│            │  [Annuler] [Soumettre]            │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Form: 700px width, centered
- Textarea: Min height 120px, auto-expand
- Character counter: Real-time, green when > 100
- Radio buttons: Custom styled, 44px height, flex row
- Submit button: Disabled until form valid

---

### ÉCRAN 9: REQUESTS IN PROGRESS

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Main Content]                    │
│  Sidebar   │                                    │
│            │  Demandes en cours                 │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ #WF-20241114-001             │  │
│            │  │ Generateur de moodboards     │  │
│            │  │ [⏳ En négociation]          │  │
│            │  │                              │  │
│            │  │ Timeline:                    │  │
│            │  │ ✓ Demande enregistrée        │  │
│            │  │ ✓ Estimation reçue           │  │
│            │  │ ⏳ Appel de négociation      │  │
│            │  │    (highlighted, next step)  │  │
│            │  │ ⏱️ Signature du contrat      │  │
│            │  │ 📅 Développement             │  │
│            │  │ 🚀 Déploiement               │  │
│            │  │                              │  │
│            │  │ Prochaine action:            │  │
│            │  │ Appel demain 10h             │  │
│            │  │                              │  │
│            │  │ [Voir détails]               │  │
│            │  └──────────────────────────────┘  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Request cards: Stacked, full width
- ID: Monospace font, neutral color
- Status badge: Color-coded by status
- Timeline: Vertical, left-aligned
  - Completed: Green check + gray text
  - Current: Orange loading + bold text + background highlight
  - Pending: Gray clock + gray text
- Next action: Info box, light blue background
- Details button: Secondary style

---

### ÉCRAN 10: SETTINGS

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Main Content]                    │
│  Sidebar   │                                    │
│            │  Paramètres                        │
│            │                                    │
│            │  [Account] [Security] [Integ...]   │
│            │  (Tabs)                            │
│            │                                    │
│            │  Account Info:                     │
│            │  ┌──────────────────────────────┐  │
│            │  │ Nom                          │  │
│            │  │ [Estee]                      │  │
│            │  │                              │  │
│            │  │ Email (read-only)            │  │
│            │  │ estee@agency.com             │  │
│            │  │                              │  │
│            │  │ Entreprise                   │  │
│            │  │ [Estee Agency]               │  │
│            │  │                              │  │
│            │  │ Plan actuel                  │  │
│            │  │ [Pro] (badge, read-only)     │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  [Enregistrer les modifications]   │
│            │                                    │
│            │  Security:                         │
│            │  [Changer le mot de passe]         │
│            │                                    │
│            │  Sessions actives:                 │
│            │  • Chrome on MacOS (current)       │
│            │  • Safari on iPhone (2h ago)       │
│            │  [Déconnecter tous les appareils]  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Tabs: Horizontal, underline active
- Sections: Stacked, 32px spacing
- Input fields: Full width in section
- Read-only fields: Lighter background
- Save button: Primary, full width in section
- Security buttons: Secondary, danger variant

---

## PARTIE 2: ÉCRANS ADMIN (6 screens)

---

### ÉCRAN 11: ADMIN DASHBOARD

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Main Content]                    │
│  Sidebar   │                                    │
│  (Admin)   │  Admin Dashboard                   │
│            │                                    │
│  📊 Dash   │  Health Check (4 KPI boxes)        │
│  👥 Cli    │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  ⚙️ Work   │  │99.8│ │ 2  │ │250 │ │$45 │     │
│  📋 Req    │  │%✅ │ │⚠️  │ │ms✅│ │/mo │     │
│  🔴 Err    │  └────┘ └────┘ └────┘ └────┘     │
│  💬 Sup    │                                    │
│  💰 Fin    │  Quick Stats (4 KPI boxes)         │
│  🔐 Auth   │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│  ⚙️ Sett   │  │ 1  │ │ 3  │ │847 │ │€750│     │
│            │  │Cli │ │Work│ │Req │ │Rev │     │
│  [Admin]   │  └────┘ └────┘ └────┘ └────┘     │
│            │                                    │
│            │  Alerts & Issues                   │
│            │  ┌──────────────────────────────┐  │
│            │  │ ⚠️ 2 Workflows Failed        │  │
│            │  │ ⚠️ 1 Client Auth Issue       │  │
│            │  │ ℹ️ 3 Support Tickets pending │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  Graphs (2 cols)                   │
│            │  ┌────────┐ ┌────────┐            │
│            │  │Request │ │ Usage  │            │
│            │  │Timeline│ │by Work │            │
│            │  │ (line) │ │ (pie)  │            │
│            │  └────────┘ └────────┘            │
│            │                                    │
│            │  Recent Activity                   │
│            │  • 15:45 - Workflow executed...    │
│            │  • 15:30 - New client registered   │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Admin sidebar: Same structure, different nav items
- Health check boxes: Color-coded (green=good, yellow=warning, red=error)
- Alert cards: Full width, colored left border
  - Error: Red border + light red background
  - Warning: Orange border
  - Info: Blue border
- Graphs: 2 columns, equal width
- Activity list: Scrollable, max 10 items visible

---

### ÉCRAN 12: ADMIN CLIENTS

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  [Main Content]                    │
│  Sidebar   │                                    │
│  (Admin)   │  Gestion Clients                   │
│            │                                    │
│            │  [Search] [Filter ▼] [Sort ▼]     │
│            │                                    │
│            │  Client Cards/Table:               │
│            │  ┌──────────────────────────────┐  │
│            │  │ Estee Agency        [✓ Actif]│  │
│            │  │ estee@agency.com             │  │
│            │  │ Plan: Pro | Created: Oct 2024│  │
│            │  │ Last login: 2h ago           │  │
│            │  │ Revenue: €750/mo             │  │
│            │  │ Workflows: 3                 │  │
│            │  │ [Details] [Logs] [Disable]  │  │
│            │  │                              │  │
│            │  │ ▼ Expandable Details:        │  │
│            │  │   • Full client info         │  │
│            │  │   • Workflows list           │  │
│            │  │   • Usage stats              │  │
│            │  │   • Audit log                │  │
│            │  └──────────────────────────────┘  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Search: 400px width
- Cards: Full width, expandable accordion
- Status badge: Right-aligned in header
- Info rows: Label + value, small text
- Action buttons: Small size, inline flex
- Expanded section: Light gray background, padding 16px

---

### ÉCRAN 13: ADMIN WORKFLOWS

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  Workflows Management              │
│  Sidebar   │                                    │
│            │  [Search] [Filter ▼] [+ New]      │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ Batch Image Generator        │  │
│            │  │ Client: Estee      [✓ Actif] │  │
│            │  │                              │  │
│            │  │ Executions (24h/7d/30d):     │  │
│            │  │ 12 / 45 / 156               │  │
│            │  │                              │  │
│            │  │ Success rate:                │  │
│            │  │ [████████████░] 95%         │  │
│            │  │                              │  │
│            │  │ Avg duration: 14m 30s        │  │
│            │  │ Revenue (month): €450        │  │
│            │  │                              │  │
│            │  │ [Details] [Stats] [Edit]    │  │
│            │  └──────────────────────────────┘  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Cards: Workflow info + metrics
- Success rate: Progress bar with percentage
- Metrics: Flex row, 3 columns
- Detail modal: Opens on "Details" click
  - Full-screen overlay
  - Charts + recent executions
  - Configuration settings

---

### ÉCRAN 14: ADMIN ERRORS & LOGS

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  Erreurs & Logs                    │
│  Sidebar   │                                    │
│            │  Filters:                          │
│            │  [Critical ▼] [Last 24h ▼]        │
│            │  ☑ Unresolved only                │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ 🔴 Workflow Timeout          │  │
│            │  │ 8 occurrences                │  │
│            │  │ First: 2h ago | Last: 30m    │  │
│            │  │ Affected:                    │  │
│            │  │ - Estee (3x)                 │  │
│            │  │ - Batch Image Gen (5x)       │  │
│            │  │ [View details]               │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ ⚠️ API Rate Limit            │  │
│            │  │ 2 occurrences                │  │
│            │  │ ...                          │  │
│            │  └──────────────────────────────┘  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Error cards: Color-coded by severity
  - Critical: Red icon + border
  - Warning: Orange
  - Info: Blue
- Occurrence count: Bold, large
- Timestamps: Small, neutral
- Detail modal: Stack trace + affected items

---

### ÉCRAN 15: ADMIN SUPPORT TICKETS

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  Support & Tickets                 │
│  Sidebar   │                                    │
│            │  [Open] [In Progress] [Resolved]   │
│            │  (Tabs)                            │
│            │                                    │
│            │  ┌──────────────────────────────┐  │
│            │  │ #T-001 - Login Issue         │  │
│            │  │ [🔴 Urgent] [Open]           │  │
│            │  │                              │  │
│            │  │ Client: Estee                │  │
│            │  │ Created: 1h ago              │  │
│            │  │                              │  │
│            │  │ Preview: "Je n'arrive pas à  │  │
│            │  │ me connecter depuis..."      │  │
│            │  │                              │  │
│            │  │ [View & Reply]               │  │
│            │  └──────────────────────────────┘  │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- Tabs: Filter by status
- Priority badges: Color-coded
  - Urgent: Red
  - High: Orange
  - Medium: Blue
  - Low: Gray
- Cards: Ticket preview + metadata
- Detail modal: Conversation thread + reply form

---

### ÉCRAN 16: ADMIN FINANCES

**Layout:**
```
┌────────────┬────────────────────────────────────┐
│            │  Finances & Usage                  │
│  Sidebar   │                                    │
│            │  KPI Boxes (4 cols)                │
│            │  ┌────┐ ┌────┐ ┌────┐ ┌────┐     │
│            │  │€750│ │€750│ │€245│ │ 68%│     │
│            │  │/mo │ │/yr │ │Cost│ │Mar │     │
│            │  └────┘ └────┘ └────┘ └────┘     │
│            │                                    │
│            │  Charts (2 cols)                   │
│            │  ┌────────┐ ┌────────┐            │
│            │  │Revenue │ │Revenue │            │
│            │  │Timeline│ │by Work │            │
│            │  │ (line) │ │ (pie)  │            │
│            │  └────────┘ └────────┘            │
│            │                                    │
│            │  ┌────────┐ ┌────────┐            │
│            │  │Cost vs │ │ Usage  │            │
│            │  │Revenue │ │by Cli  │            │
│            │  │ (bar)  │ │ (bar)  │            │
│            │  └────────┘ └────────┘            │
│            │                                    │
│            │  Breakdown Table:                  │
│            │  ┌──────────────────────────────┐  │
│            │  │ Client | Sub | Usage | Rev  │  │
│            │  │ Estee  | Pro | High  | €750 │  │
│            │  │ TOTAL  |  1  |       | €750 │  │
│            │  └──────────────────────────────┘  │
│            │                                    │
│            │  Upcoming Payments:                │
│            │  • Estee renewal: Dec 5 → €2,500   │
└────────────┴────────────────────────────────────┘
```

**Specs:**
- KPI boxes: Same as dashboard
- Charts: 2x2 grid, equal size
- Table: Striped rows, sortable columns
- Upcoming payments: List with dates + amounts

---

## RESPONSIVE VARIANTS

### Mobile Adaptations (All Screens)

**General Rules:**
- Sidebar → Top bar with hamburger menu
- Multi-column grids → Single column
- Side-by-side buttons → Stacked full-width
- Card padding: 24px → 16px
- Section spacing: 32px → 24px

**Specific Adaptations:**

**Dashboard:**
- KPI boxes: 2x2 grid instead of 1x4
- Workflow cards: 1 column, full width
- Sidebar: Slide-in drawer

**Workflow Execution:**
- Form width: 100% minus 16px margin
- Buttons: Full width, stacked

**Admin Screens:**
- Tables → Stacked cards
- Charts: 1 column, full width
- Filters: Collapsible section

---

## COMPONENT STATES SUMMARY

**All Interactive Elements:**
- Default
- Hover (desktop only)
- Active/Pressed
- Focus (keyboard navigation)
- Disabled
- Loading (where applicable)
- Error (forms)

**Forms:**
- Empty
- Filled
- Valid
- Invalid with error message

**Cards:**
- Default
- Hover (subtle shadow increase)
- Expanded (for accordions)

**Modals:**
- Closed (hidden)
- Opening animation (fade + scale)
- Open
- Closing animation

---

## FIGMA ORGANIZATION

### Components Page Structure
```
📄 Design System
  ├─ 🎨 Colors (swatches)
  ├─ ✏️ Typography (text styles)
  ├─ 📏 Spacing (grid examples)
  ├─ 🔘 Buttons (all variants + states)
  ├─ 📝 Forms (inputs, textareas, selects)
  ├─ 🗂️ Cards (base + variants)
  ├─ 🏷️ Badges (all colors)
  ├─ ⚙️ Modals (base structure)
  ├─ 🔄 Spinners
  ├─ 📊 Progress Bars
  ├─ 📍 Navigation (sidebar + items)
  └─ 📦 KPI Boxes
```

### Naming Convention
```
Component / Variant / State
Examples:
- Button/Primary/Default
- Button/Primary/Hover
- Button/Secondary/Disabled
- Input/Default/Focus
- Card/Workflow/Hover
```

### Auto-Layout Usage
- All components use auto-layout
- Padding: Consistent with design tokens
- Gaps: Use spacing system (8px grid)
- Resizing: Set to "Hug" or "Fill" appropriately

---

## EXPORT SPECS

**Assets to Export:**
- Logo: SVG + PNG (@1x, @2x, @3x)
- Icons: SVG (if custom)
- Placeholder images: PNG

**Design Tokens:**
- JSON file (already created)
- CSS variables file (to create)

**Documentation:**
- Component usage guide
- Responsive breakpoints
- Animation specifications

---

## DEVELOPER HANDOFF CHECKLIST

- [ ] All 16 screens designed (desktop + mobile)
- [ ] Component library complete with all states
- [ ] Design tokens exported as JSON
- [ ] Responsive specs documented
- [ ] Interaction/animation specs written
- [ ] Figma file organized with clear naming
- [ ] Developer has view access to Figma
- [ ] Design system documentation shared
- [ ] CSS variables/Tailwind config provided
- [ ] Asset exports ready
- [ ] Prototype created for key flows

---

**Version:** 1.0
**Last Updated:** 2025-11-15
**Total Screens:** 16 (10 Client + 6 Admin)
**Responsive Variants:** 3 (Desktop, Tablet, Mobile)
**Total Frames:** 48 frames minimum

---

## NOTES IMPORTANTES POUR LE DÉVELOPPEMENT

### Priority Implementation Order:
1. **Phase 1 (Week 1):** Design system + Login + Dashboard
2. **Phase 2 (Week 2):** Workflow execution flow (screens 4-7)
3. **Phase 3 (Week 3):** Admin dashboard + client management
4. **Phase 4 (Week 4):** Polish + remaining screens

### Quick Wins for MVP:
- Use Tailwind UI components as base
- Implement shadcn/ui for complex components
- Use Heroicons for all icons
- Framer Motion for animations
- React Hook Form for form handling

### Performance Considerations:
- Lazy load admin screens
- Optimize images (use WebP)
- Code-split by route
- Use React.memo for complex components
- Virtualize long lists (workflows, errors)

---

END OF SPECIFICATIONS
