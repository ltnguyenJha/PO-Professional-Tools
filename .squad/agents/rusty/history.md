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
- `BugReportInput` added to `webview-ui/src/types.ts`; `GENERATE_BUG_REPORT` and `OPEN_BUG_REPORT_IN_CHAT` added to `WebviewRequest`. Linus mirrored these in `src/shared/messages.ts`.

### 2026-04-25 — Cross-Agent Integration: Bug Report Wizard ↔ Service

**Coordination with Linus (Backend):**
- Linus mirrored `BugReportInput` and message types to `src/shared/messages.ts`, added generic `LOADING` and `AI_SUGGESTION` event types (no draftId requirement)
- Linus wired `GENERATE_BUG_REPORT` and `OPEN_BUG_REPORT_IN_CHAT` handlers in DashboardPanel
- Linus implemented `generateBugReport()` and `openBugReportInChat()` in CopilotService
- Linus added `gatherRepoContext()` to inject workspace intelligence into bug report generation

**Frontend completion:**
- Both agents committed together (b953dc8): full build passed, 47 modules, 18.90KB CSS, 215KB JS, zero errors
- Webview UX complete: collapsible sections, type selector, 4-step wizard → ready for backend message handling
- All style patterns (step rail, INVEST grid, button styles) consistent with UserStoryWizard

### 2026-04-25 — Collapse State Defaults: Wizard Prominence

**User preference:**
- User Story Wizard and Bug Report Wizard should be the prominent, uncollapsed sections by default
- Utility sections (Edit Item, Generate Full Story, VS Code Copilot Chat, Refine with AI) should default to collapsed state
- Users can expand these utility sections as needed, but the wizards are the primary workflow entry points

**Implementation:**
- Changed 4 `useState` calls in `PbiStudio.tsx` (lines 83-86) from `true` to `false`: `openEditItem`, `openFullStory`, `openCopilotChat`, `openRefineAI`
- Updated comment on line 82 from "all start expanded" to "wizards start expanded, utility sections collapsed"
- Wizards remain expanded via their internal state (`UserStoryWizard.tsx` line 102, `BugReportWizard.tsx` line 73)
- Build verified: 47 modules, 18.90KB CSS, 215KB JS, zero errors

**Key pattern:**
- Wizard components control their own expand/collapse state internally — PbiStudio section state controls the surrounding utility card sections only
- This pattern keeps wizard behavior decoupled from the parent view's collapsible card UX

### 2026-04-28 — UI Refactoring: Spacing, Accessibility, and Design System (Issue #3)

**Design System Tokens:**
- Added comprehensive spacing scale: `--space-xs` (4px) through `--space-3xl` (32px)
- Introduced `--focus-ring` token (`0 0 0 3px var(--accent-soft)`) for consistent focus states
- Added `--transition-fast` (120ms) variant for quick UI interactions
- Replaced 100+ hardcoded spacing values with design tokens throughout styles.css

**Accessibility Enhancements:**
- Added `:focus-visible` pseudo-class to all interactive elements (buttons, inputs, nav items, wizard steps)
- Enhanced ARIA labels:
  - Navigation: `aria-label="Navigate to {view}"` on all nav items
  - Theme toggle: `aria-label="Switch to {theme} theme"`
  - List editor: `role="group"`, `aria-label` on inputs and remove buttons
  - Topbar: `role="banner"`, `role="toolbar"` on actions, `role="doc-subtitle"` on subtitle
- Touch target compliance: Ensured min-height 44px for buttons (36px for small buttons)
- Keyboard navigation: All focus states now visible with 2px outline + 2px offset

**Component Consistency:**
- Standardized button sizing: `min-height: 36px` (default), `32px` (small), `44px` (wizard actions)
- Unified input/select height: `min-height: 38px` for better usability
- Consistent gap spacing across all flexbox/grid layouts using spacing tokens
- Improved chip styling: added `font-weight: 500` for better readability

**Build & Verification:**
- Clean build: 47 modules, 20.81KB CSS, 218.40KB JS (from 18.90KB CSS — slight increase due to new tokens and focus states)
- Zero TypeScript errors (verified both root and webview-ui)
- All existing patterns preserved — no breaking changes

**Key Patterns Established:**
1. **Spacing Scale Hierarchy**: Use `--space-xs` for tight internal gaps (4px), `--space-sm` for list items (8px), `--space-md` for cards/sections (12px), `--space-lg` for view-level spacing (16px), up to `--space-3xl` for large sections
2. **Focus State Standard**: Always use `:focus-visible` (not `:focus`) with `outline: 2px solid var(--accent); outline-offset: 2px` to avoid mouse-click focus rings
3. **Touch Target Minimum**: All buttons should have `min-height` of at least 36px (44px for primary actions)
4. **ARIA Best Practice**: Add descriptive `aria-label` to icon-only buttons, use semantic role attributes, provide context for screen readers

**Why These Changes Matter:**
- **Consistency**: Spacing is now predictable across all views — designers and developers have a shared vocabulary
- **Accessibility**: Users with screen readers, keyboard-only navigation, and motor disabilities can now use the UI effectively
- **Maintainability**: Future UI updates can reference spacing tokens instead of hardcoding values — reduces CSS bloat and inconsistency
- **Professional Polish**: Focus states and touch targets meet WCAG 2.1 AA standards

### 2026-04-29 — "Bulk Breakdown" Renamed to "Feature Creation" (Issue #21)

**User-visible text changes:**
- Updated sidebar navigation label: `Sidebar.tsx` line 15 — "Bulk Breakdown" → "Feature Creation"
- Updated page title: `App.tsx` line 166 — "Bulk Breakdown" → "Feature Creation"
- Updated dashboard link text: `DashboardView.tsx` line 76 — "Bulk Breakdown" → "Feature Creation"

**What was NOT changed:**
- Component names (`BulkBreakdownView`), file names, CSS class names, TypeScript types — these are internal identifiers, not user-facing text
- ViewId type remains `'bulk'` — routing identifiers are implementation details

**Verification:**
- Grep search confirmed zero remaining "Bulk Breakdown" user-visible strings
- Three "Feature Creation" strings now present in sidebar nav, page header, and dashboard quick-start

**Rationale:** Aligns with product vision roadmap (Epics → Features → User Stories). "Feature Creation" better communicates the tool's purpose in the overall hierarchy.

