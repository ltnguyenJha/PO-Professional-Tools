# Project Context

- **Owner:** ltnguyen
- **Project:** PO-Professional-Tools — VS Code extension for Product Owners with PBI Studio, User Story Wizard (INVEST), GitHub Copilot Agent integration
- **Stack:** TypeScript, VS Code Extension API, Node.js, GitHub Copilot API, esbuild
- **Key files:** `src/extension.ts`, `src/panels/DashboardPanel.ts`, `src/services/copilotService.ts`, `src/shared/messages.ts`, `build/esbuild.config.js`
- **Architecture:** One-way message passing webview→extension via postMessage. `DashboardPanel.handleMessage()` is the routing switch. Services (CopilotService) do the AI work. Extension sends events back via `WebviewPanel.postMessage()`.
- **Build:** `node build/esbuild.config.js` (extension bundle). TypeScript: `tsc --noEmit`.
- **Key files:** `src/extension.ts`, `src/panels/DashboardPanel.ts`, `src/services/copilotService.ts`, `src/shared/messages.ts`, `esbuild.js`
- **Architecture:** One-way message passing webview→extension via postMessage. `DashboardPanel.handleMessage()` is the routing switch. Services (CopilotService) do the AI work. Extension sends events back via `WebviewPanel.postMessage()`.
- **Build:** `node esbuild.js` (extension bundle). TypeScript: `tsc --noEmit`.
- **Created:** 2026-04-24

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### pickModel() fallback chain (2026-04-24)
`vscode.lm.selectChatModels({ vendor: 'copilot' })` can return an empty array in org environments with custom LM providers or when the model list hasn't loaded. The robust pattern is a three-pass fallback: `{ vendor:'copilot', family:'gpt-4o' }` → `{ vendor:'copilot' }` → `{}` (any available model). On total failure, use `vscode.window.showErrorMessage` with an actionable button rather than a silent throw.

### CancellationTokenSource lifecycle in DashboardPanel handlers (2026-04-24)
`new vscode.CancellationTokenSource().token` leaks the source object (it is never disposed). Always store the source: `const cts = new vscode.CancellationTokenSource()`, pass `cts.token` to service calls, and call `cts.dispose()` in the `finally` block so the underlying VS Code resource is released regardless of success or error.

### Repo context gathering via gatherRepoContext() (2026-04-25)
`CopilotService.gatherRepoContext()` collects four signals from the active workspace: package.json metadata (name, version, description), first 800 chars of README.md, last 15 git commits via `git log --oneline -15`, and up to 60 key files via `git ls-files "*.ts" "*.tsx" "*.json"`. All git/fs operations are wrapped in a single try/catch — if the workspace is absent or git is unavailable, the method returns an empty string silently. The context is injected into `generateFromInvestWizard()` via `messages.unshift()` so it precedes the system and user messages.

### BugReportInput contract and message flow (2026-04-25)
`BugReportInput` lives in `src/shared/messages.ts`. It carries: `whereLocation` (component/area/page), `howToReproduce` (steps), `acceptanceCriteria` (definition of fixed), and six INVEST boolean flags. The webview posts `GENERATE_BUG_REPORT` or `OPEN_BUG_REPORT_IN_CHAT` with this payload. `DashboardPanel` routes both to dedicated handlers. `generateBugReport` returns `AiSuggestion` (extended with `investSummary?: string`); the panel posts `{ type: 'AI_SUGGESTION', payload: { suggestion } }` on success. Progress is communicated via `{ type: 'LOADING', payload: { message, busy } }`. Both new event types are added to `ExtensionEvent` in `messages.ts`.

### Cross-Agent Integration: Bug Report Wizard ↔ Service (2026-04-25)

**Coordination with Rusty (Frontend):**
- Rusty built collapsible sections on all PBI Studio cards, type selector (Bug/Feature pill), and 4-step BugReportWizard component
- Rusty added `BugReportInput` interface and message types to webview (`webview-ui/src/types.ts`), signaling contract requirements
- Rusty wired wizard handlers to send `GENERATE_BUG_REPORT` and `OPEN_BUG_REPORT_IN_CHAT` messages with payload

**Backend completion:**
- Mirrored all webview types to `src/shared/messages.ts`
- Added generic `LOADING` and `AI_SUGGESTION` event types (bug reports don't tie to drafts → no draftId)
- Implemented `generateBugReport()` and `openBugReportInChat()` in CopilotService with model fallback chain
- Added `gatherRepoContext()` to inject workspace intelligence (package.json, README, git log, file list) into generations
- Wired DashboardPanel handlers with proper `CancellationTokenSource` lifecycle

**Integration result:**
- Both agents committed together (b953dc8): full build passed, 47 modules, 18.90KB CSS, 215KB JS, zero errors
- Bug report workflow complete: UX → message send → service handling → AI generation → result display
- Repo context improves LM accuracy; model fallback chain ensures org compatibility

### Project Reorganization: Build Config Migration (2026-04-28)

Completed full project directory reorganization with file migrations and build configuration updates. 

**Directories Created:** `build/vscode/`, `deploy/`, `dev/`

**Files Moved (git mv — history preserved):**
- `esbuild.js` → `build/esbuild.config.js`
- `.vscodeignore` → `build/vscode/.vscodeignore`
- `BUG_SECTION_IMPLEMENTATION.md` → `dev/BUG_IMPLEMENTATION_NOTES.md`
- `docs/PLAN.md` → `dev/PROJECT_PLAN.md`

**Configuration Updates:**
- `package.json`: Updated build scripts from `"node esbuild.js"` to `"node build/esbuild.config.js"` and watch script
- `.gitignore`: Added `build/releases/` for VSIX packaging
- Squad docs: Updated charter.md and history.md with new build paths

**Verification:**
- ✅ Build passes: `npm run build:extension` successful
- ✅ Paths verified: esbuild.config.js uses project-relative paths (src/, dist/)
- ✅ No broken references: All build commands functional
- ✅ Git history preserved via `git mv`

**Lasting Pattern:** When moving build artifacts, coordinate with package.json updates first (blocker), use git mv to preserve history, then verify full build + packaging cycle (npm run build && npm run package).

### Git Conflict Resolution Strategy (2026-04-28)

Git conflict resolution using `git checkout --theirs` for feature-first merge strategy. Applied to PR #19 Squad-Team branch when 4 conflicts arose during main rebase. Feature branch represents the desired state; resolved by keeping feature branch versions on all conflicts, achieving mergeable_state: clean.

### postinstall Pattern for Monorepo Subdirectory (2026-04-28)

Use `"postinstall": "npm --prefix webview-ui install"` in the root `package.json` to automatically install webview-ui dependencies whenever someone runs `npm install` at the root. The `--prefix` flag is already the project's established style (used in `build:webview` and `watch:webview`). npm automatically runs the `postinstall` lifecycle hook after every `npm install` invocation, so this ensures the webview workspace is always ready without manual steps.

