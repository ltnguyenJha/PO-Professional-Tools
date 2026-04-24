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
