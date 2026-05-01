# Design System — CSS Token Reference

**Owner:** Saul (UI Designer)  
**Last updated:** 2026-05-01  
**Stack:** VS Code Extension Webview · React · Tailwind CSS v3 · VS Code Theme API

---

## Architecture Overview

The app has two CSS systems running in parallel:

| System | Files | Used by |
|---|---|---|
| **Legacy tokens** | `webview-ui/src/styles.css` | PBI Studio, Sidebar, UserStoryWizard, old views |
| **Tailwind bridge** | `webview-ui/src/styles/tailwind.css` + `tailwind.config.js` | DashboardView, FeatureCreationWizard, StatusBadge |

Both systems ultimately resolve to VS Code's `--vscode-*` runtime theme variables.  
**Never use hardcoded color values.** Always use VS Code tokens or bridge variables.

---

## Tailwind Bridge Tokens

All `--tw-vscode-*` CSS custom properties are declared in `webview-ui/src/styles/tailwind.css`  
and exposed as Tailwind utility classes via `tailwind.config.js`.

### Surface & Layout

| CSS Variable | VS Code Token | Tailwind Class | Description |
|---|---|---|---|
| `--tw-vscode-bg` | `--vscode-editor-background` | `bg-tw-bg` | Main editor/view background |
| `--tw-vscode-bg-alt` | `--vscode-sideBar-background` | `bg-tw-bg-alt` | Accordion headers, list row backgrounds |
| `--tw-vscode-surface` | `--vscode-editorWidget-background` | `bg-tw-surface` | Card surfaces, info panels, widget backgrounds |

### Text / Foreground

| CSS Variable | VS Code Token | Tailwind Class | Description |
|---|---|---|---|
| `--tw-vscode-fg` | `--vscode-editor-foreground` | `text-tw-fg` | Primary body/heading text |
| `--tw-vscode-fg-muted` | `--vscode-descriptionForeground` | `text-tw-fg-muted` / `text-tw-muted` | Secondary/helper text, labels, counts |

### Borders

| CSS Variable | VS Code Token | Tailwind Class | Description |
|---|---|---|---|
| `--tw-vscode-border` | `--vscode-widget-border` → `--vscode-panel-border` | `border-tw-border` | All dividers, card outlines, input borders |

> **Light mode note:** `--vscode-panel-border` can be transparent in some light themes.  
> The bridge prefers `--vscode-widget-border` in light mode as it is more reliably visible.

### Interactive

| CSS Variable | VS Code Token | Tailwind Class | Description |
|---|---|---|---|
| `--tw-vscode-accent` | `--vscode-button-background` | `bg-tw-accent` | Primary CTA buttons, step indicators |
| `--tw-vscode-accent-fg` | `--vscode-button-foreground` | `text-tw-accent-fg` | Text on accent backgrounds |
| `--tw-vscode-input-bg` | `--vscode-input-background` | `bg-tw-input` | Input, textarea, select backgrounds |

### Status Colors (Foreground + Soft Background)

| Status | Foreground var | Background var | Light-mode token strategy |
|---|---|---|---|
| **success** | `--tw-vscode-success` | `--tw-vscode-success-bg` | `--vscode-testing-iconPassed` (dark green in light) |
| **warning** | `--tw-vscode-warning` | `--tw-vscode-warning-bg` | `--vscode-gitDecoration-modifiedResourceForeground` (amber/brown) |
| **info** | `--tw-vscode-info` | `--tw-vscode-info-bg` | `--vscode-textLink-foreground` (WCAG AA guaranteed) |
| **error** | `--tw-vscode-error` | `--tw-vscode-error-bg` | `--vscode-editorError-foreground` (dark red) |

Status soft backgrounds use `rgba()` values tuned per theme variant:
- **Dark**: 15% opacity tint
- **Light**: 12% opacity (slightly less — looks cleaner on white)  
- **High contrast**: 25% opacity (more visible)

---

## Light Mode Rules

When writing components, assume dark-mode first (`:root` defaults). For light mode:

1. **Use `var(--tw-vscode-*)` bridge vars** — they are already overridden in `body.vscode-light`
2. **Never use `body.vscode-dark` overrides** — `:root` already handles dark
3. **For direct `--vscode-*` usage** (legacy components), add `[data-theme="light"]` scoped rules in `styles.css`
4. **Test each token** — don't assume a dark-theme token looks good in light; check its resolved value

### WCAG AA Rules for Status Text
| Status | Light token | Contrast ratio |
|---|---|---|
| success | `--vscode-testing-iconPassed` | ≥ 4.5:1 on white ✅ |
| warning | `--vscode-gitDecoration-modifiedResourceForeground` | ≥ 4.5:1 on white ✅ |
| info | `--vscode-textLink-foreground` | Guaranteed AA by VS Code spec ✅ |
| error | `--vscode-editorError-foreground` | ≥ 4.5:1 on white ✅ |

