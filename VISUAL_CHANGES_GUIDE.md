# Visual Changes Guide - Before & After

**Date**: November 21, 2025
**Design System**: "The Organic Factory"

This document highlights the key visual differences between the old design (Apple Blue) and new design (Organic Factory with Indigo + Lime).

---

## Color Transformation

### Primary Brand Color

**BEFORE** (Apple Blue):
```
Primary: #007AFF (iOS Blue)
Hover: #0051D5
Light: #E8F4FF
```

**AFTER** (Electric Indigo):
```
Primary: #4F46E5 (Indigo-600)
Hover: #4338CA (Indigo-700)
Light: #EEF2FF (Indigo-50)
```

**Where you'll see it**:
- All primary buttons (was blue, now indigo gradient)
- Focus states on inputs (was blue glow, now indigo glow)
- Links (was blue, now indigo)
- Active nav items background (was blue, now indigo)

---

### Action/CTA Color (NEW)

**BEFORE**: Didn't exist - all CTAs used primary blue

**AFTER** (Acid Lime - USE SPARINGLY):
```
Action: #CCFF00 (Lime-500)
Soft: #D4FF33 (Lime-400 - safer alternative)
```

**Where you'll see it** (2-5% max):
- ✅ "Generate" button in NanoBananaForm (THE primary conversion action)
- ✅ Active nav item left border (4px accent only)
- ✅ Success badges (small surfaces)
- ✅ Confirmation buttons in modals

**Critical Rule**: Lime is used VERY sparingly. If you see it everywhere, something's wrong.

---

### Background Colors

**BEFORE**:
```
Background: #FFFFFF (Pure White)
Secondary: #F9FAFB (Neutral-50)
```

**AFTER**:
```
Canvas Base: #F4F5F9 (Ghost White - slightly warmer)
Card Background: #FFFFFF (Pure White - elevated surfaces)
```

**Difference**: Main background is now slightly off-white (Ghost White) to create depth. Cards "float" on white background.

---

## Typography Changes

### Font Families

**BEFORE**:
```
All text: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', etc.)
```

**AFTER**:
```
Logo: Clash Display (geometric, fashion-forward)
Body: Satoshi (90% of interface - clean, readable)
Data: JetBrains Mono (execution IDs, timestamps, code)
```

**Where you'll see it**:
- Logo is now custom SVG (not text)
- All body text uses Satoshi (slightly different letterforms than system fonts)
- Technical data (IDs, dates) uses monospace JetBrains Mono

**Note**: If fonts don't load, system fonts are used as fallback. Check DevTools Network tab.

---

### Text Sizes

**BEFORE**: Standard sizes
**AFTER**: Slightly larger for accessibility

Example:
- Body text: 16px (was 16px) - same
- Small text: 14px (was 14px) - same
- Micro text: 12px (new minimum)

**Mobile**: All sizes reduce by ~15% on mobile (responsive)

---

## Component Changes

### Buttons

#### Primary Button

