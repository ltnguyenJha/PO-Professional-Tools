# Tess — UX Designer — Session History

## Project Context

**Project:** PO-Professional-Tools — VS Code extension providing a PBI Studio for Product Owners
**Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js
**User:** Baldwin (Owner/PM)
**Created:** 2026-04-30

**Team:** Danny (Lead), Rusty (Frontend), Linus (Backend), Livingston (Tester), Scribe, Ralph, now **Tess (UX Designer)**

## Day 1 Context (2026-04-30)

### Current State
- Issue #36: UI cleanup — completed and merged (copy updates, progress bar alignment)
- Issue #38: Feature Definition section — completed and merged (4 context questions for feature capture)
- Backlog: ~14 open issues remaining

### Design Focus Areas
- **Feature Wizard:** Step 3 (Feature Definition) just shipped; UX review of overall wizard flow
- **Component Library:** Standardize input patterns (text, textarea, buttons, modals)
- **Accessibility:** Ensure all new components meet WCAG 2.1 AA (focus states, color contrast, keyboard nav)
- **Design Debt:** Review existing UI for consistency and usability improvements

### Key Decisions
- Design is iterative — feedback from QA and users informs refinement
- Accessibility is non-negotiable — a11y bugs are P0
- Component consistency matters — reuse patterns, don't invent new ones

## Learnings

### AI-Generated Label Clarification (2026-04-30)
**What I found:**
- The "AI-Generated" label appears as a toggle button in Step 3 (Story) of the PBI Studio wizard
- Users select between "Manual" and "AI-Generated" modes to control whether Copilot helps draft content
- The label itself was not self-explanatory — users didn't understand what it meant or what would happen if they selected it

**What I designed:**
- Added a dynamic contextual hint below the toggle that explains what each mode does
- When "AI-Generated" is selected: Shows "✨ Copilot can draft content for you. Use Ctrl+Shift+P → Generate Story or right-click fields to refine."
- When "Manual" is selected: Shows "Write your story manually, or switch to AI-Generated to let Copilot help draft content."
- Styled with `.wizard-mode-hint` class: small, muted text (0.75rem) in neutral color
- Tone: Friendly and empowering, not alarming — positions AI as a helpful starting point

**Impact:**
- Users now understand what the toggle does before switching modes
- Provides clear instructions on how to use AI-Generated mode (keyboard shortcut + right-click)
- Reduces cognitive load and support questions

### Card Alignment Consistency (2026-04-30)
**Problem:**
- The PBI Studio had multiple card types (`.card` for PBI edit panels, `.wizard-step` for wizard cards, `.pbi-type-selector-wrap`) with inconsistent spacing
- `.card` was using legacy token names (`--radius-lg`, `--space-lg`, `--space-md`)
- `.wizard-step` had more generous padding (`--space-5` = 20px) compared to standard cards (`--space-4` = 16px)
- `.wizard-step` gap was also larger (`--space-5` vs `--space-3`)
- This created visual misalignment where wizard cards felt "puffier" than edit cards

**Solution:**
- Normalized all card components to use consistent modern tokens:
  - **Border radius:** `var(--radius-5)` = 12px (large, friendly corners)
  - **Padding:** `var(--space-4)` = 16px (balanced internal spacing)
  - **Internal gap:** `var(--space-3)` = 12px (comfortable element spacing)
  - **Shadow:** `var(--shadow-sm)` (subtle elevation)
  - **Border:** 1px solid `var(--line)` or `var(--color-neutral-300)`
- Updated `.pbi-type-selector-wrap` margin-bottom to use `var(--space-4)` for consistency

**Impact:**
- All cards in PBI Studio now share a cohesive visual rhythm
- Reduces cognitive load — users see one consistent "card" pattern, not multiple competing styles
- Aligns with design system token migration (Phase 2) — using modern token names throughout
- Easier maintenance — consistent spacing makes future adjustments simpler

**Design Rationale:**
- Chose `--space-4` (16px) as the standard card padding because it's the sweet spot: enough breathing room without feeling wasteful of screen real estate
- Kept `--space-3` (12px) for internal gaps — creates visual hierarchy (outer padding > inner gap)
- Using `--radius-5` (12px) gives cards a friendly, modern feel while maintaining VS Code's design language

## Session Log

