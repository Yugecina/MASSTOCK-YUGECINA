# MasStock - Guide Figma Complet

Guide étape par étape pour créer le fichier Figma de MasStock avec tous les écrans et le design system.

---

## Structure du Fichier Figma

```
📁 MasStock Design System
  📄 0. Cover & Index
  📄 1. Design System
  📄 2. Components Library
  📄 3. CLIENT - Desktop
  📄 4. CLIENT - Mobile
  📄 5. ADMIN - Desktop
  📄 6. ADMIN - Mobile
  📄 7. Prototypes & Flows
```

---

## Page 0: Cover & Index

### Frame: Cover (1920x1080px)

```
┌──────────────────────────────────────┐
│                                      │
│         MasStock Design System       │
│         Version 1.0                  │
│                                      │
│         Client: Estee Agency         │
│         Designer: UI-Designer        │
│         Date: 2025-11-15            │
│                                      │
│         Tech Stack:                  │
│         React 18 + TailwindCSS       │
│                                      │
└──────────────────────────────────────┘
```

### Frame: Index (1920x1080px)

Table of contents avec liens cliquables vers chaque page.

---

## Page 1: Design System

### Section 1: Colors (Frame: 1920x400px)

**Layout:**
```
Colors
├─ Primary (Blue)
│  ├─ #007AFF (Main) [Swatch 80x80px]
│  ├─ #0051D5 (Dark)
│  └─ #E8F4FF (Light)
├─ Success (Green)
│  ├─ #34C759 (Main)
│  ├─ #2EA04D (Dark)
│  └─ #E8F5E9 (Light)
├─ Warning (Orange)
│  ├─ #FF9500 (Main)
│  ├─ #E68900 (Dark)
│  └─ #FFF3E0 (Light)
├─ Error (Red)
│  ├─ #FF3B30 (Main)
│  ├─ #E63929 (Dark)
│  └─ #FFEBEE (Light)
└─ Neutral (Gray)
   ├─ #1F2937 (900)
   ├─ #6B7280 (600)
   ├─ #9CA3AF (400)
   ├─ #D1D5DB (300)
   ├─ #F3F4F6 (100)
   ├─ #F9FAFB (50)
   └─ #FFFFFF (White)
```

**How to create:**
1. Create rectangles 80x80px for each color
2. Fill with exact hex codes
3. Label below each swatch
4. Create Color Styles in Figma for reuse
5. Organize in auto-layout frames (horizontal)

---

### Section 2: Typography (Frame: 1920x600px)

**Text Styles to create:**

| Name | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| H1 | Inter | 32px | Semibold (600) | 38px (1.2) | 0 |
| H2 | Inter | 24px | Semibold (600) | 29px (1.2) | 0 |
| H3 | Inter | 20px | Semibold (600) | 26px (1.3) | 0 |
| Body | Inter | 16px | Regular (400) | 24px (1.5) | 0 |
| Body Small | Inter | 14px | Regular (400) | 21px (1.5) | 0 |
| Label | Inter | 12px | Medium (500) | 17px (1.4) | 0.5px |

**Display:**
```
H1: The quick brown fox jumps (32px)
H2: The quick brown fox jumps (24px)
H3: The quick brown fox jumps (20px)
Body: The quick brown fox jumps over the lazy dog (16px)
Body Small: The quick brown fox jumps over the lazy dog (14px)
Label: THE QUICK BROWN FOX (12px, uppercase)
```

**How to create:**
1. Create text layers with sample text
2. Apply font settings
3. Create Text Styles in Figma
4. Label each style on the left

---

### Section 3: Spacing (Frame: 1920x400px)

**Visual representation:**
```
xs (4px):   [━]
sm (8px):   [━━]
md (16px):  [━━━━]
lg (24px):  [━━━━━━]
xl (32px):  [━━━━━━━━]
2xl (48px): [━━━━━━━━━━━━]
```

**How to create:**
1. Create rectangles with heights matching spacing values
2. Use auto-layout to show spacing between elements
3. Label each spacing value
4. Show example of spacing in use (e.g., card with 24px padding)

---

### Section 4: Border Radius (Frame: 800x400px)

```
sm (6px):  [Rounded rectangle]
md (8px):  [Rounded rectangle]
lg (12px): [Rounded rectangle]
xl (16px): [Rounded rectangle]
full:      [Circle/pill shape]
```

---

### Section 5: Shadows (Frame: 1920x400px)

```
sm:  [Card with subtle shadow]
md:  [Card with medium shadow]
lg:  [Card with large shadow]
xl:  [Card with extra large shadow]
2xl: [Card with massive shadow]
```

