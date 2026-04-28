# Project Context

- **Owner:** ltnguyen
- **Project:** PO-Professional-Tools — VS Code extension for Product Owners with PBI Studio, User Story Wizard (INVEST), GitHub Copilot Agent integration
- **Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js, GitHub Copilot API
- **Key files:** All test files, `webview-ui/src/`, `src/`, build scripts
- **Build validation:** `npm run build` (root) + `tsc --noEmit` (root and webview-ui)
- **Created:** 2026-04-24

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### 2026-04-28: Issue #3 UI Refactor Test Strategy

**What I Analyzed:**
- UserStoryWizard (4-step wizard with INVEST scoring)
- BugReportWizard (4-step bug report with manual INVEST toggles)
- ListEditor (dynamic CRUD for arrays)
- ConfirmDialog (modal with destructive action support)
- LoadingBar (accessible progress indicator)
- PbiStudio (collapsible sections with type selector)

**Test Coverage Gaps Identified:**
1. **No test framework** — Project has zero test infrastructure (no vitest, jest, or RTL)
2. **No accessibility tooling** — No axe-core or similar for automated a11y checks
3. **Inconsistent disabled states** — Some buttons check aiBusy, others use internal completion logic
4. **Missing focus management** — Dialogs and wizard step transitions don't trap/move focus
5. **No visual regression tests** — UI changes rely on manual visual verification

**Quality Gates Defined:**
- All components need happy + unhappy path coverage
- Keyboard nav must work for all interactive elements
- ARIA labels required for dialogs, loading states, form fields
- Both light/dark themes must render without errors
- TypeScript + build must pass before sign-off

**Test Case Approach:**
- Written 65+ test cases covering: rendering, interaction, edge cases, accessibility, state transitions, integration
- Used Given/When/Then format for clarity and implementation-agnostic design
- Prioritized error paths first (where bugs hide)
- Focused on user perspective, not implementation details

**Architectural Flags for Danny:**
- Need testing framework selection (recommend Vitest for Vite project)
- Need @testing-library/react + @testing-library/user-event
- Consider Storybook for component-driven development and visual testing
- Focus trap library needed for dialogs (e.g., focus-trap-react)

**Documented In:**
- `.squad/decisions/inbox/livingston-issue-3-tests.md` (comprehensive test plan)
- This history entry (project knowledge)
