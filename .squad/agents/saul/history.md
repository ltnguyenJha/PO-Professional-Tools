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

## Session Log

- **2026-04-30 12:00:** Saul joined the team as UI Designer, partnered with Tess. Charter established, ready for first assignment.
- **2026-04-30 17:00:** Completed Dashboard Redesign + Tailwind CSS Setup task. Installed Tailwind v3, created bridge variable system, replaced DashboardView with Epic→Feature→Story hierarchy accordion, added StatusBadge component. Build ✅, tests ✅. Branch: `feature/saul-tailwind-dashboard-redesign`.
- **2026-04-30 21:44:** Team sync: All three agent decisions merged into `.squad/decisions.md` (Danny architecture, Tess UX flows, Saul Tailwind implementation). Orchestration logs + session log written. Decision inbox deleted. Ready for PR + team review. Decisions record updated.