**Shadow values:**
```
sm:  x:0 y:1 blur:2 spread:0 rgba(0,0,0,0.05)
md:  x:0 y:1 blur:3 spread:0 rgba(0,0,0,0.1)
     + x:0 y:1 blur:2 spread:0 rgba(0,0,0,0.06)
lg:  x:0 y:4 blur:6 spread:-1 rgba(0,0,0,0.1)
     + x:0 y:2 blur:4 spread:-1 rgba(0,0,0,0.06)
xl:  x:0 y:10 blur:15 spread:-3 rgba(0,0,0,0.1)
     + x:0 y:4 blur:6 spread:-2 rgba(0,0,0,0.05)
2xl: x:0 y:20 blur:25 spread:-5 rgba(0,0,0,0.1)
     + x:0 y:10 blur:10 spread:-5 rgba(0,0,0,0.04)
```

---

## Page 2: Components Library

### Organization

```
Components Library
├─ Buttons
│  ├─ Primary (Default, Hover, Active, Disabled, Loading)
│  ├─ Secondary (all states)
│  ├─ Danger (all states)
│  ├─ Ghost (all states)
│  └─ Sizes (Small, Medium, Large)
├─ Inputs
│  ├─ Default
│  ├─ Focus
│  ├─ Error
│  ├─ Disabled
│  └─ Filled
├─ Cards
│  ├─ Base Card
│  ├─ Workflow Card
│  └─ KPI Card
├─ Badges
│  ├─ Success
│  ├─ Warning
│  ├─ Error
│  └─ Neutral
├─ Modals
│  └─ Base Modal
├─ Progress Bars
│  └─ Progress Bar (with percentages)
├─ Spinners
│  ├─ Small
│  ├─ Medium
│  └─ Large
└─ Navigation
   ├─ Sidebar
   └─ Nav Item (Default, Hover, Active)
```

---

### Button Component (Create as Figma Component)

**Frame: Primary Button - Medium (Default)**
```
Size: Auto-layout horizontal
Padding: 12px 24px
Height: 40px
Border-radius: 12px
Fill: #007AFF
Text: "Button" (16px, Medium, White)
```

**Create variants:**
1. Right-click > Create Component
2. Add variants:
   - State: Default, Hover, Active, Disabled, Loading
   - Size: Small, Medium, Large
   - Variant: Primary, Secondary, Danger, Ghost

**Properties to add:**
- Boolean: Icon (show/hide icon)
- Text: Label

**Example of all states side by side:**
```
[Default] [Hover] [Active] [Disabled] [Loading]
```

---

### Input Component

**Base Input - Default State**
```
Width: 320px (or 100% in auto-layout)
Height: 44px
Border: 2px solid #D1D5DB
Border-radius: 12px
Padding: 12px 16px
Placeholder: "Placeholder text" (#9CA3AF)
```

**With Label:**
```
Label: "Email" (12px, Medium, #1F2937, uppercase)
Spacing: 8px
Input field
```

**Error State:**
```
Border: #FF3B30
Error message: "Error message" (14px, #FF3B30)
```

**Create as Component with variants:**
- State: Default, Focus, Error, Disabled, Filled

---

### Card Component

**Base Card**
```
Width: 360px (or flexible)
Padding: 24px
Border-radius: 8px
Fill: #FFFFFF
Shadow: md (0 1px 3px rgba(0,0,0,0.1))
```

**Workflow Card Example:**
```
┌────────────────────────────────┐
│ Batch Image Generator  [✓ Actif]│
│                                │
│ Génère des images en batch     │
│ avec Midjourney ou DALL-E      │
│                                │
│ Dernière: 2h ago | Usage: 12   │
│                                │
│ [Utiliser] [Historique]        │
└────────────────────────────────┘
```

---

### Badge Component

**Success Badge**
```
Width: Auto
Padding: 4px 12px
Border-radius: 6px
Fill: #E8F5E9
Text: "✓ Actif" (12px, Medium, #2EA04D)
```

Create variants for: Success, Warning, Error, Neutral

---

### Modal Component

**Base Structure:**
```
Backdrop:
- Fill: Black 50% opacity
- Blur: 4px

Modal:
- Width: 600px
- Padding: 32px
- Border-radius: 16px
- Fill: White
- Shadow: 2xl

Content:
- Title (H2)
- Body content
- Footer buttons (right-aligned)
- Close button (top-right corner)
```

---

### Sidebar Navigation

**Sidebar**
```
Width: 280px
Height: 100vh (full height)
Fill: #F9FAFB
Border-right: 1px solid #E5E7EB
Padding: 24px 16px
```

