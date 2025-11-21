# Visual Reference Quick Guide - "The Organic Factory"

**MASSTOCK Design System**
**For Developers & Designers**
**Last Updated**: November 21, 2025

This is a quick visual reference guide showing all key design patterns with ASCII wireframes and exact specifications.

---

## Color Palette Quick Reference

```
CANVAS                  BRAND IDENTITY           ACTION (USE SPARINGLY!)
━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━
Ghost White             Electric Indigo          Acid Lime
#F4F5F9                 #4F46E5                  #CCFF00
████████████████████   ████████████████████     ████████████████████
Main Background         Primary CTAs             Generate Button ONLY
                        Focus States             (MAX 2-5% interface)

STRUCTURE               SEMANTIC COLORS
━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Obsidian                Success       Warning      Error
#111111                 #34C759       #FF9500      #FF3B30
████████████████████   ██████████   ██████████   ██████████
Headlines, Text         Completed    Processing   Failed
```

---

## Typography Scale

```
HERO (Landing only)     PAGE TITLES             SECTION HEADERS
━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━
Clash Display 48px      Clash Display 36px      Satoshi 24px
Bold (700)              Bold (700)              Semibold (600)

 ██   ██  ███            ██   ██  ██            H2 Title
 ██   ██ ██              ██   ██  ██
 ███████ ███             ███████  ██

BODY TEXT               SMALL TEXT              DATA/TECH
━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━━━
Satoshi 16px            Satoshi 14px            JetBrains Mono 14px
Regular (400)           Regular (400)           Medium (500)

Normal paragraph text.  Secondary metadata      exec_142_2025-11-21
Line height: 1.5        Labels, captions        Timestamps, IDs
```

---

## Button Components

### Primary Button (Indigo)

```
┌─────────────────────────────────┐
│                                 │
│       Save Changes              │  ← Satoshi 16px Semibold
│                                 │
└─────────────────────────────────┘

Default:     Background: linear-gradient(135deg, #4F46E5, #6366F1)
             Color: white
             Padding: 12px 24px
             Border-radius: 12px
             Shadow: 0 2px 8px rgba(79, 70, 229, 0.2)

Hover:       translateY(-1px)
             Shadow: 0 4px 12px rgba(79, 70, 229, 0.3)
             Background: darker gradient

Active:      translateY(0)
             Shadow: 0 2px 4px rgba(79, 70, 229, 0.2)
```

### Action Button (Lime - SPARINGLY)

```
┌─────────────────────────────────┐
│                                 │
│   ⚡ Generate Now               │  ← Obsidian text on Lime bg
│                                 │
└─────────────────────────────────┘

CRITICAL: Use ONLY for primary conversion action (max 1-2 per page)

Default:     Background: #CCFF00 (Acid Lime)
             Color: #111111 (Obsidian)
             Glow: 0 2px 8px rgba(204, 255, 0, 0.2)

Hover:       scale(1.02)
             Glow: 0 0 20px rgba(204, 255, 0, 0.6)

Click:       Animation: glow-pulse 600ms
             Confetti on success (optional)
```

### Secondary Button (Ghost)

```
┌─────────────────────────────────┐
│                                 │
│        Cancel                   │  ← Neutral colors
│                                 │
└─────────────────────────────────┘

Default:     Background: white
             Border: 2px solid #E5E7EB
             Color: #111111

Hover:       Background: #F9FAFB
             Border: #D1D5DB
```

---

## Card Components (Bento Grid)

### Standard Card

```
┌───────────────────────────────────────────────┐
│  radius-lg (12px)                             │
│  ┌─────────────────────────────────────────┐ │
│  │                                         │ │
│  │   Card Title                            │ │  ← Satoshi 20px Semibold
│  │   (padding: 24px)                       │ │
│  │                                         │ │
│  │   Card content goes here with proper   │ │
│  │   spacing and typography.              │ │
│  │                                         │ │
│  │   [Action Button]                      │ │
│  │                                         │ │
│  └─────────────────────────────────────────┘ │
│                                               │
└───────────────────────────────────────────────┘

Background:  white
Border:      1px solid #E5E7EB
Shadow:      0 1px 3px rgba(0, 0, 0, 0.08)
Hover:       translateY(-2px)
             Shadow: 0 4px 12px rgba(0, 0, 0, 0.1)
```

