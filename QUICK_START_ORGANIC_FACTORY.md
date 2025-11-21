# Quick Start - "The Organic Factory" Design System

**Date**: November 21, 2025
**Time to complete**: 15-30 minutes

---

## What's Been Done ✅

Phase 1 (Setup & Foundations) is **COMPLETE**:

1. ✅ CSS design system swapped (`global.css` replaced with 1,800+ lines of "Organic Factory" CSS)
2. ✅ Logos integrated (Sidebar, AdminSidebar, Login page)
3. ✅ Favicon updated
4. ✅ 3 new UI components created (Toast, EmptyState, SkeletonScreen)
5. ✅ **CRITICAL: "Generate" button (NanoBananaForm) updated with Lime action color + glow-pulse animation**
6. ✅ Login page redesigned with glassmorphism
7. ✅ Navigation updated (Indigo + Lime active states)

**Visual Identity**: Apple Blue → Electric Indigo + Acid Lime

---

## Immediate Next Steps (You Must Do This Now)

### Step 1: Install Fonts (10-15 minutes)

**Why**: Fonts are external and must be downloaded manually.

**Action**:
```bash
# 1. Read the guide
open /Users/dorian/Documents/MASSTOCK/frontend/FONTS_INSTALLATION_GUIDE.md

# 2. Create fonts directory
mkdir -p /Users/dorian/Documents/MASSTOCK/frontend/public/fonts

# 3. Download fonts from these sources:
# - Clash Display: https://www.fontshare.com/fonts/clash-display
# - Satoshi: https://www.fontshare.com/fonts/satoshi
# - JetBrains Mono: https://fonts.google.com/specimen/JetBrains+Mono

# 4. Place downloaded files:
# /frontend/public/fonts/
#   ├── ClashDisplay-Variable.woff2
#   ├── Satoshi-Variable.woff2
#   └── JetBrainsMono-Variable.woff2
```

**Expected Result**: 3 files in `/frontend/public/fonts/` directory

---

### Step 2: Start Development Server (1 minute)

```bash
cd /Users/dorian/Documents/MASSTOCK/frontend
npm run dev
```

**Expected Output**:
```
VITE v7.2.2  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

### Step 3: Visual Verification (5 minutes)

#### A. Login Page
**URL**: `http://localhost:5173/`