**Nav Item - Active**
```
Width: Fill container
Padding: 12px 16px
Border-radius: 12px
Fill: #E8F4FF
Text: Primary blue (#007AFF)
Icon: 20x20px
Gap: 12px
```

**Nav Item - Default**
```
Same structure
Fill: Transparent
Text: #6B7280
```

**Nav Item - Hover**
```
Fill: #F3F4F6
Text: #6B7280
```

---

## Page 3: CLIENT - Desktop

### Frame Specifications

**Size:** 1440px width × variable height (usually 1024px+)

### Screen 1: Login Page (Frame: 1440x900px)

**Layout:**
```
Background: Gradient from #F9FAFB to #E8F4FF

Centered Card (400x auto):
├─ Logo "MasStock" (32px, Bold, Primary)
├─ Title "Connectez-vous..." (H1)
├─ Email Input (full width)
├─ Password Input (full width)
├─ Login Button (full width, 48px)
├─ "Mot de passe oublié?" link
└─ Security note "🔒 Vos données..."
```

**Auto-layout settings:**
- Direction: Vertical
- Spacing: 24px
- Padding: 48px
- Alignment: Center

---

### Screen 2: Client Dashboard (Frame: 1440x1200px)

**Layout:**
```
┌────────────┬────────────────────────────────┐
│  Sidebar   │  Main Content                  │
│  (280px)   │  (1160px, centered max 1200px) │
│            │                                │
│  [Sidebar  │  ┌──────────────────────────┐  │
│   Nav]     │  │ Welcome Section          │  │
│            │  │ H1: "Espace Estee"       │  │
│            │  │ Subtitle                 │  │
│            │  └──────────────────────────┘  │
│            │                                │
│            │  ┌──────────────────────────┐  │
│            │  │ Workflows Grid           │  │
│            │  │ (3 columns, gap 24px)    │  │
│            │  │ [Card] [Card] [Card]     │  │
│            │  └──────────────────────────┘  │
│            │                                │
│            │  ┌──────────────────────────┐  │
│            │  │ KPI Boxes                │  │
│            │  │ (4 columns, gap 16px)    │  │
│            │  └──────────────────────────┘  │
│            │                                │
│            │  [Request Workflow Button]     │
└────────────┴────────────────────────────────┘
```

**Auto-layout:**
- Main container: Horizontal (Sidebar + Main)
- Main content: Vertical with 32px spacing between sections
- Workflow grid: Grid layout (3 columns, 24px gap)
- KPI grid: Grid layout (4 columns, 16px gap)

---

### Screen 3-10: Similar structure

Follow the specs in `FIGMA_SCREENS_SPECS.md` for each screen.

**Key components to reuse:**
- Sidebar (same for all client screens)
- Page header (H1 + subtitle pattern)
- Cards (workflow cards, request cards)
- Buttons (consistent across screens)

---

## Page 4: CLIENT - Mobile

### Frame Specifications

**Size:** 375px width × variable height

### Mobile Adaptations

**General changes:**
- Remove fixed sidebar → Add top bar with hamburger menu
- Single column layouts (no multi-column grids)
- Full-width buttons
- Reduced padding (16px instead of 24px)
- Stack elements vertically

**Top Bar (Frame: 375x64px)**
```
┌─────────────────────────────────┐
│ ☰  MasStock            👤       │
└─────────────────────────────────┘
Height: 64px
Padding: 16px
Hamburger menu (left)
User icon (right)
```

**Mobile Dashboard Example:**
```
┌─────────────────────────┐
│ Top Bar                 │
├─────────────────────────┤
│ Espace Estee            │
│ Bienvenue, Estee        │
├─────────────────────────┤
│ Vos Workflows           │
│                         │
│ ┌─────────────────────┐ │
│ │ Workflow Card       │ │
│ │ (full width)        │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Workflow Card       │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ Statistiques            │
│ ┌─────┐ ┌─────┐        │
│ │ KPI │ │ KPI │        │
│ └─────┘ └─────┘        │
│ ┌─────┐ ┌─────┐        │
│ │ KPI │ │ KPI │        │
│ └─────┘ └─────┘        │
└─────────────────────────┘
```

---

## Page 5: ADMIN - Desktop

### Same structure as Client, different content

**Sidebar Navigation (Admin version):**
```
- 📊 Dashboard
- 👥 Gestion Clients
- ⚙️ Workflows Management
- 📋 Demandes en cours
- 🔴 Erreurs & Logs
- 💬 Support & Tickets
- 💰 Finances & Usage
- 🔐 Authentification
- ⚙️ Paramètres Admin
```

