# Project Context

- **Owner:** ltnguyen
- **Project:** PO-Professional-Tools — VS Code extension for Product Owners with PBI Studio, User Story Wizard (INVEST), GitHub Copilot Agent integration
- **Stack:** TypeScript, VS Code Extension API, Node.js, GitHub Copilot API, esbuild
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
