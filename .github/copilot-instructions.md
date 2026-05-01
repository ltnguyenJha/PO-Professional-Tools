# PO Professional Tools — Copilot Instructions

A VS Code extension that helps Product Owners scan codebases, generate AI-backed backlog items (PBIs), and sync to Azure DevOps. It has two separately-built parts: a Node.js/TypeScript extension backend and a React/Vite webview frontend.

## Build, Lint & Type-check

```powershell
# Install dependencies (run once or after pulling changes)
npm install
npm install --prefix webview-ui

# Full build (extension via esbuild + webview via Vite)
npm run build

# Watch mode during development
npm run watch            # extension only
npm run watch:webview    # webview only (Vite dev server)

# Lint extension TypeScript
npm run lint             # eslint src --ext .ts

# Type-check (no test suite exists — type checks are the validation step)
npx tsc --noEmit                          # extension
npx tsc --noEmit --project webview-ui/tsconfig.json   # webview

# Package for distribution
npm run package          # produces a .vsix file
```

Debug: press `F5` in VS Code → "Run Extension (Clean)" → Extension Development Host opens → run **PO Tools: Open Dashboard** from the Command Palette.

## Architecture

```
extension host (Node.js)            webview (React + Vite)
─────────────────────────           ──────────────────────
src/extension.ts                    webview-ui/src/App.tsx
  └─ registers 3 commands ──────────────────────────────────┐
                                                             │
src/panels/DashboardPanel.ts  ←──── postMessage bridge ────►│
  ├─ handles all WebviewRequest     (typed message envelopes)│
  │  message types                                           │
  └─ delegates to services:         webview-ui/src/views/
       AdoService          (ADO API)   DashboardView.tsx
       CopilotService       (LM API)   PbiStudio.tsx
       CodeAnalyzer         (fs scan)  BulkBreakdownView.tsx
       PbiDraftService      (state)    ProjectsView.tsx
       SettingsService      (prefs)    SettingsView.tsx
       SecretStorageService (PAT)
```

All three registered commands (`openDashboard`, `openPbiStudio`, `openBulkBreakdown`) currently resolve to the same `DashboardPanel` singleton — the view routing happens inside the React UI via a `ViewId` state.

## Shared Message Contract

**Critical sync requirement:** `src/shared/messages.ts` and `webview-ui/src/types.ts` define the same types independently. They must always be kept in sync manually.

When adding a new message:
1. Add the type to **both** `src/shared/messages.ts` and `webview-ui/src/types.ts`.
2. Add a handler branch in `DashboardPanel.ts` (`handleMessage` switch).
3. Add the corresponding `sendMessage(...)` call on the React side.

`WebviewRequest` = messages from webview → extension  
`ExtensionEvent` = messages from extension → webview

## State Persistence

- **Drafts, projects, settings:** `context.globalState` (VS Code lightweight key-value store), managed via `PbiDraftService` and `SettingsService`.
- **ADO PAT:** `context.secrets` (VS Code encrypted store) via `SecretStorageService` — never log or expose this value.
- **Webview UI state:** React `useState` only — ephemeral per session, re-hydrated from extension via `STATE_UPDATED` event on `APP_READY`.

## Copilot / LM API Usage

`CopilotService.pickModel()` uses a three-pass fallback:
1. `{ vendor: 'copilot', family: 'gpt-4o' }` — preferred
2. `{ vendor: 'copilot' }` — any Copilot model
3. `{}` — any available language model (supports firewall-restricted orgs with custom LM providers)

On total failure, show "Open Copilot Settings" action pointing to the `github.copilot` settings scope.

All AI calls expect **strict JSON output** — prompts include `REFINE_JSON_BRIDGE` / `FULL_STORY_JSON_BRIDGE` contracts that override any conflicting system rules. `webview-ui/src/utils/extractCopilotJson.ts` handles the fallback repair pipeline (smart-quote normalisation → `jsonrepair` → balanced-brace extraction) for cases when the model still emits prose or markdown fences.

`gatherRepoContext()` prepends workspace facts (package.json metadata, first 800 chars of README, last 15 git commits, up to 60 key files) via `messages.unshift()` before the system block. All I/O is wrapped in a single try/catch — it returns an empty string silently if git/workspace is unavailable.

## Key Conventions

- **CSS:** Use VS Code CSS variables (`--vscode-foreground`, `--vscode-button-background`, `--accent`, etc.) everywhere — no hardcoded colours. See `webview-ui/src/styles.css` for the full palette.
- **Collapsible sections:** Use `.section-header` with a rotating chevron; toggle body visibility via a `max-height` CSS transition (`0 ↔ 9999px`). Action buttons inside a header must call `stopPropagation` to prevent accidental collapse.
- **Segmented pill controls:** Active state uses `--accent` background + `#ecfeff` text — not `--accent-ink`, which is too dark in light mode.
- **Components:** One responsibility per component. Stateless or minimal state; data and callbacks come in as props. Use `key={item.id}` on stateful list items to prevent state leakage. When a wizard remounts (e.g., draft change), pass a `key` prop to reset internal state.
- **Iteration paths:** Always normalise with backslashes (`\\`). `iterationUtils.ts` has `resolveIterationPathForPush` and `iterationLeafFromPath` — use these instead of inline string manipulation.
- **ADO patch operations:** The `azure-devops-node-api` typings expect a numeric `Operation` enum for `op`, but the REST endpoint wants the string verb. The `asPatch()` helper in `adoService.ts` casts around this — follow the same pattern.
- **Error handling in panels:** Catch at the `handleMessage` level and surface via `postToast('error', message)`. Never let unhandled errors silently swallow user actions.
- **`STANDALONE_PROJECT_ID`:** PBIs created without an imported project use this sentinel from `pbiDraftService.ts`.