### Card with Gradient Top Bar

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  ← 4px gradient bar (on hover)
┌───────────────────────────────┐    Indigo → Lime gradient
│                               │    scaleX(0) → scaleX(1)
│   Workflow Name               │    300ms ease-out
│                               │
│   Description text...         │
│                               │
│   [▶ Run Now]                │
│                               │
└───────────────────────────────┘
```

### Card with Lime Accent

```
┃ ┌─────────────────────────────┐  ← 4px Lime border-left
┃ │                             │
┃ │   Success Rate              │
┃ │                             │
┃ │   98.5%                     │  ← Large metric
┃ │                             │
┃ └─────────────────────────────┘
```

---

## Input Components

### Text Input

```
┌─────────────────────────────────────────┐
│  Enter workflow name                    │  ← Placeholder (Neutral-400)
└─────────────────────────────────────────┘

Default:     Border: 1px solid #E5E7EB
             Radius: 8px
             Padding: 12px 16px
             Font: Satoshi 16px

Hover:       Border: #D1D5DB

Focus:       Border: #4F46E5 (Indigo)
             Glow: 0 0 0 3px rgba(79, 70, 229, 0.1)

Error:       Border: #FF3B30 (Red)
             Shake animation (400ms)
             Error message appears below
```

### Input with Icon

```
┌───┬─────────────────────────────────────┐
│ 🔍│  Search workflows...                │  ← Icon left-aligned
└───┴─────────────────────────────────────┘

Icon position: absolute, left: 12px
Input padding-left: 40px
```

---

## Badge Components

```
SUCCESS            WARNING            ERROR              LIME (Sparingly)
━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━
┌──────────┐     ┌──────────────┐   ┌──────────┐     ┌─────────────┐
│  ACTIVE  │     │  PROCESSING  │   │  FAILED  │     │  FEATURED   │
└──────────┘     └──────────────┘   └──────────┘     └─────────────┘

#E8F5E9          #FFF3E0            #FFEBEE          #F5FFDB
Green bg         Orange bg          Red bg           Lime bg

Text: #2EA04D   Text: #E68900      Text: #E63929    Text: #111111
```

---

## Toast Notifications

```
Position: Fixed, top-right, 24px from edges

┌────────────────────────────────────────────┐
│ ┃ [✅]  Success                      [×]   │  ← 4px green border-left
│ ┃  Workflow executed successfully         │
│ ┃  Results ready in 2.3s                  │
└────────────────────────────────────────────┘

Animation: slide-in-right (300ms)
Auto-dismiss: 3s (success), 5s (error)

┌────────────────────────────────────────────┐
│ ┃ [❌]  Invalid API Key               [×]   │  ← 4px red border-left
│ ┃  Get a new key from Google AI Studio    │
│ ┃  [Get API Key →]                         │  ← Optional action link
└────────────────────────────────────────────┘
```

---

## Empty States

```
                    ┌─────────────────┐
                    │                 │
                    │   [SVG Icon]    │  ← 200x200px custom illustration
                    │   (Indigo+Lime) │     Organic style, glows
                    │                 │
                    └─────────────────┘

                  No workflows yet              ← Clash Display 24px Bold

        Create your first workflow to start     ← Satoshi 16px Regular
        automating your content production          Neutral-600

                 ┌───────────────────┐
                 │  Create Workflow  │          ← Lime button
                 └───────────────────┘

Padding: 64px vertical, center-aligned
Animation: fade-in-up (600ms)
```

---

## Dashboard Layout (Bento Grid)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ SIDEBAR (280px, fixed)           MAIN CONTENT                           │
│                                                                          │
│ ┌──────────────────┐           ┌────────────────────────────────────┐  │
│ │  [M] MASSTOCK    │           │  Welcome back, Marie!               │  │
│ │  (Indigo logo)   │           │  Manage automation workflows        │  │
│ └──────────────────┘           └────────────────────────────────────┘  │
│                                                                          │
│ ┌──────────────────┐           METRICS BENTO GRID (4 columns, gap:16px)│
│ │  Dashboard       │           ┌───────┬───────┬───────┬───────────┐  │
│ │  Workflows       │           │Active │ Total │Success│Time Saved │  │
│ │  Executions      │           │Wrkflw │ Exec  │ Rate  │           │  │
│ │  Requests        │           │       │       │       │           │  │
│ │  Settings        │           │  [8]  │ [142] │[98.5%]│   [24h]   │  │
│ └──────────────────┘           │Indigo │White  │ Lime  │  Indigo   │  │
│                                 └───────┴───────┴───────┴───────────┘  │
│ ┌──────────────────┐                                                   │
│ │  {Avatar}        │           RECENT WORKFLOWS (3 columns, gap:16px) │
│ │  Marie Dubois    │           ┌───────┬────────┬───────────────────┐ │
│ │  [Logout]        │           │ Card1 │ Card2  │  Card3            │ │
│ └──────────────────┘           │       │        │  Hover:           │ │
│                                 │       │        │  translateY(-4px) │ │
│                                 │[▶Run] │        │  shadow-lg        │ │
└─────────────────────────────────┴───────┴────────┴───────────────────┘ │
                                                                          │
Responsive:                                                               │
- Desktop (1024px+): 4 columns                                           │
- Tablet (768px): 2 columns                                              │
- Mobile (640px): 1 column, sidebar becomes hamburger menu              │
```

