# Design Token System — Phase 1 Documentation

## Overview

This token system provides a foundational design language for the PO Professional Tools extension. Tokens are CSS custom properties (variables) that define reusable design decisions for colors, spacing, typography, radius, shadows, and transitions.

**Why tokens?** Tokens create a single source of truth for design values, ensuring visual consistency across all components and making theme changes (like dark mode) seamless.

---

## Token Categories

### 1. Color Tokens

**Naming Convention:** `--color-{category}-{variant}`

#### Neutrals (Backgrounds, Borders, Text)
- `--color-neutral-100` to `--color-neutral-975`: Grayscale spectrum from lightest to darkest
- Light mode: 100 = lightest (page bg), 500 = darkest (text)
- Dark mode: Token values swap automatically (900 = darkest bg, 600 = lightest text)

**Usage:**
- **100–250**: Page and panel backgrounds
- **300–350**: Borders and dividers
- **400–500**: Text shades (muted, soft, primary)

#### Status Colors
- `--color-success` / `--color-success-soft`: Green (approval, completion)
- `--color-warning` / `--color-warning-soft`: Amber (caution, in-progress)
- `--color-error` / `--color-error-soft`: Red (failure, deletion)
- `--color-info` / `--color-info-soft`: Blue (information, guidance)

**Usage:**
- Base color for text/icons on neutral backgrounds
- `-soft` variant for backgrounds with colored text

#### Primary/Interactive Colors
- `--color-primary-default`: Default accent color (teal/cyan)
- `--color-primary-hover`: Hover state (darker)
- `--color-primary-active`: Active/pressed state
- `--color-primary-disabled`: Disabled state (40% opacity)
- `--color-primary-soft`: Light background (for highlight boxes)
- `--color-primary-ink`: Text on primary-soft backgrounds

**Usage:**
- Buttons, links, active states, focus indicators
- Wizard progress, selected items

#### Semantic Colors
- `--color-focus`: Focus ring color (wraps focused elements)
- `--color-backdrop`: Modal/overlay backdrop
- `--color-chip`: Neutral chip/tag background

#### Sidebar Colors
- `--color-sidebar-bg`: Sidebar background (dark in both themes)
- `--color-sidebar-ink`: Sidebar text color
- `--color-sidebar-muted`: Sidebar secondary text
- `--color-sidebar-hover`: Sidebar hover state
- `--color-sidebar-active`: Sidebar active/selected state

---

### 2. Spacing Tokens

**Naming Convention:** `--space-{number}` where number = 1–11

**Base Unit:** 4px

| Token | Value | Use Case |
|-------|-------|----------|
| `--space-1` | 4px | Micro spacing (chip padding, tight gaps) |
| `--space-2` | 8px | Small spacing (field gaps, button padding) |
| `--space-3` | 12px | Medium spacing (card gaps, nav gaps) |
| `--space-4` | 16px | Standard spacing (field padding, section gaps) |
| `--space-5` | 20px | Large spacing (card padding, content padding) |
| `--space-6` | 24px | XL spacing (section margins) |
| `--space-7` | 28px | 2XL spacing (hero sections) |
| `--space-8` | 32px | 3XL spacing (major dividers) |
| `--space-9` | 36px | 4XL spacing (page margins) |
| `--space-10` | 40px | 5XL spacing (large section margins) |
| `--space-11` | 44px | 6XL spacing (maximum spacing) |

**Legacy Aliases** (will be removed in Phase 2):
- `--space-xs` → `--space-1`
- `--space-sm` → `--space-2`
- `--space-md` → `--space-3`
- `--space-lg` → `--space-4`
- `--space-xl` → `--space-5`
- `--space-2xl` → `--space-6`
- `--space-3xl` → `--space-8`

**Rationale:** Numeric scale is more intuitive for incremental spacing (`--space-5` is clearly larger than `--space-4`) vs named scale (`--space-xl` vs `--space-2xl` requires memorization).

---

### 3. Radius Tokens

**Naming Convention:** `--radius-{number}` where number = 0–5, or `--radius-pill`

| Token | Value | Use Case |
|-------|-------|----------|
| `--radius-0` | 0px | Sharp corners (no radius) |
| `--radius-1` | 2px | Minimal radius (small elements) |
| `--radius-2` | 4px | Subtle radius (chips, small cards) |
| `--radius-3` | 6px | Standard radius (buttons, inputs) |
| `--radius-4` | 8px | Medium radius (cards, modals) |
| `--radius-5` | 12px | Large radius (hero cards, panels) |
| `--radius-pill` | 999px | Full pill shape (tags, toggles) |

**Legacy Aliases:**
- `--radius-sm` → `--radius-3`
- `--radius` → `--radius-4`
- `--radius-lg` → `--radius-5`