**What to check**:
- [ ] Background is **Ghost White** (#F4F5F9) - light gray, not pure white
- [ ] Logo appears as **gradient image** (Indigo→Lime), not text "MasStock"
- [ ] Login card has **glassmorphism effect** (slightly translucent with blur)
- [ ] "Sign In" button is **Indigo gradient** (not iOS blue)
- [ ] Inputs have **Indigo focus glow** when clicked

**Screenshot**: Take one and compare to design docs

#### B. Client Sidebar
**Login with**: `estee@masstock.com` / `EsteePassword123!`

**What to check**:
- [ ] Logo appears at top (full-color gradient)
- [ ] Active nav item has **Lime left border** (4px) + **Indigo-50 background**
- [ ] Logout button is **ghost style** (transparent with border)
- [ ] Hover effects work on nav items

#### C. Nano Banana Workflow (CRITICAL)
**Path**: Dashboard → Workflows → "Batch Nano Banana" → Execute

**What to check**:
- [ ] "Generate N Images" button is **LIME COLOR** (#CCFF00)
- [ ] Button has **glow-pulse animation** (subtle pulsing glow)
- [ ] On hover, glow intensifies
- [ ] Disabled state removes glow
- [ ] Loading state shows **Indigo→Lime gradient spinner**

**THIS IS THE MOST IMPORTANT BUTTON IN THE APP**

If it's NOT lime, something went wrong with CSS loading.

#### D. Browser DevTools Check

**Open DevTools** (F12 or Cmd+Option+I):

1. **Console** - Check for errors:
   - [ ] No "Failed to load font" errors
   - [ ] No CSS errors
   - [ ] No missing file errors

2. **Network Tab** - Filter by "Font":
   - [ ] 3 fonts load successfully (status 200):
     - `ClashDisplay-Variable.woff2`
     - `Satoshi-Variable.woff2`
     - `JetBrainsMono-Variable.woff2`
   - If fonts show 404, re-check Step 1

3. **Elements Tab** - Inspect button:
   ```html
   <button class="btn btn-primary-lime btn-lg w-full glow-pulse">
     🚀 Generate 4 Images
   </button>
   ```
   - [ ] Computed styles show `background-color: #CCFF00` (Lime)
   - [ ] Animation `glow-pulse` is running

---

### Step 4: Quick Functionality Test (5 minutes)

#### Test Workflow Execution

1. Go to **Workflows** page
2. Click **"Batch Nano Banana"**
3. Click **"Execute Workflow"**
4. Fill in form:
   - Prompts: Add 2-3 test prompts (double line breaks)
   - API Key: Any text starting with "AIza" + 30+ chars (format validation)
5. Click **"🚀 Generate N Images"** button

**Expected Behavior**:
- [ ] Button pulses with Lime glow
- [ ] Confirmation modal appears (glassmorphism)
- [ ] Modal "Confirm & Generate" button is also Lime
- [ ] On confirm, button shows **gradient spinner** (Indigo→Lime)
- [ ] Processing page shows elapsed time counter

**Note**: Actual execution will fail without valid API key - that's OK. We're testing UI/UX only.

---

## Troubleshooting

### Fonts Not Loading

**Symptom**: Text looks like system font, not Satoshi/Clash Display

**Fix**:
1. Verify files in `/frontend/public/fonts/` directory
2. Check file names match exactly (case-sensitive)
3. Restart dev server: `Ctrl+C` then `npm run dev`
4. Hard refresh browser: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
5. Check DevTools Network tab for 404 errors

### Lime Button Not Showing

**Symptom**: "Generate" button is blue or another color

**Fix**:
1. Check CSS loaded: Inspect element, look for `global.css` in Styles panel
2. Verify class: Button should have `btn-primary-lime` class
3. Check CSS variables: In DevTools Console, run:
   ```javascript
   getComputedStyle(document.documentElement).getPropertyValue('--lime-500')
   ```
   Should return: `#CCFF00`
4. Clear browser cache: Settings → Clear cache
5. If still broken, check `/frontend/src/styles/global.css` file exists

### No Glow Animation

**Symptom**: Button is Lime but doesn't pulse

**Fix**:
1. Check class: Button needs both `btn-primary-lime` AND `glow-pulse`
2. Verify keyframe exists: DevTools → Sources → `global.css` → Search for `@keyframes glow-pulse`
3. Check reduced motion: System Settings → Accessibility → Disable "Reduce motion"

### Glassmorphism Not Working

**Symptom**: Login card and modals look solid, not translucent

**Fix**:
1. Browser support: Safari ≥9, Chrome ≥76, Firefox ≥103
2. Check backdrop-filter: DevTools → Computed → Search "backdrop-filter"
3. Fallback applied: Should show `background: rgba(255,255,255,0.95)` if not supported

---

## What to Report Back

After completing Steps 1-4, report these results:

### ✅ Success Checklist

- [ ] Fonts loaded correctly (3/3 files status 200)
- [ ] Login page shows gradient logo + glassmorphism
- [ ] Sidebar shows logo + Lime border on active nav
- [ ] "Generate" button is LIME with glow-pulse animation
- [ ] Loading spinner shows Indigo→Lime gradient
- [ ] No console errors
- [ ] Overall visual identity changed from Blue to Indigo+Lime

### 📸 Screenshots Needed

Please take screenshots of:
1. Login page (full screen)
2. Sidebar with active nav item (showing Lime border)
3. NanoBananaForm with "Generate" button (showing Lime color + glow)
4. Browser DevTools Network tab (showing fonts loaded)

### 🐛 Issues Found

If anything doesn't match expectations, report:
- Component name / Page URL
- Expected behavior
- Actual behavior
- Console errors (copy-paste)
- Screenshot

---

## Next Phase Preview

Once Phase 1 is verified working, we'll proceed to **Phase 2: Component Migration**:

- Update existing Button, Card, Input, Badge, Modal, Spinner components
- Migrate Dashboard components (StatsCarousel, CardAsset, FilterTabs, etc.)
- Update all client pages (Dashboard, WorkflowsList, Executions, etc.)
- Update all admin pages

**Estimated time**: 10-15 hours of development

---

## Files to Review (Optional)

If you want to understand what changed:

### CSS
- **New**: `/frontend/src/styles/global.css` (1,800+ lines)
- **Old**: `/frontend/src/styles/global-old-backup.css` (backup)
- Compare: `diff global-old-backup.css global.css`

### Components Updated
- `/frontend/src/components/layout/Sidebar.jsx`
- `/frontend/src/components/layout/AdminSidebar.jsx`
- `/frontend/src/pages/Login.jsx`
- `/frontend/src/components/workflows/NanoBananaForm.jsx` (CRITICAL)

### New Components
- `/frontend/src/components/ui/Toast.jsx`
- `/frontend/src/components/ui/EmptyState.jsx`
- `/frontend/src/components/ui/SkeletonScreen.jsx`

### Documentation
- `/frontend/FONTS_INSTALLATION_GUIDE.md` (detailed font setup)
- `/FRONTEND_IMPLEMENTATION_SUMMARY.md` (complete status report)
- `/docs/DESIGN_SYSTEM_ORGANIC_FACTORY.md` (50+ pages reference)

---

## Summary

**You now have**:
- ✅ Complete "Organic Factory" CSS design system active
- ✅ Logos integrated across key components
- ✅ CRITICAL "Generate" button with Lime action color + animation
- ✅ 3 new utility components (Toast, EmptyState, Skeleton)
- ✅ Glassmorphism on Login page
- ✅ New visual identity (Indigo + Lime)

**You need to**:
1. Install 3 font files (10-15 min)
2. Start dev server
3. Verify visual changes (5 min)
4. Test "Generate" button specifically
5. Report back with screenshots + checklist

**Then we proceed to**:
- Phase 2: Migrate remaining 29+ components
- Phase 3: Comprehensive testing
- Phase 4: Production deployment

---

**Questions?**
- Font issues → See `/frontend/FONTS_INSTALLATION_GUIDE.md`
- Design questions → See `/docs/DESIGN_SYSTEM_ORGANIC_FACTORY.md`
- Implementation status → See `/FRONTEND_IMPLEMENTATION_SUMMARY.md`

**Let's verify Phase 1 works, then continue to Phase 2!** 🚀
