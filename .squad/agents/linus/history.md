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