**Usage:**
- Buttons/inputs: `--radius-3` or `--radius-4`
- Cards/panels: `--radius-4` or `--radius-5`
- Chips/tags: `--radius-pill`

---

### 4. Typography Tokens

**Naming Convention:** `--typography-{role}` or individual `--font-{property}-{variant}`

#### Font Families
- `--font-family-base`: System fonts (Segoe UI, Inter, SF Pro)
- `--font-family-mono`: Monospace fonts (JetBrains Mono, Fira Code, Consolas)

#### Font Sizes (11px–24px scale)
| Token | Value (rem) | Pixel | Use Case |
|-------|-------------|-------|----------|
| `--font-size-xs` | 0.6875rem | 11px | Micro labels, badges |
| `--font-size-sm` | 0.75rem | 12px | Small labels, captions |
| `--font-size-base` | 0.8125rem | 13px | Body text (default) |
| `--font-size-md` | 0.875rem | 14px | Standard text, buttons |
| `--font-size-lg` | 1rem | 16px | Heading 4, emphasized text |
| `--font-size-xl` | 1.125rem | 18px | Heading 3 |
| `--font-size-2xl` | 1.25rem | 20px | Heading 2 |
| `--font-size-3xl` | 1.5rem | 24px | Heading 1, page titles |

#### Font Weights
- `--font-weight-regular` (400): Body text
- `--font-weight-medium` (500): Labels, nav items
- `--font-weight-semibold` (600): Headings, buttons
- `--font-weight-bold` (700): Strong emphasis
- `--font-weight-extrabold` (800): Brand marks

#### Line Heights
- `--line-height-tight` (1): Headings, buttons
- `--line-height-snug` (1.25): Headings
- `--line-height-normal` (1.45): Body text (default)
- `--line-height-relaxed` (1.6): Long-form content

#### Composition Tokens (Complete Typography Styles)

These combine size + weight + line-height for complete text styling:

**Headings:**
- `--typography-heading-1`: Bold 24px (page titles)
- `--typography-heading-2`: Semibold 20px (section titles)
- `--typography-heading-3`: Semibold 18px (subsections)
- `--typography-heading-4`: Semibold 16px (card titles)

**Body Text:**
- `--typography-body`: Regular 13px (default body)
- `--typography-body-md`: Regular 14px (standard body)
- `--typography-body-lg`: Regular 16px (emphasized body)

**Labels/Captions:**
- `--typography-label`: Medium 12px (field labels)
- `--typography-label-md`: Medium 13px (form labels)
- `--typography-caption`: Regular 11px (small hints)

**Buttons:**
- `--typography-button`: Semibold 14px (standard buttons)
- `--typography-button-sm`: Medium 12px (small buttons)

**Code:**
- `--typography-code`: Regular 13px monospace (code blocks)

**Usage Example:**
```css
.wizard-title {
  font: var(--typography-heading-1);
  color: var(--color-neutral-500);
}
```

---

### 5. Shadow Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--shadow-sm` | 0 1px 2px rgba(...) | Subtle elevation (cards) |
| `--shadow-md` | 0 8px 24px rgba(...) | Medium elevation (modals) |
| `--shadow-lg` | 0 20px 48px rgba(...) | High elevation (dialogs) |
| `--shadow-focus` | 0 0 0 3px ... | Focus ring (accessibility) |

**Dark Mode:** Shadow values automatically adjust to darker, subtler shadows.

---

### 6. Transition Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| `--transition-fast` | 120ms cubic-bezier(...) | Quick interactions (hover) |
| `--transition-base` | 180ms cubic-bezier(...) | Standard transitions (buttons, cards) |
| `--transition-slow` | 220ms cubic-bezier(...) | Slower animations (collapsibles, modals) |

**Easing:** All use `cubic-bezier(0.2, 0.8, 0.2, 1)` for smooth, natural motion.

---

## Dark Mode Support

All color tokens automatically adapt to dark mode via `[data-theme="dark"]` selectors. The `tokens.css` file defines both light and dark values for every color token.

**How it works:**
1. Light mode (default): Uses neutral-100–500 range for bg→text
2. Dark mode: Swaps to neutral-900–600 range
3. Status/primary colors adjust brightness and saturation for readability
4. Shadows reduce opacity in dark mode to avoid overpowering backgrounds

**No manual dark mode CSS needed** — just use tokens and themes switch automatically.

---

## Using Tokens in New Code (Phase 2+)

### ✅ Do:
```css
.wizard-step {
  padding: var(--space-4);
  gap: var(--space-3);
  border-radius: var(--radius-4);
  background: var(--color-neutral-200);
  color: var(--color-neutral-500);
  font: var(--typography-body-md);
}
```

