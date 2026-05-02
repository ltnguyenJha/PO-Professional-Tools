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

---

## AI Color Tokens

AI-powered features use a dedicated violet accent to distinguish "AI magic" from regular user actions (which use teal `--accent`).

| Token | Dark Theme | Light Theme | Usage |
|---|---|---|---|
| `--ai` | `#7c3aed` | `#6d28d9` | Primary AI accent (buttons, borders, text) |
| `--ai-strong` | `#8b5cf6` | `#7c3aed` | Hover state, emphasis |
| `--ai-soft` | `rgba(124, 58, 237, 0.12)` | `rgba(109, 40, 217, 0.10)` | Soft backgrounds, subtle fills |
| `--ai-glow` | `rgba(124, 58, 237, 0.25)` | `rgba(109, 40, 217, 0.15)` | Glow effects, box shadows |
| `--ai-ink` | `#c4b5fd` | `#6d28d9` | Text on dark AI backgrounds |

**Usage rule:** ONLY for AI-powered features (generation, refinement, suggestions). Regular actions always use teal (`--accent`).

**Rationale:** The violet/teal distinction codes "AI magic" vs. "user action" — preserve this split to maintain clear visual semantics.

---

## AI State Visual Patterns

AI-powered features require their own visual vocabulary to communicate system state and build user trust. These patterns balance delight with clarity — no overuse of gradients or animation.

### 1. AI Loading State (`.ai-shimmer`)

Animated shimmer gradient for when AI is actively generating content. Use on result containers or sections awaiting AI output.

**CSS:**
```css
@keyframes ai-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.ai-shimmer {
  background: linear-gradient(
    90deg,
    var(--ai-soft) 0%,
    var(--ai-glow) 50%,
    var(--ai-soft) 100%
  );
  background-size: 200% 100%;
  animation: ai-shimmer 1.5s ease-in-out infinite;
}
```

**When to use:** Active AI generation (not initial page load). Never use blocking spinners for AI features — prefer this non-intrusive shimmer.

### 2. AI Thinking State (`.ai-thinking`)

Pulsing glow for sections actively running AI operations. Draws attention without blocking interaction.

**CSS:**
```css
@keyframes ai-pulse {
  0%, 100% { box-shadow: 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 16px var(--ai-glow); }
}

.ai-thinking {
  animation: ai-pulse 2s ease-in-out infinite;
}
```

**When to use:** Apply to collapsible AI sections (e.g., "Refine with AI", "Generate Full Story") while the request is in flight.

### 3. AI Success State (`.ai-success-flash`)

Brief celebratory flash when AI completes successfully. Acknowledges completion, then fades.

**CSS:**
```css
@keyframes ai-success-flash {
  0% { 
    border-color: transparent;
    background: transparent;
  }
  20% { 
    border-color: var(--success);
    background: var(--success-soft);
  }
  100% { 
    border-color: transparent;
    background: transparent;
  }
}

.ai-success-flash {
  animation: ai-success-flash 600ms ease-out;
}
```

**When to use:** Trigger once on AI result container when generation completes. Not persistent — just a momentary celebration. Pair with a toast for explicit confirmation.

### 4. AI Tag Badge (`.ai-badge`)

Small pill to mark AI-generated content. Subtle, not prominent — users should know origin without distraction.

**CSS:**
```css
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--ai-soft);
  color: var(--ai);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.ai-badge::before {
  content: '✦';
  font-size: 10px;
}
```

**HTML:**
```html
<span class="ai-badge">AI</span>
```

**When to use:** Next to AI-generated acceptance criteria, descriptions, or titles. One badge per section — don't over-label.

### 5. Hover Lift (`.hover-lift`)

Standard micro-interaction for interactive cards and buttons. Every clickable surface needs feedback.

**CSS:**
```css
.hover-lift {
  transition: transform 120ms ease-out, box-shadow 120ms ease-out;
}

.hover-lift:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.hover-lift:active {
  transform: translateY(0);
}
```

**When to use:** All cards, secondary buttons, list items. Primary buttons get this automatically (see VISUAL_SPEC.md button enhancements).

### 6. Empty State Pattern (`.empty-state`)

Standard structure for empty views. Never show blank space — always provide context and next action.

**CSS:**
```css
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  gap: 12px;
  min-height: 320px;
}

.empty-state-icon {
  font-size: 48px;
  line-height: 1;
  opacity: 0.8;
}

.empty-state-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--ink);
  margin: 0;
}

.empty-state-subtitle {
  font-size: 14px;
  color: var(--ink-muted);
  margin: 0;
  max-width: 360px;
}
```

**HTML structure:**
```html
<div class="empty-state">
  <div class="empty-state-icon">📝</div>
  <h3 class="empty-state-title">No stories yet — let's build something</h3>
  <p class="empty-state-subtitle">Create your first PBI to get started with AI-powered backlog refinement.</p>
  <button class="btn-primary">Create Story</button>
</div>
```

**Copy guidelines:**
- Icon: Single emoji, relevant to context (48px)
- Title: Friendly, action-oriented (not "No data")
- Subtitle: Brief explanation + benefit
- CTA: One primary action button

**Standard empty states:**
- **PBI Studio (no PBIs):** "📝 No stories yet — let's build something" + "Create your first story" button
- **Dashboard (no epics/features):** "🚀 Ready to plan? Start with an epic" + "New Epic" button  
- **Projects (no projects):** "📁 No projects — import one or start standalone" + action buttons
- **Bulk breakdown (nothing running):** "⚡ Drop your epics here to break them down with AI" (no CTA — drag-drop is the action)
