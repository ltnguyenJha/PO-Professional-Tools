# Tailwind CSS Setup — webview-ui

**Author:** Saul (UI Designer)  
**Date:** 2026-04-30  
**Status:** Implemented

---

## Overview

Tailwind CSS v3 has been added to `webview-ui` alongside the existing custom CSS. The strategy is **additive, not replacement** — existing `.card`, `.btn`, `.kpi`, `.studio-item` classes remain untouched; Tailwind is used for new views (Dashboard, Feature Creation).

---

## Installation

```bash
cd webview-ui
npm install -D tailwindcss postcss autoprefixer
```

No changes to `vite.config.ts` are required — Vite auto-discovers `postcss.config.js` in the project root.

---

## Files Created / Modified

| File | Action | Purpose |
|------|--------|---------|
| `webview-ui/postcss.config.js` | Created | Enables PostCSS → Tailwind pipeline |
| `webview-ui/tailwind.config.js` | Created | Tailwind config with VS Code bridge colors |
| `webview-ui/src/styles/tailwind.css` | Created | `@tailwind` directives + bridge variable definitions |
| `webview-ui/src/main.tsx` | Modified | Added `import './styles/tailwind.css'` |

---

## VS Code Theme Strategy

VS Code injects `--vscode-*` CSS custom properties at runtime that reflect the active theme (dark, light, high-contrast). Tailwind's static color values **cannot** read these directly.

**Solution: Bridge Variables**

`src/styles/tailwind.css` defines `--tw-vscode-*` custom properties that map to `--vscode-*` variables:

```css
:root {
  --tw-vscode-bg:     var(--vscode-editor-background, #1e1e1e);
  --tw-vscode-fg:     var(--vscode-editor-foreground, #d4d4d4);
  --tw-vscode-border: var(--vscode-panel-border, #454545);
  /* ... */
}
```

`tailwind.config.js` then exposes these as custom Tailwind color utilities:

```js
colors: {
  'tw-bg':       'var(--tw-vscode-bg)',
  'tw-fg':       'var(--tw-vscode-fg)',
  'tw-border':   'var(--tw-vscode-border)',
  /* ... */
}
```

In TSX components, use them like any Tailwind class:

```tsx
<div className="bg-tw-bg text-tw-fg border border-tw-border rounded-lg">
```

**Limitation:** Tailwind's opacity modifier syntax (`bg-tw-bg/50`) does **not** work with CSS variable-backed colors without additional configuration. For opacity variations, use `style` prop with inline rgba values.

---

## Status Soft Backgrounds

Status colors (success/warning/info/error) use transparent tints that are theme-adapted:

```css
/* Dark theme (default) */
:root {
  --tw-vscode-success-bg: rgba(78, 201, 176, 0.15);
  --tw-vscode-warning-bg: rgba(204, 167, 0, 0.15);
}

/* Light theme */
body.vscode-light {
  --tw-vscode-success-bg: rgba(4, 120, 87, 0.12);
  --tw-vscode-warning-bg: rgba(146, 64, 14, 0.12);
}
```

VS Code adds `vscode-dark`, `vscode-light`, or `vscode-high-contrast` to `<body>` automatically.

---

## Custom Breakpoint

A `panel-wide` breakpoint at `700px` is defined for VS Code webview panel-specific responsive layout:

```js
// tailwind.config.js
screens: {
  'panel-wide': '700px',
}
```

Usage:
```tsx
<div className="flex flex-col panel-wide:flex-row gap-4">
```

---

## Coexistence with Existing CSS

**Rule:** Use Tailwind classes for new Dashboard/Feature Creation views. Keep existing `.card`, `.kpi`, `.btn`, `.chip` classes for views that already use them (PBI Studio, Settings, Projects).

- Tailwind `preflight` is **disabled** (`corePlugins.preflight: false`) to avoid overriding VS Code's base element styles
- Existing class names do not conflict with Tailwind utilities
- Both systems read from the same `--tw-vscode-*` bridge variables

---

## Usage Patterns

### Layout (pure Tailwind)
```tsx
<div className="flex items-center gap-2 px-3 py-2">
<div className="flex flex-col panel-wide:flex-row gap-4">
```

### Colors (bridge tokens)
```tsx
// Preferred: Tailwind class
<div className="bg-tw-bg text-tw-fg border-tw-border">

// When dynamic / opacity needed: inline style
<div style={{ background: 'var(--tw-vscode-success-bg)', color: 'var(--tw-vscode-success)' }}>
```

### Typography (Tailwind scale)
```tsx
<span className="text-xs font-medium">   // 12px medium
<h3 className="text-sm font-semibold">   // 14px semibold
<p className="text-base">                // 16px regular
```

---

## StatusBadge Component

`src/components/StatusBadge.tsx` — reusable theme-aware status chip:

```tsx
<StatusBadge status="draft" />   // amber
<StatusBadge status="ready" />   // blue
<StatusBadge status="pushed" />  // green
<StatusBadge status="draft" size="xs" />  // compact (sidebar)
```

---

## Migration Notes for Rusty

- No existing test files need updating — Tailwind classes are purely presentational
- The `DashboardView.tsx` has been fully replaced with the Tailwind-based implementation
- `StatusBadge.tsx` is a new component — import it wherever status display is needed
- When adding new views/features, follow the Tailwind-first pattern established in Dashboard
