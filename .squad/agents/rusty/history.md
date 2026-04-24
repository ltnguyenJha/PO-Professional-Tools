# Project Context

- **Owner:** ltnguyen
- **Project:** PO-Professional-Tools — VS Code extension for Product Owners with PBI Studio, User Story Wizard (INVEST), GitHub Copilot Agent integration
- **Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js, GitHub Copilot API, esbuild
- **Key files:** `webview-ui/src/components/`, `webview-ui/src/views/PbiStudio.tsx`, `webview-ui/src/styles.css`, `webview-ui/src/types.ts`
- **Architecture:** Webview ↔ extension messaging via `postMessage`. Types in `webview-ui/src/types.ts` (webview) and `src/shared/messages.ts` (extension) must be kept in sync manually.
- **Build:** `npm run build` from root. Webview: `npm --prefix webview-ui run build` (Vite).
- **Created:** 2026-04-24

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-01-01 — Wizard UX Refresh

**Design decisions:**
- Replaced `.wizard-step-dot` button row with a proper horizontal rail: `wizard-step-item` (column: circle + label) separated by `wizard-step-connector` flex dividers. The connector gets `flex: 1` to expand proportionally; `margin-top: 13px` aligns the 2px line with the vertical center of the 28px node circles.
- Removed the cheesy gradient background on `.wizard-card`. Top border accent (`border-top: 3px solid var(--accent)`) combined with `box-shadow: var(--shadow-md)` gives the card a premium feel without the gradient noise.
- Story step inputs now use a `.wizard-story-field` compound component (prefix label + bare input inside a shared border container) rather than separate `.field` labels — this makes "As a / I want / So that" feel like a structured form, not three freeform fields.
- Story preview became a `<blockquote>` with `border-left: 3px solid var(--accent)` on an `--accent-soft` background. This signals "this is output, not input" clearly.
- INVEST cells gained `min-width: 64px`, larger letter (1.3rem), bigger status icon (0.9rem), and an `invest-pop` keyframe animation so the grid appears with a satisfying entrance.
- Action buttons elevated: `.wizard-btn-generate` adds `padding: 10px 20px`, `font-weight: 700`, and a colored box-shadow. `.wizard-btn-chat` uses a transparent background with `border: 1.5px solid var(--accent)` for an outlined secondary style. Each button wrapped in `.wizard-action-item` with a `.hint` caption below.
- INVEST hint box moved to bottom of `.wizard-body` so it doesn't interrupt the question → input flow.

**CSS variables that proved most useful:**
- `--accent-soft` — perfect for subtle tinted backgrounds (icon badge, blockquote preview, step node active ring)
- `--accent-ink` — readable accent-toned text for prefix labels and active step labels
- `--shadow-md` — right elevation for the wizard card to feel lifted without being heavy
- `--line-strong` — used for inactive step connectors and prefix border separators
- `--success-soft` / `--success` — INVEST grid "ok" cell colors, also step "done" state
- `--transition` — applied to step node and connector so rail state changes animate smoothly

### 2026-01-02 — Collapsible Sections, Bug Wizard, Type Selector

**Collapsible sections (Feature 1):**
- Used `max-height` transition pattern: `.section-body { max-height: 9999px; transition: max-height 220ms; }` and `.section-body.collapsed { max-height: 0 !important; }`. The large open-state value (9999px) enables the collapse animation to work in both directions.
- Wrapped each card's button+chevron in a `stopPropagation` container inside `.section-header` so save/push/delete buttons don't accidentally collapse the card on click.
- `.section-body` uses `display: flex; flex-direction: column; gap: 10px` to maintain card spacing inside the body when expanded.
- Did NOT modify `UserStoryWizard`'s internal collapse (it already has its own `expanded` state + Collapse/Expand button — no need to double-wrap).

**Type selector (Feature 2):**
- Segmented pill control (`.pbi-type-selector`) with active state using `--accent` background + `#ecfeff` text. Used `#ecfeff` (matching `.btn-primary`) instead of `--accent-ink` — in light mode, `--accent-ink` is too dark against the accent background.
- `pbiType` state resets to `'feature'` via `useEffect([activeId])` whenever the selected draft changes.
- `key={`feature-${active.id}`}` / `key={`bug-${active.id}`}` ensures both wizards remount (clear internal state) when type or draft changes.

**BugReportWizard (Feature 3):**
- 4-step wizard mirrors UserStoryWizard patterns exactly: same step-rail, same INVEST hint box, same `.wizard-btn-generate` / `.wizard-btn-chat` button styles.
- Step 3 shows a `<blockquote className="wizard-preview">` preview card and a clickable INVEST grid (cells toggle ok/warn on click — manual self-verification vs. UserStoryWizard's auto-computed grid).
- Bug report emoji `🐛` inside `.wizard-icon` — avoids needing a custom SVG for initial ship.
- Handlers use `send()` (PbiStudio prop) rather than `vscode.postMessage()` directly — consistent with all other action handlers in PbiStudio.

**Type contract:**
- `BugReportInput` added to `webview-ui/src/types.ts`; `GENERATE_BUG_REPORT` and `OPEN_BUG_REPORT_IN_CHAT` added to `WebviewRequest`. Linus must mirror these in `src/shared/messages.ts`.
