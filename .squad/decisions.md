# Squad Decisions

## Active Decisions

### Language Model Selection Fallback Chain (2026-04-24)

**Author:** Linus (Backend Dev)  
**Status:** Accepted  

Use three-pass fallback in `pickModel()` (CopilotService):
1. `{ vendor: 'copilot', family: 'gpt-4o' }` — most preferred
2. `{ vendor: 'copilot' }` — any Copilot model
3. `{}` — any available language model (custom providers)

On total failure, show "Open Copilot Settings" action that navigates to `github.copilot` settings scope, then throw with updated message mentioning custom provider support.

**Rationale:** Extends compatibility to firewall-restricted orgs and custom LM providers while maintaining model quality preference. Error messaging is actionable for self-service debugging.

---

### Wizard UX Refresh (2026-04-24)

**Author:** Rusty (Frontend Dev)  
**Status:** Implemented  

Redesigned UserStoryWizard and supporting styles (8 component polish passes):
- Card: clean panel + accent top border (no gradient)
- Progress: horizontal rail with numbered circles + connectors
- Icon: Lucide SVG sparkles (emoji → vector)
- Story inputs: prefix-label compound ("As a", "I want", "So that")
- Preview: blockquote styling with accent border
- INVEST grid: enlarged + animated entrance
- Buttons: elevated primary + outlined secondary with hints
- Hints: repositioned to wizard body bottom

**Non-breaking:** All props, callbacks, state logic, scoring untouched.

**Rationale:** Professional visual identity and enhanced UX clarity while preserving all backend logic and component APIs.

---

### Collapsible Sections + Bug/Feature Type Selector (2026-04-25)

**Author:** Rusty (Frontend Dev)  
**Status:** Implemented  

Shipped three coordinated PBI Studio UX improvements:

**1. Collapsible Sections** — Every major card now has `.section-header` with rotating chevron. Body uses `max-height` CSS transition (0 ↔ 9999px) for smooth expand/collapse. Action buttons use `stopPropagation` to prevent accidental collapse.

**2. Bug/Feature Type Selector** — Segmented pill control at top of wizard area. Active state: `--accent` background + `#ecfeff` text (not `--accent-ink` — too dark in light mode). Resets to `'feature'` on draft change; remounts both wizards via `key` prop to clear internal state.

**3. BugReportWizard Component** — 4-step wizard (Where → Reproduce → Acceptance → INVEST verification) mirroring UserStoryWizard patterns. INVEST grid is user-driven (click-toggle) vs auto-computed — bug reports require PO judgment, not field-length heuristics. Bug emoji `🐛` in `.wizard-icon`.

**Type Contract** — `BugReportInput` + `GENERATE_BUG_REPORT` / `OPEN_BUG_REPORT_IN_CHAT` added to webview and extension message types.

**Non-breaking:** UserStoryWizard unchanged; all new components use existing style variables and patterns.

**Rationale:** Unify PBI Studio card UX (consistency via collapsible sections), enable bug reporting workflow (type selector + wizard), maintain professional visual system (CSS patterns + design tokens).

---

### Repo Context Injection + Bug Report Message Types (2026-04-25)

**Author:** Linus (Backend Dev)  
**Status:** Implemented  

Extended CopilotService with workspace-aware generation and bug report event flow:

**1. Repo Context Gathering** — `CopilotService.gatherRepoContext()` collects package.json metadata (name, version, description), first 800 chars of README.md, last 15 commits (`git log --oneline -15`), up to 60 key files (`git ls-files "*.ts" "*.tsx" "*.json"`). Single try/catch wraps all I/O; returns empty string silently on git/workspace unavailability. Context prepended to message array via `messages.unshift()` before system block so model reads workspace facts first.

**2. Message Types** — `BugReportInput` interface in `src/shared/messages.ts` carries whereLocation, howToReproduce, acceptanceCriteria, six INVEST booleans. New union members: `GENERATE_BUG_REPORT` and `OPEN_BUG_REPORT_IN_CHAT` on `WebviewRequest`. New generic event types on `ExtensionEvent`: `LOADING` (generic progress, no draftId) and `AI_SUGGESTION` (generic result, no draftId). Extended `AiSuggestion` with optional `investSummary?: string`.