**Admin Dashboard (Frame: 1440x1400px)**

Follow specs in `FIGMA_SCREENS_SPECS.md` for:
- Screen 11: Admin Dashboard
- Screen 12: Clients Management
- Screen 13: Workflows Management
- Screen 14: Errors & Logs
- Screen 15: Support Tickets
- Screen 16: Finances

---

## Page 6: ADMIN - Mobile

Same mobile adaptations as Client Mobile.

---

## Page 7: Prototypes & Flows

### Create Interactive Prototype

**Main Flow to prototype:**
1. Login → Dashboard
2. Dashboard → Workflow Execution (4 steps)
3. Dashboard → Request Workflow → Confirmation

**Interactions to add:**
- Button clicks → Navigate to next screen
- Modal open/close animations
- Form submission flows
- Hover states on desktop

**Prototype settings:**
- Device: Desktop (1440px) or iPhone 14 Pro (390px)
- Starting frame: Login
- Flow name: "Main User Flow"

---

## Figma Best Practices

### 1. Use Auto-Layout Everywhere
- All components should use auto-layout
- Makes responsive design easier
- Enables easy content updates

### 2. Create Components for Reusable Elements
- Buttons (with variants)
- Inputs (with variants)
- Cards
- Badges
- Navigation items

### 3. Use Constraints
- Set constraints for responsive behavior
- Center important elements
- Pin navigation elements

### 4. Naming Convention
```
Page / Section / Element
Examples:
- CLIENT / Dashboard / Workflow Card
- ADMIN / Clients / Client Card
- Components / Buttons / Primary
```

### 5. Layer Organization
```
Frame
├─ Background
├─ Content
│  ├─ Section 1
│  │  ├─ Title
│  │  └─ Content
│  └─ Section 2
└─ Actions
```

### 6. Use Grid & Layout Grid
- 8px grid for alignment
- 12-column grid for desktop (1200px max-width)
- 4-column grid for mobile

---

## Export Settings

### For Development Handoff

**Assets to export:**
1. Logo (SVG + PNG @1x, @2x, @3x)
2. Icons (if custom) (SVG)
3. Placeholder images (WebP/PNG)

**Design Tokens:**
- Already exported as JSON (design-tokens.json)

**Figma Inspect:**
- Share Figma file with developers
- Enable "Developer Handoff" mode
- Developers can inspect spacing, colors, fonts

---

## Figma Plugins to Use

### Recommended Plugins:

1. **Content Reel** - Generate realistic content
2. **Unsplash** - Add real images
3. **Iconify** - Insert icons quickly
4. **Stark** - Accessibility checker
5. **Design Lint** - Check consistency
6. **Autoflow** - Create flow diagrams
7. **Chart** - Create charts for admin screens
8. **Tables Generator** - Create data tables

---

## Timeline & Workflow

### Day 1: Design System + Components
- [ ] Set up color styles
- [ ] Set up text styles
- [ ] Create all base components
- [ ] Create component variants
- [ ] Test components in different states

### Day 2: Client Screens
- [ ] Create all 10 client screens (desktop)
- [ ] Create mobile variants
- [ ] Link components
- [ ] Review consistency

### Day 3: Admin Screens + Polish
- [ ] Create all 6 admin screens (desktop)
- [ ] Create mobile variants
- [ ] Add interactions/prototype
- [ ] Final review & export
- [ ] Share with team

---

## Checklist Before Sharing

- [ ] All colors match design tokens
- [ ] All text uses defined text styles
- [ ] All components are properly named
- [ ] Variants are set up correctly
- [ ] Auto-layout is used consistently
- [ ] Pages are organized logically
- [ ] Prototype flows work
- [ ] Mobile variants are complete
- [ ] Accessibility checked (contrast, etc.)
- [ ] File is organized and clean
- [ ] Share link is public/accessible

---

## Sharing & Handoff

### Figma Link Setup
1. Click "Share" in top-right
2. Set to "Anyone with the link can view"
3. Copy link
4. Share with team

### Developer Mode
- Enable "Dev Mode" in Figma
- Developers can:
  - Inspect CSS
  - Copy code
  - Export assets
  - See spacing/measurements

### Documentation to Share
1. Link to Figma file
2. design-tokens.json
3. DESIGN_SYSTEM.md
4. FIGMA_SCREENS_SPECS.md
5. COMPONENT_EXAMPLES.md

---

**Version:** 1.0
**Last Updated:** 2025-11-15
**Total Frames to Create:** 48+ (16 screens × 3 breakpoints)
**Estimated Time:** 2-3 days

---

END OF FIGMA GUIDE
