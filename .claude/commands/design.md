# Frontend Design Command

Create or improve UI components following the MasStock design system.

## Steps

1. **Read the current design system:**
   - `.agent/system/design_system.md`
   - `frontend/src/styles/variables.css`

2. **Invoke skill:** `frontend-design:frontend-design`

3. **Apply user request:** $ARGUMENTS

## Rules

- Pure CSS only (NO Tailwind)
- Use CSS variables: `var(--primary)`, `var(--spacing-md)`, etc.
- Clean SVG icons (no emojis)
- Prefer editing existing files
- Follow patterns from `frontend/src/styles/pages.css`

## Task

$ARGUMENTS