- **2026-04-30 09:07:** Tess joined the team. Charter established, ready for first assignment.
- **2026-04-30 [current]:** Fixed card alignment consistency across PBI Studio (Issue: card spacing misalignment).

### 2026-04-30 — Card Alignment Consistency: Token Migration & Spacing Normalization

**Scope:** Design system enforcement — normalize card padding/radius/shadow across `.card`, `.wizard-step`, and `.pbi-type-selector-wrap` using modern design tokens.

**Problem statement:**
- PBI Studio had multiple card types with inconsistent visual properties
- `.card` elements (edit panels) used legacy token names: `--radius-lg`, `--space-lg`, `--space-md`
- `.wizard-step` cards had more generous spacing: `padding: var(--space-5)` (20px) vs `var(--space-4)` (16px) on standard cards
- `.wizard-step` gap was also larger: `var(--space-5)` vs `var(--space-3)`
- `.pbi-type-selector-wrap` used legacy margin token: `var(--space-md)`
- Visual misalignment created cognitive friction: wizard cards felt "puffier" and visually disconnected from edit cards

**Design solution — Unified Card System:**

Established one consistent card pattern across all card types:

| Property | Token | Value | Rationale |
|----------|-------|-------|-----------|
| Border radius | `var(--radius-5)` | 12px | Large, friendly corners; modern feel |
| Padding | `var(--space-4)` | 16px | Sweet spot: spacious without wasting space |
| Internal gap | `var(--space-3)` | 12px | Creates visual hierarchy (outer > inner) |
| Shadow | `var(--shadow-sm)` | Subtle | Gentle elevation; not distracting |
| Border | `1px solid var(--line)` | — | Consistent across all cards |

**CSS changes implemented:**

**1. `.card` in `webview-ui/src/styles.css`**
- **Before:**
  - `border-radius: var(--radius-lg)` (legacy alias)
  - `padding: var(--space-lg)` (legacy alias)
  - `gap: var(--space-md)` (legacy alias)
- **After:**
  - `border-radius: var(--radius-5)` (modern token)
  - `padding: var(--space-4)` (modern token)
  - `gap: var(--space-3)` (modern token)

**2. `.wizard-step` in `webview-ui/src/styles/wizard.css`**
- **Before:**
  - `padding: var(--space-5)` (20px — too generous)
  - `gap: var(--space-5)` (20px — too much breathing room)
- **After:**
  - `padding: var(--space-4)` (16px — matches standard cards)
  - `gap: var(--space-3)` (12px — balanced element spacing)

**3. `.pbi-type-selector-wrap` in `webview-ui/src/styles.css`**
- **Before:** `margin-bottom: var(--space-md)` (legacy alias)
- **After:** `margin-bottom: var(--space-4)` (modern token)

**Design principles applied:**

1. **Consistency Over Variation** — Single card pattern > multiple competing styles
2. **Visual Hierarchy Through Spacing** — Outer padding (`--space-4` = 16px) > Inner gap (`--space-3` = 12px)
3. **Token Migration (Phase 2 Alignment)** — Moving away from legacy aliases to modern names
4. **Balanced Density** — `--space-4` (16px) is the goldilocks value:
   - `--space-3` (12px) feels cramped for card padding
   - `--space-5` (20px) wastes screen real estate
   - `--space-4` (16px) is the sweet spot

**Validation:**
- ✅ `npm run build` passed — no CSS errors or warnings
- ✅ Visual review: All cards now share consistent padding, radius, and shadow
- ✅ Wizard cards no longer feel disconnected from edit panels
- ✅ PBI type selector spacing aligns with surrounding cards

**Impact:**

**User Experience:**
- Reduced cognitive load — one consistent card pattern to learn
- Interface feels more cohesive and polished
- Users can focus on content, not visual inconsistencies

**Developer Experience:**
- Easier to add new card types — clear pattern to follow
- Modern token names make code more readable and maintainable
- Future spacing adjustments can be made in one place

**Design System:**
- Completes token migration for card components
- Establishes clear spacing hierarchy (outer > inner)
- Provides a reusable card pattern for future features

**Key learnings:**
1. **Legacy aliases create confusion** — Modern token names are more readable and maintainable
2. **Spacing hierarchy matters** — Outer padding > Inner gap creates visual structure
3. **Token consistency is enforcing** — Users perceive cohesion when visual patterns repeat
4. **CSS token values are design decisions** — Each token (16px, 12px, 20px) has rationale behind it
