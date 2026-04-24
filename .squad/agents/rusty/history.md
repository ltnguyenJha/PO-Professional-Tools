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
