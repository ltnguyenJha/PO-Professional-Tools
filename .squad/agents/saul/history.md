# Saul — UI Designer — Session History

## Project Context

**Project:** PO-Professional-Tools — VS Code extension providing a PBI Studio for Product Owners
**Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js
**User:** Baldwin (Owner/PM)
**Created:** 2026-04-30

**Team:** Danny (Lead), Rusty (Frontend), Linus (Backend), Livingston (Tester), Tess (UX Designer), **Saul (UI Designer)**, Scribe, Ralph

## Day 1 Context (2026-04-30)

### Current State
- Issue #36: UI cleanup — completed and merged (copy updates, progress bar alignment)
- Issue #38: Feature Definition section — completed and merged (4 context questions for feature capture)
- Backlog: ~14 open issues remaining

### Visual Design Focus Areas
- **Design Tokens:** No formal token system yet — opportunity to establish CSS custom properties for color, spacing, and typography
- **VS Code Theming:** All surfaces must respect VS Code's dark/light theme variables
- **Component Polish:** Review existing components for visual consistency (spacing, type, color)
- **Design System (Visual Layer):** Saul owns the visual spec side; Tess owns the UX spec side

### Key Decisions
- VS Code native tokens (`--vscode-*` variables) are the source of truth for theming — no hardcoded colors
- Visual specs must be implementation-ready: annotated with exact values for Rusty
- Visual design reviews happen after Rusty implements, before Livingston tests

## Cross-Team Work

### 2026-04-30 — Feature Creation Implementation (with Linus, Rusty)

**Team Coordination:**
- **Rusty (Frontend):** Built FeatureCreationWizard with 5-step flow, Dashboard FeatureDraftCard with status badges, "Part of Feature" badge in PBI Studio
- **Linus (Backend):** Implemented data layer (FeatureDraft type, message handlers), ADO service (parent-child linking via System.LinkTypes.Hierarchy-Reverse), CopilotService (AI story generation)
- **Saul (UI):** Fixed light-mode contrast for status badges (info/warning/success/error) — all now WCAG AA compliant

**Integration Point:**
- All three agents working on feature/saul-tailwind-dashboard-redesign branch simultaneously
- Saul's light-mode fix applies to all status badges rendered by Rusty's FeatureDraftCard and Linus's HierarchyStatusBadge
- Message contract fully synced: webview types (Rusty) ↔ extension messages (Linus)
- Commits: 8d70088 (Saul), 78d5ee1 (Linus), 1235d3e (Rusty)

**Design Pattern Learned:**
- When mixing multiple color tokens in light theme, test each token individually for contrast; don't assume dark-theme tokens work in light (they often don't)
- `--vscode-textLink-foreground` is the most reliable light-mode info color — VS Code guarantees AA contrast

## Learnings

### 2026-05-01 — Light Mode Contrast Fix

**Root cause of the bug:** The `body.vscode-light` block in `tailwind.css` only overrode the soft-background vars (`--tw-vscode-*-bg`). It never overrode the status **foreground** vars. The `:root` defaults used tokens like `--vscode-notificationsInfoIcon-foreground` with fallback `#75beff` — a light blue designed for dark themes. In VS Code light mode, the token often resolves to `#3794ff` (still light blue, ~3:1 on white) — failing WCAG AA for text.

**Fix pattern:** When `:root` uses dark-theme-optimized token sources, always pair with a `body.vscode-light` override that selects a darker, equivalent-semantic token. For info/link color in light mode, `--vscode-textLink-foreground` is the safest choice — VS Code guarantees it's AA-contrast in any theme. For warning in light mode, `--vscode-gitDecoration-modifiedResourceForeground` gives a rich amber/brown that beats `editorWarning-foreground` which can be golden yellow.

**Token selection rule for status foreground in light mode:**
| Status   | Light-mode token                                       | Why                              |
|----------|--------------------------------------------------------|----------------------------------|
| success  | `--vscode-testing-iconPassed`                          | Same token, dark green in light  |
| warning  | `--vscode-gitDecoration-modifiedResourceForeground`    | Darker amber than editorWarning  |
| info     | `--vscode-textLink-foreground`                         | AA-guaranteed in all themes      |
| error    | `--vscode-editorError-foreground`                      | Dark red in light themes         |

**StatusBadge.tsx required zero changes** — it already uses the `--tw-vscode-*` bridge vars. Fix was entirely in CSS.

### 2026-04-30 — Tailwind CSS + Dashboard Redesign

**Tailwind v4 vs v3 gotcha:** Running `npm install tailwindcss` installs v4 (latest) which removes the PostCSS plugin from the main package into `@tailwindcss/postcss`. Since the project needs `tailwind.config.js` (v3 approach), always pin to `tailwindcss@^3.4.0` explicitly.

**VS Code theme coexistence:** The cleanest pattern is a two-layer bridge:
1. `--tw-vscode-*` CSS variables in `tailwind.css` that reference `--vscode-*` runtime tokens
2. Tailwind config's `colors` map those to utility classes (`bg-tw-bg`, `text-tw-fg`, etc.)
Status soft backgrounds can't use `color-mix` reliably for all themes — use hardcoded rgba values per `body.vscode-light` / `body.vscode-dark` selectors instead.