---

## Workflow Execute Page - Processing State

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STEP INDICATOR                                   │
│  [▰▰▰▰▰▰] Configure  [▰▰▰▰▰▰] Processing  [▱▱▱▱▱▱] Results         │
│    ✓ Complete          ⚡ Active         ⏱️ Pending                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PROCESSING CARD (Glassmorphism)                  │
│                                                                     │
│                   ┌────────────────────┐                           │
│                   │                    │                           │
│                   │  [Indigo Gradient  │  ← Animated glow          │
│                   │   Glow Animation]  │     Infinite rotation     │
│                   │                    │     3s ease               │
│                   └────────────────────┘                           │
│                                                                     │
│              Generating your images...                             │  ← Satoshi 20px
│                                                                     │
│          Processing prompt 3 of 10                                 │  ← JetBrains Mono
│          (2 succeeded, 0 failed)                                   │     14px
│                                                                     │
│          ⏱️ Elapsed: 0:24  |  🔮 Est: 1:36                        │  ← Real-time
│                                                                     │
│          [████████████░░░░░░░░░░] 30%                             │  ← Progress bar
│                                                                     │
│                   [Cancel Batch]                                   │  ← Ghost button
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘

Background: rgba(255, 255, 255, 0.85)
Backdrop-filter: blur(10px)
```

---

## Executions Page Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Workflow Executions                          [Refresh] [Back]      │
│  Monitor and review all your execution history                      │
└─────────────────────────────────────────────────────────────────────┘

STATUS CARDS (Clickable filters, 5 columns, gap: 12px)
┌──────┬──────┬──────┬──────┬──────┐
│Total │  ✅  │  ⚡  │  ⏱️  │  ❌  │
│ 120  │ 115  │  2   │  0   │  3   │  ← Large numbers (Clash Display)
│      │Complt│Procss│Pend. │Failed│  ← Labels (Satoshi 12px)
└──────┴──────┴──────┴──────┴──────┘

Click behavior: Filter list below to selected status
Active state: Indigo border, Indigo-50 background

EXECUTIONS LIST
┌─────────────────────────────────────────────────────────────────────┐
│ [✅] Nano Banana Workflow                         [Success]         │
│      Nov 21, 2025 14:32      Duration: 2.3s              [→]       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ [⚡] Product Images                                [Processing]      │
│      Nov 21, 2025 14:28      Progress: 75%                [→]       │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│ [❌] Social Media Posts                           [Failed]          │
│      Nov 21, 2025 14:20      Error: API Key Invalid       [→]       │
└─────────────────────────────────────────────────────────────────────┘

Hover: translateX(4px), shadow-sm, background: neutral-50
```

---

## Modal Component

```
═══════════════════════════════════════════════════════════════════════
Overlay: rgba(0, 0, 0, 0.4), position: fixed, inset: 0
═══════════════════════════════════════════════════════════════════════

                    ┌───────────────────────────────┐
                    │  MODAL (Glassmorphism)        │
                    │  Max-width: 600px             │
                    ├───────────────────────────────┤
                    │  Confirm Action               │  ← Header
                    ├───────────────────────────────┤
                    │                               │
                    │  Are you sure you want to     │  ← Body
                    │  delete this workflow?        │     (padding: 24px)
                    │                               │
                    │  This action cannot be undone.│
                    │                               │
                    ├───────────────────────────────┤
                    │              [Cancel] [Delete]│  ← Footer
                    └───────────────────────────────┘     (right-aligned)

Background: rgba(255, 255, 255, 0.85)
Backdrop-filter: blur(10px)
Border-radius: 16px
Shadow: 0 20px 40px rgba(0, 0, 0, 0.15)

Animation: scale-in (300ms ease-spring)
  - From: scale(0.95), opacity: 0
  - To: scale(1), opacity: 1

Accessibility:
  - role="dialog"
  - aria-modal="true"
  - Focus trap (Esc to close)
```

---

## Animation Timeline Examples

### Button Click → Loading → Success

