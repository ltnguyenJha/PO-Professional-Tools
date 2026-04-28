# Architecture

High-level system design for PO Professional Tools.

---

## System Overview

```
┌─────────────────────────────────────────────┐
│     VS Code Extension (TypeScript/Node)     │
├─────────────────────────────────────────────┤
│  extension.ts (entry point)                 │
│  ├─ Registers commands (openDashboard, etc) │
│  ├─ Creates webview panels                  │
│  └─ Manages extension state                 │
├─────────────────────────────────────────────┤
│  Panels & Services                          │
│  ├─ DashboardPanel ↔ Dashboard view         │
│  ├─ PbiStudioPanel ↔ PbiStudio view         │
│  ├─ ProjectsPanel ↔ Projects view           │
│  ├─ SettingsPanel ↔ Settings view           │
│  ├─ BulkBreakdownPanel ↔ BulkBreakdown view │
│  │                                          │
│  └─ Services:                               │
│     ├─ ScannerService (code analysis)       │
│     ├─ CopilotService (LM API)              │
│     ├─ AdoService (Azure DevOps API)        │
│     └─ StateService (persist drafts, etc)   │
├─────────────────────────────────────────────┤
│         postMessage Bridge                  │
│  (webview-ui/src/types.ts ↔ shared/types)   │
├─────────────────────────────────────────────┤
│   Webview (React + Vite + TypeScript)       │
│   ├─ App.tsx (root)                         │
│   ├─ Views (Dashboard, PbiStudio, etc)      │
│   ├─ Components (Buttons, Cards, Forms)     │
│   └─ Styles (VS Code CSS variables)         │
└─────────────────────────────────────────────┘
```

---

## Module Breakdown

### Extension Backend (src/)

#### `extension.ts`
- Entry point for the VS Code extension.
- Registers commands (`openDashboard`, `openPbiStudio`, `openBulkBreakdown`).
- Instantiates panel classes.
- Manages extension activation and deactivation.

#### `panels/`
- **`DashboardPanel.ts`** — Hosts the Dashboard view. Shows KPIs and recent activity. Delegates state queries to services.
- **`PbiStudioPanel.ts`** — Hosts the PBI Studio view. Handles draft editing, generation, and ADO push.
- **`ProjectsPanel.ts`** — Hosts the Projects view. Manages repo folder import/removal and scanning.
- **`SettingsPanel.ts`** — Hosts the Settings view. Stores Azure DevOps config and PAT securely.
- **`BulkBreakdownPanel.ts`** — Hosts the Bulk Breakdown view. Creates prefixed child items and optional parent linking.

Each panel:
- Renders HTML with a webview container.
- Listens for messages from the webview via `webview.onDidReceiveMessage`.
- Sends messages back to the webview via `webview.postMessage`.

#### `services/`
- **`ScannerService.ts`** — Parses code files to detect routes, endpoints, and SQL objects. Returns structured scan data.
- **`CopilotService.ts`** — Uses `vscode.lm.selectChatModels({ vendor: 'copilot' })` to call the Copilot LM API. Sends prompts, streams or returns responses.
- **`AdoService.ts`** — Calls Azure DevOps REST API to create/update work items, fetch project metadata, and test connections.
- **`StateService.ts`** — Manages extension state (VS Code `context.globalState`) for persisting drafts, projects, settings, theme preference.

#### `shared/`
- **`messages.ts`** — Shared message type definitions for webview ↔ extension communication.
- Mirrors `webview-ui/src/types.ts` — **must stay in sync**.

---

### Webview Frontend (webview-ui/src/)

#### `App.tsx`
- Root React component.
- Routes between Dashboard, Projects, PBI Studio, Bulk Breakdown, Settings views based on `activeView` state.
- Passes `send` function to child views for sending messages to the extension.

#### `views/`
- **`Dashboard.tsx`** — Shows KPIs, recent activity, quick actions.
- **`Projects.tsx`** — Lists imported repos. Add, scan, remove, generate buttons.
- **`PbiStudio.tsx`** — Main editor. Displays draft list and full editor. Calls AI refinement, ADO push, collapsible utility sections.
- **`Settings.tsx`** — Form for ADO org URL, project, paths, work item type, PAT. Test Connection button.
- **`BulkBreakdown.tsx`** — Input prefix/separator, populate children (manual/AI/from-scan), generate and push.