**preflight: false is mandatory** for VS Code webviews — VS Code sets its own base element styles and Tailwind's reset would conflict.

**Dashboard hierarchy principle:** `PbiDraft.workItemType` is the sole signal for Epic/Feature/Story hierarchy in the current data model. Epic→Feature parent-child links don't exist yet (no `epicId` field). Design must accommodate this gracefully by showing "Uncategorized Features" and "Standalone Stories" groups until the data model gains explicit parent IDs.

**Responsive breakpoint:** Added `panel-wide: 700px` custom Tailwind breakpoint — VS Code webview panels can be very narrow, so the 2-column layout switches at 700px rather than Tailwind's default `sm` (640px).

### 2026-05-01 — CSS Consistency + Light Mode Full Audit

**@tailwind IDE warning suppression:**  
`body.vscode-light` never controlled surface/text/border vars — only status colors. The fix is straightforward: always declare ALL bridge vars in `body.vscode-light`, not just the ones you remember having contrast issues with. The rule: *if a `:root` fallback is a dark value, it needs a light override.*

**`--vscode-panel-border` unreliability:**  
In several popular VS Code light themes, `--vscode-panel-border` resolves to transparent (or near-transparent). The `body.vscode-light` override now prefers `--vscode-widget-border` which is consistently opaque in light themes. Pattern: `var(--vscode-widget-border, var(--vscode-panel-border, #d4d4d4))`.

**`--tw-vscode-surface` new token:**  
Added a third surface layer. `--tw-vscode-bg` (editor canvas) vs `--tw-vscode-bg-alt` (accordion/list headers) vs `--tw-vscode-surface` (card/widget panels). Previously, card surfaces had to use `--tw-vscode-bg` which made them visually identical to the page background. Maps to `--vscode-editorWidget-background`.

**Design System SKILL.md:**  
Created `.squad/skills/design-system/SKILL.md` as the canonical token reference for the whole team. Documents both the legacy `styles.css` token system and the Tailwind bridge, with alignment table, component patterns, WCAG AA compliance notes, and Do/Don't table.

**Two-CSS-system coexistence strategy:**  
The legacy system (`styles.css`) and Tailwind bridge can coexist indefinitely as long as both systems reference the same underlying VS Code tokens. The alignment table in the SKILL.md ensures new Tailwind components visually match old legacy components without requiring a full migration.

## Session Log

- **2026-04-30 12:00:** Saul joined the team as UI Designer, partnered with Tess. Charter established, ready for first assignment.
- **2026-04-30 17:00:** Completed Dashboard Redesign + Tailwind CSS Setup task. Installed Tailwind v3, created bridge variable system, replaced DashboardView with Epic→Feature→Story hierarchy accordion, added StatusBadge component. Build ✅, tests ✅. Branch: `feature/saul-tailwind-dashboard-redesign`.
- **2026-04-30 21:44:** Team sync: All three agent decisions merged into `.squad/decisions.md` (Danny architecture, Tess UX flows, Saul Tailwind implementation). Orchestration logs + session log written. Decision inbox deleted. Ready for PR + team review. Decisions record updated.
- **2026-05-01:** CSS consistency pass — suppressed @tailwind IDE warnings, completed full light-mode bridge variable coverage, added `--tw-vscode-surface` token, created `.squad/skills/design-system/SKILL.md` as canonical design reference. Build ✅.
- **2026-05-01:** WCAG AA overhaul on `feature/ui-wcag-improvements` — expanded Tailwind config (tokens, spacing, touch targets, transitions, animations, typography), comprehensive tailwind.css bridge rebuild (10 new vars, full light-mode coverage, base styles, utility classes), styles.css focus/a11y fixes, `@tailwindcss/forms` installed, WCAG section added to SKILL.md. Build ✅.

## Learnings

### 2026-05-01 — WCAG AA Comprehensive Overhaul

**`--tw-vscode-muted` vs `--tw-vscode-fg-muted`:** Added `--tw-vscode-muted` as a semantically-named alias alongside the existing `--tw-vscode-fg-muted`. Both point to `--vscode-descriptionForeground` but with slightly different dark-theme fallbacks (#999999 vs #858585) to match the task spec. Keep both — legacy components use fg-muted, new ones can use muted.

**`@tailwindcss/forms` with `preflight: false`:** The forms plugin works fine alongside `preflight: false`. It only applies styles to form elements (input, select, etc.) scoped to actual elements, not a full reset. No conflict with VS Code webview base styles.

**`color-mix()` in utility badges:** The `.badge-*` utility classes use `color-mix(in srgb, ...)` for soft backgrounds. This is supported in all modern webview engines (Chromium ≥ 111). Fallback is not needed for VS Code webviews.

**Touch target rule nuance:** Applied `min-height: 44px; min-width: 44px` globally to buttons/anchors in `tailwind.css`, but added `a:not(.btn):not([class*="button"]) { min-height: unset; }` to avoid breaking inline text links. Inline links must opt-in to touch sizing via `.btn` class.

**`prefers-reduced-motion` placement:** Added to both `tailwind.css` (for Tailwind-based components) and `styles.css` (for legacy components). Both files are loaded; the `!important` overrides ensure the rule wins over animation declarations in both systems.