**BEFORE**:
- Background: Solid iOS Blue (#007AFF)
- Hover: Darker blue
- No gradient

**AFTER**:
- Background: Indigo gradient (135deg, #4F46E5 → #6366F1)
- Hover: Darker gradient + lift up 1px + stronger shadow
- Border-radius: 12px (was 8px - more rounded)

#### Action Button (NEW - Lime)

**BEFORE**: Didn't exist

**AFTER**:
- Background: Acid Lime (#CCFF00)
- Text: Obsidian (dark) for contrast
- Hover: Scale 1.02 + glow (0 0 20px rgba(204,255,0,0.6))
- Animation: **glow-pulse** (infinite pulsing when enabled)

**Where**: Only on "Generate" button (NanoBananaForm) and critical CTAs

#### Ghost Button

**BEFORE**:
- Background: Neutral-100
- Border: None

**AFTER**:
- Background: Transparent
- Border: 1px solid transparent
- Hover: Background neutral-100

**Where**: Logout button, cancel actions

---

### Cards

**BEFORE**:
- Border-radius: 8px
- Border: 1px solid #E5E7EB
- No hover effect

**AFTER** (Bento Style):
- Border-radius: **12px** (more rounded - "Bento" style)
- Border: 1px solid #E5E7EB (same)
- Hover (if interactive):
  - Lift up 4px (translateY(-4px))
  - Shadow increases (md → lg)
  - Border color changes to Indigo-200

**New Variants**:
- `.card-interactive` - Clickable cards with hover
- `.card-indigo` - Indigo-50 background (subtle)
- `.card-lime-accent` - 4px Lime left border
- `.card-glass` - Glassmorphism (overlays only)

---

### Inputs

**BEFORE**:
- Border: Neutral-200
- Focus: Blue border + blue glow

**AFTER**:
- Border: Neutral-200 (same)
- Focus: **Indigo border + indigo glow** (0 0 0 3px rgba(79,70,229,0.1))
- Border-radius: 8px (same)

**Error State**:
- Border: Red (#FF3B30)
- Glow: Red (0 0 0 3px rgba(255,59,48,0.1))

---

### Navigation (Sidebar)

**BEFORE**:
- Logo: Text "MasStock" in blue
- Active item: Blue background (#E8F4FF)
- Hover: Gray background

**AFTER**:
- Logo: **SVG image** (Indigo→Lime gradient for client, monochrome for admin)
- Active item:
  - Indigo-50 background (#EEF2FF)
  - **Lime left border** (4px solid #CCFF00) ← KEY DIFFERENTIATOR
  - Indigo-600 text
- Hover: Neutral-100 background

**Visual Impact**: The Lime left border on active items is very distinctive.

---

### Badges

**BEFORE**:
- Border-radius: 6px
- Colors: Standard semantic (green, yellow, red)

**AFTER**:
- Border-radius: 8px (slightly more rounded)
- Colors:
  - Success: #34C759 (iOS Green)
  - Warning: #FF9500 (iOS Orange)
  - Error: #FF3B30 (iOS Red)
  - **NEW: Lime** (#F5FFDB background, Obsidian text)

---

### Modals

**BEFORE**:
- Background: Solid white
- Border: 1px solid gray
- No blur

**AFTER** (Glassmorphism):
- Background: **rgba(255,255,255,0.85)** (85% opaque)
- **Backdrop-filter: blur(10px)** (content behind is blurred)
- Border: 1px solid rgba(255,255,255,0.2)
- Shadow: 0 20px 40px rgba(0,0,0,0.15)
- Animation: Scale-in (from 0.95 to 1) + fade-in

**Fallback**: If browser doesn't support backdrop-filter, background becomes 95% opaque (solid).

**Where**: Confirmation modals, example prompts modal

---

### Loading States

#### Spinner

**BEFORE**:
- Solid blue circle with spinning border

**AFTER**:
- **Gradient spinner** (Indigo → Lime)
- Animation: gradient-rotate 2s infinite
- Border-radius: 50% with blur(40px) for glow effect

**Where**: NanoBananaForm loading state, general loading indicators

---

## Page-Specific Changes

### Login Page

**BEFORE**:
- White card on neutral-50 background
- Text logo "MasStock" in blue
- Blue "Sign In" button
- Standard inputs

**AFTER**:
- **Glassmorphism card** on Ghost White background
- **Centered gradient logo** (60px height)
- **Indigo gradient "Sign In" button**
- Inputs with indigo focus glow
- Overall more "premium" and "clinical" feel

---

### Dashboard

**TO BE UPDATED IN PHASE 2**

**Planned Changes**:
- Bento Grid layout (4 cols → 2 → 1 responsive)
- Stats cards with glassmorphism
- Quick action button: Lime "New Workflow"

---

### Workflows List

**TO BE UPDATED IN PHASE 2**

**Planned Changes**:
- Bento Grid cards (3 cols desktop)
- Interactive hover effects (lift + shadow)
- Empty state component (emoji + message + CTA)

---

### Workflow Execute (NanoBananaForm)

**BEFORE**:
- Blue "Generate N Images" button
- Standard form inputs
- Blue confirmation modal

**AFTER** (COMPLETED ✅):
- **LIME "🚀 Generate N Images" button with glow-pulse animation**
- Inputs with indigo focus states
- Glassmorphism confirmation modal
- Bento Grid summary in modal (2x2 cards)
- Gradient spinner (Indigo→Lime) during loading

**This is THE most important visual change** - the primary conversion button is now Lime (disruptive) instead of Indigo (brand).

---

## Animation Changes

### New Animations

**glow-pulse** (Lime Action Button):
```
0% → 100%: box-shadow pulses from 0 to 20px rgba(204,255,0,0.6)
Duration: 2s infinite
```

**gradient-rotate** (Loading Spinner):
```
0% → 100%: background-position shifts 0% → 100% → 0%
Duration: 3s infinite
Creates rotating gradient effect
```

**scale-in** (Modals):
```
From: scale(0.95) opacity(0)
To: scale(1) opacity(1)
Duration: 300ms
```

**slide-in-right** (Toasts):
```
From: translateX(100%) opacity(0)
To: translateX(0) opacity(1)
Duration: 300ms
```

### Timing

**All animations**: 200ms default (was 200ms - same)
**Easing**: cubic-bezier(0,0,0.2,1) - ease-out (was same)

**Critical**: Animations MUST run at 60fps. If laggy, check browser performance.

---

## Key Visual Identifiers

### How to Quickly Verify Design System is Active

Look for these **5 KEY INDICATORS**:

1. **Logo is an image** (gradient SVG), not text "MasStock"
   - Location: Top of sidebar, login page

2. **Active nav items have LIME LEFT BORDER** (4px)
   - Location: Sidebar navigation

3. **"Generate" button is LIME with glow-pulse**
   - Location: Workflow Execute page (NanoBananaForm)

4. **Login card has glassmorphism** (translucent + blur)
   - Location: Login page

5. **Primary buttons are INDIGO GRADIENT** (not solid blue)
   - Location: Everywhere (Sign In, Execute, Save, etc.)

**If ALL 5 are true**: Design system successfully applied ✅

**If ANY are false**: Something went wrong with CSS loading ❌

---

## Common Visual Issues

### Issue 1: Fonts Look Wrong

**Symptom**: Text looks like Arial/Helvetica (system fonts)

**Expected**: Text should look slightly different (Satoshi is more geometric than system fonts)

**Fix**: Fonts not loaded. See `/frontend/FONTS_INSTALLATION_GUIDE.md`

---

### Issue 2: No Lime Color Anywhere

**Symptom**: Everything is Indigo, no Lime

**Cause**: This is EXPECTED if you're not on the Workflow Execute page. Lime is used sparingly (2-5% max).

**Where to check**: Go to Workflows → Batch Nano Banana → Execute. The "Generate" button MUST be Lime.

---

### Issue 3: No Glow Animation

**Symptom**: Lime button is static, no pulsing

**Check**:
1. Button has `.glow-pulse` class
2. Button is NOT disabled
3. Browser doesn't have "Reduce motion" enabled
4. Inspect element → Animations tab shows `glow-pulse` running

---

### Issue 4: No Glassmorphism

**Symptom**: Login card and modals are solid white

**Check**:
1. Browser supports `backdrop-filter` (Chrome 76+, Safari 9+, Firefox 103+)
2. Inspect element → Computed → Search "backdrop-filter" → Should show `blur(10px)`
3. If not supported, fallback kicks in (solid 95% white) - this is OK

---

### Issue 5: Colors Still Blue (iOS Blue)

**Symptom**: Primary buttons are still #007AFF blue

**Cause**: Old CSS still loaded

**Fix**:
1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear cache: DevTools → Network → Disable cache (checkbox)
3. Check CSS file: DevTools → Sources → `global.css` → Search for "#4F46E5" (should exist)
4. Verify import: Check `/frontend/src/main.jsx` imports `./styles/global.css`

---

## Testing Checklist

Use this to verify visual changes:

### Colors
- [ ] Primary buttons: Indigo gradient (not blue)
- [ ] "Generate" button: Lime (#CCFF00)
- [ ] Active nav: Indigo bg + Lime left border
- [ ] Focus states: Indigo glow (not blue)
- [ ] Background: Ghost White (#F4F5F9, not pure white)

### Typography
- [ ] Logo: Image (not text)
- [ ] Body text: Satoshi font (if loaded, else system)
- [ ] Execution IDs: JetBrains Mono (monospace)

### Components
- [ ] Cards: 12px border-radius (not 8px)
- [ ] Modals: Glassmorphism effect
- [ ] Login card: Glassmorphism
- [ ] Buttons: 12px border-radius

### Animations
- [ ] "Generate" button: Glow-pulse animation
- [ ] Cards: Lift on hover (if interactive)
- [ ] Modals: Scale-in animation
- [ ] Loading: Gradient spinner (Indigo→Lime)

### Overall
- [ ] Visual identity feels different (clinical + electric)
- [ ] Lime used sparingly (2-5% max - only on critical CTAs)
- [ ] No Tailwind classes (pure CSS only)

---

## Screenshots for Comparison

Take screenshots of these views for before/after comparison:

1. **Login Page** (full screen)
2. **Sidebar** (with active nav item)
3. **NanoBananaForm** (showing Generate button)
4. **Modal** (confirmation modal with glassmorphism)
5. **Loading State** (gradient spinner)

Compare to design docs:
- `/docs/VISUAL_SPECIFICATIONS_ORGANIC_FACTORY.md`
- `/docs/DESIGN_SYSTEM_ORGANIC_FACTORY.md`

---

## Summary

**Biggest Visual Changes**:
1. Blue → Indigo (everywhere)
2. New Lime action color (sparingly)
3. Logo text → Logo image (gradient SVG)
4. Lime left border on active nav
5. Glassmorphism on overlays
6. 8px → 12px border-radius (Bento style)
7. Glow-pulse animation on critical CTAs

**What Stayed the Same**:
- Layout structure (sidebar, content area)
- Component hierarchy
- Navigation structure
- Page routing
- Functionality

**Philosophy**:
- **Before**: Apple minimalist (iOS Blue, system fonts, flat design)
- **After**: Organic Factory (clinical precision + electric energy, custom fonts, depth)

---

**Next**: Follow `/QUICK_START_ORGANIC_FACTORY.md` to verify these changes work correctly! 🚀