**3. Service Methods** — `generateBugReport()` calls `generateFromInvestWizard()` with bug context, returns `AiSuggestion`. `openBugReportInChat()` opens Copilot Chat with formatted prompt. Both use `pickModel()` fallback chain (gpt-4o → copilot → any).

**4. DashboardPanel Handlers** — Dedicated handlers for both bug report message types. Proper `CancellationTokenSource` lifecycle: new source, store, pass token, dispose in finally. Progress via `{ type: 'LOADING', payload: { message, busy } }` posts.

**Rationale:** Bug reports are not tied to drafts (draft-centric events don't fit); generic LOADING/AI_SUGGESTION events allow report flow without draftId. Workspace context makes LM generations more accurate. Three-pass model fallback ensures org compatibility.

### Project Reorganization Completion (2026-04-28)

**Authors:** Danny (Lead), Linus (Backend Dev), Rusty (Frontend Dev), Livingston (Tester)  
**Status:** Completed

Completed comprehensive project restructuring with four-layer organization:
- **docs/** — End-user documentation (QUICK_START, FEATURES_ROADMAP, CONTRIBUTING, PRODUCT_VISION)
- **dev/** — Developer documentation (DEVELOPMENT_GUIDE, ARCHITECTURE, PROJECT_PLAN, BUG_IMPLEMENTATION_NOTES)
- **deploy/** — Deployment & release processes (DEPLOYMENT guide)
- **build/** — Build tooling & VS Code packaging (esbuild.config.js, vscode/ subdirectory)

**Key Decisions Implemented:**
1. `.vscodeignore` remains at repo root (standard VSCE convention)
2. `PITCH.md` → `docs/PRODUCT_VISION.md` (external stakeholder-facing strategy)
3. Build scripts updated: `package.json` references `build/esbuild.config.js`
4. All file moves preserved via `git mv` (history preserved)

**Verification Complete:**
- ✅ Build passes: `npm run build:extension` successful
- ✅ TypeScript checks pass
- ✅ README updated with audience navigation (PO users, developers, stakeholders)
- ✅ All documentation files created and verified
- ✅ No broken references; build config paths verified

**Outcome:** Reorganized repo structure is live and ready for production use. Navigation clearly targets three audiences (end users, developers, ops). Git history preserved. Root-level README now quick-start focused with links to detailed guides.

**Rationale:** Layered structure reduces root clutter, improves discoverability for each audience, and aligns with enterprise repo organization patterns. Preserves git history via `git mv`. Comprehensive documentation supports Phase 7 (Packaging) and long-term maintainability.

---

### Local Dev Setup — Postinstall Hook (2026-04-28)

**Author:** Danny (Lead) & Linus (Backend Dev)  
**Status:** Implemented

**Problem:** Fresh clones lack `node_modules` at root and `webview-ui/`. Developers must manually run two separate installs, creating onboarding friction.

**Decision:** Add `"postinstall": "npm --prefix webview-ui install"` to root `package.json` scripts section.

**Rationale:**
- ✅ Developers now run single `npm install` at root; webview-ui dependencies install automatically via npm lifecycle hook
- ✅ CI/CD pipelines pick this up without script changes
- ✅ Consistent with existing `build:webview` / `watch:webview` (`--prefix` style)
- ✅ Standard npm pattern; zero new tooling required

**Verification:**
- ✅ Clean build produces `dist/extension.js` (2.7MB)
- ✅ `postinstall` script confirmed in package.json
- ✅ No impact on existing build, test, or dist outputs

**Outcome:** Eliminated #1 onboarding friction point. New devs and CI/CD now require single `npm install` instead of manual two-step setup.

---

## Conflict Resolution Protocol

### Feature Branch Wins Policy (2026-04-28)

**By:** ltnguyen (via Copilot)  
**Status:** Captured  

**Directive:** When merge conflicts occur on feature branch PRs, always resolve by keeping the version from the feature branch (not main).

**Why:** Feature branch has the latest changes and intent from the current work. Main branch is stale. In case of doubt, the feature branch represents the desired state.

**Application:** All agents should follow this when resolving merge conflicts during PR preparation or rebase cycles.

---

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