```
Time     User Action        Button State           Visual
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Click down         scale(0.95)            Press feedback
T+100ms  Click release      scale(1.05) + glow     Lime glow starts
T+200ms  -                  scale(1)               Normalize
T+300ms  -                  Loading state          Spinner appears
...      Processing...      Disabled               User waits
T+2000ms Success            Lime flash (600ms)     Celebrate!
T+2600ms -                  Confetti burst         🎉
T+3000ms -                  Success toast          "Completed in 2s"
```

### Card Hover

```
Time     Event              Transform              Shadow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
T+0ms    Hover in           translateY(0)          shadow-sm
T+100ms  -                  translateY(-2px)       shadow-md (transitioning)
T+200ms  Complete           translateY(-2px)       shadow-md (stable)
...      Hovering...        Stable at -2px         Stable shadow
T+0ms    Hover out          translateY(-2px)       shadow-md
T+200ms  Complete           translateY(0)          shadow-sm
```

---

## Responsive Breakpoints

```
MOBILE                TABLET                DESKTOP
(≤640px)              (641px-1024px)        (≥1024px)
━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━   ━━━━━━━━━━━━━━━━━━

Grid: 1 column        Grid: 2 columns       Grid: 4 columns
Sidebar: Hidden       Sidebar: Hidden       Sidebar: Fixed (280px)
  (hamburger menu)      (hamburger menu)

Font sizes:           Font sizes:           Font sizes:
  H1: 28px             H1: 32px              H1: 36px
  Body: 16px           Body: 16px            Body: 16px

Spacing:              Spacing:              Spacing:
  Reduced 25%          Standard              Standard

Buttons:              Buttons:              Buttons:
  Full-width           Auto-width            Auto-width
```

---

## WCAG 2.1 AA Compliance Quick Check

```
COLOR CONTRAST RATIOS (on Ghost White #F4F5F9)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Obsidian (#111111)        18.6:1    AAA  (All text sizes OK)
✅ Neutral-700 (#4B5563)      8.2:1    AAA  (All text sizes OK)
✅ Indigo-600 (#4F46E5)       6.7:1    AA   (Text ≥14px OK)
❌ Lime-500 (#CCFF00)         1.87:1   FAIL (NEVER use for text!)

FOCUS STATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All interactive elements:
  outline: 2px solid #4F46E5
  outline-offset: 2px

KEYBOARD NAVIGATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cmd/Ctrl + K  → Global search
Tab           → Next element
Shift + Tab   → Previous element
Enter         → Activate
Esc           → Close modal
```

---

## Common Patterns Quick Reference

### 1. Dashboard Metric Card (Indigo)

```css
.metric-card-indigo {
  background: linear-gradient(135deg, #EEF2FF, #E0E7FF);
  border: 1px solid #C7D2FE;
  border-radius: 12px;
  padding: 24px;
}

.metric-value {
  font-family: 'Clash Display';
  font-size: 36px;
  font-weight: 700;
  color: #111111;
}

.metric-label {
  font-family: 'Satoshi';
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

### 2. Success Badge with Pulse

```css
.badge-success {
  background: #E8F5E9;
  color: #2EA04D;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

/* On success event */
.badge-success.pulse {
  animation: lime-pulse 600ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### 3. Loading State (Indigo Gradient)

```css
.loading-glow {
  width: 200px;
  height: 200px;
  background: linear-gradient(
    270deg,
    #4F46E5, #6366F1, #818CF8, #6366F1, #4F46E5
  );
  background-size: 400% 400%;
  animation: gradient-rotate 3s ease infinite;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.8;
}
```

---

## Implementation Checklist

**Before using this design system**:

- [ ] Read DESIGN_SYSTEM_ORGANIC_FACTORY.md (50+ pages)
- [ ] Install fonts (Clash Display, Satoshi, JetBrains Mono)
- [ ] Import global-organic-factory.css
- [ ] Replace logos with new SVG variants
- [ ] Verify CSS variables are accessible
- [ ] Test on all target browsers
- [ ] Run accessibility audit (Lighthouse)
- [ ] Test keyboard navigation
- [ ] Test with screen reader (NVDA/VoiceOver)
- [ ] Verify animations run at 60fps

**Remember**:
- Lime-500: MAX 2-5% of interface (Generate button primarily)
- Glassmorphism: Overlays/modals ONLY
- Clash Display: Logo/hero headlines ONLY
- Satoshi: 90% of interface text
- JetBrains Mono: IDs, timestamps, code only

---

**Document Type**: Visual Reference (ASCII Wireframes)
**For**: Developers implementing design system
**Complement to**: Full documentation (150+ total pages)
**Last Updated**: November 21, 2025