---

## Legacy Token System (`styles.css`)

The old `styles.css` uses `[data-theme="light"]` / `[data-theme="dark"]` CSS data attributes  
(set by `ThemeProvider.tsx`) and semantic custom properties:

| Old var | Semantic meaning | Tailwind bridge equivalent |
|---|---|---|
| `--ink` | Primary text | `--tw-vscode-fg` |
| `--ink-muted` | Secondary text | `--tw-vscode-fg-muted` |
| `--panel` | Card/panel background | `--tw-vscode-surface` |
| `--bg-elev` | Elevated background | `--tw-vscode-bg-alt` |
| `--line` | Border/divider | `--tw-vscode-border` |
| `--accent` | Primary action color | `--tw-vscode-accent` |
| `--success` | Success state | `--tw-vscode-success` |
| `--info` | Info state | `--tw-vscode-info` |
| `--warning` | Warning state | `--tw-vscode-warning` |
| `--danger` | Error state | `--tw-vscode-error` |

**Consistency rule:** When building NEW components, use Tailwind bridge vars (`--tw-vscode-*`).  
Align to the same VS Code tokens as the legacy system to ensure visual consistency.

---

## Component Patterns

### Card / Panel
```tsx
<div
  className="rounded-lg border"
  style={{ background: 'var(--tw-vscode-surface)', borderColor: 'var(--tw-vscode-border)' }}
>
```

### Accordion Header (section dividers, list group headers)
```tsx
<div style={{ background: 'var(--tw-vscode-bg-alt)', color: 'var(--tw-vscode-fg-muted)' }}>
```

### Input Field
```tsx
<input
  className="rounded-md border px-3 py-2 text-sm outline-none"
  style={{
    background: 'var(--tw-vscode-input-bg)',
    borderColor: 'var(--tw-vscode-border)',
    color: 'var(--tw-vscode-fg)',
  }}
/>
```

### Status Badge
Use `StatusBadge` component — it auto-adapts via bridge vars. Do not hardcode status colors.

### Info/Warning Callout
```tsx
<div
  className="rounded-md px-3 py-2 border text-sm"
  style={{ background: 'var(--tw-vscode-info-bg)', borderColor: 'var(--tw-vscode-border)', color: 'var(--tw-vscode-info)' }}
>
```

---

## Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| `color: 'var(--tw-vscode-fg)'` | `color: '#333333'` |
| `background: 'var(--tw-vscode-surface)'` | `background: '#f5f5f5'` |
| `borderColor: 'var(--tw-vscode-border)'` | `border: '1px solid rgba(0,0,0,0.1)'` |
| Use `StatusBadge` for status chips | Hardcode `background: 'rgba(0,120,212,0.15)'` in component |
| Add `body.vscode-light` override when introducing a new var | Leave `:root` dark fallbacks for light mode |

---

## Files Reference

```
webview-ui/
├── src/
│   ├── styles/
│   │   └── tailwind.css        ← Bridge variable definitions (EDIT HERE for new tokens)
│   ├── styles.css              ← Legacy token system (old components)
│   └── components/
│       └── StatusBadge.tsx     ← Reference implementation of bridge var usage
├── tailwind.config.js          ← Tailwind color palette (add new tw-* entries here)
└── ...
.vscode/
├── settings.json               ← Suppresses @tailwind IDE warnings
└── tailwind-css-data.json      ← Custom data for VS Code CSS IntelliSense
```

---

## WCAG 2.1 AA Compliance Guidelines

### Minimum Contrast Ratios
- Normal text (< 18pt): 4.5:1 minimum
- Large text (≥ 18pt or ≥ 14pt bold): 3:1 minimum
- UI components (borders, icons): 3:1 minimum

### VS Code Token Mapping for WCAG Compliance

| Purpose | Light mode | Dark mode | Min ratio |
|---------|-----------|-----------|-----------|
| Body text | `--vscode-editor-foreground` (#1e1e1e) | same | 4.5:1 on bg |
| Muted text | `--vscode-descriptionForeground` (#616161) | (#999999) | 4.5:1 on bg |
| Accent/links | `--vscode-textLink-foreground` | same | 4.5:1 on bg |
| Disabled text | `--vscode-disabledForeground` | same | ≥ 3:1 |
| Focus ring | `--vscode-focusBorder` | same | 3:1 on bg |

### Touch Targets
- All interactive elements: minimum 44×44px (WCAG 2.5.5)
- Use `min-h-touch min-w-touch` Tailwind utilities

### Reduced Motion
Always include `@media (prefers-reduced-motion: reduce)` — already in global base styles.

### Focus Management
- Use `:focus-visible` not `:focus` for ring styles
- Every interactive element needs a visible focus indicator
- Focus should be trapped in modals/dialogs