#### `components/`
- **Reusable UI components** (Buttons, Cards, Input fields, etc.)
- Follow existing patterns in the codebase (leverage VS Code CSS variables).
- Receive data and callbacks via props; stateless or minimal state.
- Examples: `Button.tsx`, `Card.tsx`, `TextInput.tsx`, `UserStoryWizard.tsx`, `BugReportWizard.tsx`.

#### `styles.css`
- Global styles using **VS Code CSS variables** (`--vscode-foreground`, `--accent`, etc.)
- Component-specific styles (wizards, cards, buttons, inputs).
- Responsive layout and transitions.

#### `types.ts`
- **Webview-side message types** for `postMessage`.
- Defines request types (`WebviewRequest`) and event types (`WebviewEvent`).
- **Must sync with `src/shared/messages.ts`**.

#### `utils/`
- Helper functions for formatting, validation, state management.

---

## Data Flow

### Example: Creating and Pushing a PBI

1. **User enters PBI details in PbiStudio webview** → `send({ type: 'SAVE_DRAFT', payload: ... })`.
2. **PbiStudioPanel receives message** → calls `StateService.saveDraft()` to persist in extension state.
3. **User clicks "Generate full story in-panel"** → `send({ type: 'GENERATE_PBI', payload: draftId })`.
4. **PbiStudioPanel receives message** → calls `CopilotService.generatePbi()` with draft context.
5. **CopilotService** → calls `vscode.lm.selectChatModels()` → streams completion back.
6. **PbiStudioPanel receives result** → sends `postMessage({ type: 'AI_SUGGESTION', payload: suggestion })` back to webview.
7. **Webview shows suggestion** → user reviews and clicks "Apply".
8. **User clicks "Push to ADO"** → `send({ type: 'PUSH_TO_ADO', payload: draftId })`.
9. **PbiStudioPanel receives message** → calls `AdoService.createWorkItem()` with draft data.
10. **AdoService** → calls Azure DevOps REST API → returns work item ID.
11. **PbiStudioPanel** → calls `StateService.markPushed()` to update draft status.
12. **PbiStudioPanel sends back** → `postMessage({ type: 'PUSH_SUCCESS', payload: { draftId, workItemId } })`.
13. **Webview updates UI** → shows push status with ADO link.

---

## Key Design Patterns

### Message Types & Contracts

- All webview ↔ extension communication uses a message envelope: `{ type: string, payload?: any }`.
- Message types are **centralized** in `types.ts` (webview) and `messages.ts` (extension).
- New messages are added to both files before implementation.

### Service Abstraction

- Services encapsulate external API calls (Copilot, ADO, file system).
- Panels use services; they don't directly call APIs.
- Services return normalized results; panels transform and send to webview.

### State Persistence

- Extension state via `context.globalState` (VS Code's lightweight store).
- Webview state via React `useState` (ephemeral per session).
- Settings (PAT, org URL) stored securely via `context.secrets` (VS Code's encrypted store).

### UI Patterns

- **CSS Variables:** All styling uses VS Code theme variables for instant theme switching.
- **Component Reuse:** Wizards, cards, buttons, inputs are composed from smaller components.
- **Async UI:** AI calls and ADO push show loading toasts; results update the UI automatically.

---

## Configuration & Secrets

- **Settings:** Stored in extension state (`globalState`).
  - Org URL, project, paths, default work item type, theme.
- **PAT:** Stored securely in `context.secrets` (encrypted by VS Code).
- **Drafts & State:** Stored in `context.globalState`.

Secrets are **never** logged or sent to console. Settings are user-specific per VS Code session.

---

## Testing & Validation

- **Local build:** `npm run build` (esbuild for extension, Vite for webview).
- **Debug:** `F5` opens Extension Development Host with full breakpoint support.
- **Type check:** `tsc --noEmit` in both root and `webview-ui/` directories.
- **ADO integration:** "Test Connection" validates PAT and project access before operations.

---

## Deployment

- **Package:** `npm run package` generates a `.vsix` file.
- **Distribute:** Send `.vsix` to users or publish to VS Code Marketplace.
- **Version:** Update `package.json` version before packaging.

---

See [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for hands-on setup and common tasks.
