# Font Installation Guide - MASSTOCK "The Organic Factory"

**Date**: November 21, 2025
**Status**: Required for complete design system implementation

---

## Required Fonts

MASSTOCK's "Organic Factory" design system uses three premium fonts:

1. **Clash Display** (Display font - Logo & Hero headlines)
2. **Satoshi** (Body font - Primary UI text)
3. **JetBrains Mono** (Monospace - Technical data)

---

## Installation Steps

### Step 1: Download Fonts

#### Clash Display (Variable Font)
- **Source**: [Font Share - Clash Display](https://www.fontshare.com/fonts/clash-display)
- **Download**: Click "Download family" → Select **Variable font** option
- **File needed**: `ClashDisplay-Variable.woff2`

#### Satoshi (Variable Font)
- **Source**: [Font Share - Satoshi](https://www.fontshare.com/fonts/satoshi)
- **Download**: Click "Download family" → Select **Variable font** option
- **File needed**: `Satoshi-Variable.woff2`

#### JetBrains Mono (Variable Font)
- **Source**: [Google Fonts - JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono)
- **Download**: Click "Download family" → Extract `JetBrainsMono-Variable.woff2` from zip
- **Alternative**: [JetBrains Official](https://www.jetbrains.com/lp/mono/)

---

### Step 2: Place Files in Project

Create the fonts directory (if it doesn't exist):

```bash
mkdir -p /Users/dorian/Documents/MASSTOCK/frontend/public/fonts
```

Place the 3 downloaded files in this structure:

```
/frontend/public/fonts/
├── ClashDisplay-Variable.woff2
├── Satoshi-Variable.woff2
└── JetBrainsMono-Variable.woff2
```

**IMPORTANT**: File names must match exactly as shown above.

---

### Step 3: Verify Font Paths

The CSS file (`/frontend/src/styles/global.css`) already contains the `@font-face` declarations:

```css
@font-face {
  font-family: 'Clash Display';
  src: url('/fonts/ClashDisplay-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: 'Satoshi';
  src: url('/fonts/Satoshi-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: 'JetBrains Mono';
  src: url('/fonts/JetBrainsMono-Variable.woff2') format('woff2');
  font-weight: 100 900;
  font-display: swap;
}
```

These declarations point to `/fonts/` which resolves to `/public/fonts/` at runtime.

---

### Step 4: Test Font Loading

1. **Start development server**:
   ```bash
   cd /Users/dorian/Documents/MASSTOCK/frontend
   npm run dev
   ```

2. **Open browser DevTools** (F12 or Cmd+Option+I)

3. **Check Network tab**:
   - Filter by "Font"
   - Reload page (Cmd+R or F5)
   - Verify all 3 fonts load successfully (status 200)

4. **Visual verification**:
   - Logo should use **Clash Display** (bold, geometric)
   - Body text should use **Satoshi** (clean, readable)
   - Execution IDs/timestamps should use **JetBrains Mono** (monospace)

5. **Console check**:
   - No "Failed to load font" errors
   - No CORS errors

---

## Troubleshooting

### Fonts Not Loading

**Issue**: Console shows "Failed to load resource: net::ERR_FILE_NOT_FOUND"

**Solution**:
1. Verify file names match exactly (case-sensitive)
2. Check files are in `/frontend/public/fonts/` directory
3. Restart dev server (`npm run dev`)

### Fonts Load But Text Looks Wrong

**Issue**: Text renders in fallback fonts (system fonts)

**Solution**:
1. Check browser DevTools > Elements
2. Inspect an element (e.g., `<h1>`)
3. Computed styles should show:
   - Headlines: `font-family: "Clash Display", -apple-system, ...`
   - Body: `font-family: "Satoshi", -apple-system, ...`
4. If system font is used, clear browser cache and reload

### CORS Errors

**Issue**: Console shows CORS policy error for fonts

**Solution**:
- Fonts in `/public/` folder should not have CORS issues
- If using CDN or external source, add appropriate headers
- For local dev, Vite handles this automatically

---

## Font Usage Guidelines

### Clash Display (Logo & Hero)
**DO**:
- ✅ Logo
- ✅ Landing page hero headlines (H1 > 36px)
- ✅ Marketing materials

**DON'T**:
- ❌ UI titles (use Satoshi instead)
- ❌ Body text
- ❌ Small sizes (<24px)

### Satoshi (Body & UI)
**DO**:
- ✅ All UI text (90% of interface)
- ✅ Buttons, forms, cards
- ✅ Headings H1-H6 in UI
- ✅ Navigation labels

**DON'T**:
- ❌ Large hero headlines (use Clash Display)
- ❌ Technical data (use JetBrains Mono)

### JetBrains Mono (Data & Tech)
**DO**:
- ✅ Execution IDs (e.g., `exec_142`)
- ✅ Timestamps (e.g., `14:32:18`)
- ✅ Counters (e.g., `001/1000`)
- ✅ Code snippets
- ✅ API keys display

**DON'T**:
- ❌ Body text
- ❌ Headlines
- ❌ Buttons

---

## Performance Optimization

### Font Loading Strategy

The CSS uses `font-display: swap` which:
1. Shows fallback font immediately (no FOIT - Flash of Invisible Text)
2. Swaps to custom font when loaded
3. Improves perceived performance

### Preloading Critical Fonts (Optional)

For faster loading, add to `/frontend/index.html` (inside `<head>`):

```html
<link rel="preload" href="/fonts/Satoshi-Variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/fonts/ClashDisplay-Variable.woff2" as="font" type="font/woff2" crossorigin>
```

**Note**: Only preload fonts used above-the-fold (Satoshi and Clash Display). JetBrains Mono can load lazily.

---

## Verification Checklist

Before considering fonts installation complete:

- [ ] All 3 font files downloaded
- [ ] Files placed in `/frontend/public/fonts/` directory
- [ ] File names match exactly (case-sensitive)
- [ ] Dev server restarted
- [ ] Browser DevTools Network tab shows fonts loading (status 200)
- [ ] No console errors related to fonts
- [ ] Visual check: Logo uses Clash Display
- [ ] Visual check: Body text uses Satoshi
- [ ] Visual check: Execution IDs use JetBrains Mono

---

## License Information

### Clash Display & Satoshi (Font Share)
- **License**: Free for personal and commercial use
- **Source**: Indian Type Foundry via Font Share
- **Attribution**: Not required but appreciated

### JetBrains Mono
- **License**: Apache 2.0 (Open Source)
- **Source**: JetBrains
- **Attribution**: Not required

All fonts are legal to use in MASSTOCK without additional licensing fees.

---

## Support

If fonts still don't load after following this guide:

1. Check file integrity (re-download if corrupted)
2. Verify Vite config doesn't block font files
3. Check browser console for specific error messages
4. Test in different browser (Chrome, Firefox, Safari)

For design system questions, see:
- `/docs/DESIGN_SYSTEM_ORGANIC_FACTORY.md`
- `/docs/COMPONENTS_SPECIFICATIONS.md`

---

**Last Updated**: November 21, 2025
**Version**: 1.0