### ❌ Don't:
```css
.wizard-step {
  padding: 16px;           /* Hard-coded spacing */
  gap: 12px;               /* Hard-coded spacing */
  border-radius: 8px;      /* Hard-coded radius */
  background: #ffffff;     /* Hard-coded color */
  color: #0f172a;          /* Hard-coded color */
  font-size: 0.875rem;     /* Hard-coded typography */
}
```

---

## Migration Strategy (Phase 2–5)

### Phase 1 (Complete):
- ✅ Defined all tokens in `tokens.css`
- ✅ Created legacy variable bridge in `apply-tokens.css`
- ✅ Existing UI works unchanged (backward compatible)

### Phase 2 (Layout Architecture):
- Remove legacy variable bridge (`--bg`, `--ink`, etc.)
- Update all component CSS to reference tokens directly
- Use typography composition tokens (`--typography-heading-1`, etc.)

### Phase 3 (Wizard Component Logic):
- Apply spacing tokens to wizard step layouts
- Use color tokens for wizard state indicators
- Apply typography tokens to wizard text elements

### Phase 4 (State Management):
- No token changes needed (state is JS-only)

### Phase 5 (Polish & Testing):
- Audit all components for token compliance
- Remove any remaining hard-coded values
- Test dark mode with all token-driven components

---

## Token Naming Rationale

### Why Numeric Spacing Instead of T-Shirt Sizes?

**Numeric (`--space-1` to `--space-11`):**
- ✅ Self-documenting scale (higher number = more space)
- ✅ Easy to interpolate (need between `--space-3` and `--space-5`? Use `--space-4`)
- ✅ No ambiguity (`--space-xl` vs `--space-2xl` requires memorization)

**T-Shirt Sizes (`--space-xs`, `--space-md`, `--space-2xl`):**
- ❌ Arbitrary labels (is `md` 12px or 16px? Who knows!)
- ❌ Hard to add intermediate values (what goes between `md` and `lg`? `mdlg`?)
- ❌ Requires constant reference to docs

### Why Semantic Color Names Instead of Generic?

**Semantic (`--color-primary-default`, `--color-success`, `--color-neutral-300`):**
- ✅ Self-documenting intent (success = green, error = red)
- ✅ Theme-aware (colors swap in dark mode automatically)
- ✅ Enforces design system (can't misuse "danger" color for success state)

**Generic (`--color-teal-500`, `--color-green-100`):**
- ❌ No semantic meaning (does "teal-500" mean primary or info?)
- ❌ Breaks when theme changes (suddenly "green-100" is the wrong shade)
- ❌ No guardrails (easy to grab random color that doesn't fit design system)

---

## Common Patterns

### Button with Full Token System:
```css
.wizard-btn-primary {
  padding: var(--space-3) var(--space-5);
  gap: var(--space-2);
  border-radius: var(--radius-4);
  background: var(--color-primary-default);
  color: var(--color-neutral-200);
  font: var(--typography-button);
  box-shadow: var(--shadow-sm);
  transition: background var(--transition-base), box-shadow var(--transition-base);
}

.wizard-btn-primary:hover {
  background: var(--color-primary-hover);
  box-shadow: var(--shadow-md);
}

.wizard-btn-primary:focus-visible {
  box-shadow: var(--shadow-focus);
}
```

### Card with Token Layout:
```css
.wizard-card {
  padding: var(--space-5);
  gap: var(--space-4);
  border: 1px solid var(--color-neutral-300);
  border-radius: var(--radius-5);
  background: var(--color-neutral-200);
  box-shadow: var(--shadow-sm);
}

.wizard-card h3 {
  font: var(--typography-heading-3);
  color: var(--color-neutral-500);
  margin: 0 0 var(--space-2);
}

.wizard-card p {
  font: var(--typography-body);
  color: var(--color-neutral-400);
  line-height: var(--line-height-normal);
}
```

---

## Testing Token Changes

1. **Visual Regression:** Build with `npm run build` and check UI in both light and dark modes
2. **Console Errors:** Ensure no CSS warnings about undefined variables
3. **Contrast:** Use browser DevTools to verify WCAG AA contrast ratios (especially dark mode)
4. **Hover/Focus States:** Test all interactive elements for proper token-driven states

---

## Questions?

This token system was designed in Phase 1 to support the 4-step wizard redesign (Issue #24). It will be fully integrated across all components in Phases 2–5.

**Next Phase:** Phase 2 will migrate all component CSS to use tokens directly and remove the legacy variable bridge.

---

**Last Updated:** 2026-04-29 (Phase 1 Complete)  
**Maintained By:** Rusty (Frontend Dev)
