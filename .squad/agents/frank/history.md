# Frank — History

## Project Context
- **Project:** PO-Professional-Tools — VS Code extension providing AI-assisted PBI Studio for Product Owners
- **Owner:** ltnguyen
- **Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js, GitHub Copilot API, esbuild
- **Repo:** ltnguyenJha/PO-Professional-Tools

## Current Test Infrastructure

### Existing Tests
- `src/test/epicHandlers.unit.test.ts` — unit tests for Epic creation message handlers (added 2026-04-30)
- `src/test/__mocks__/vscode.ts` — VS Code API mock for unit tests

### Build & Test Commands
- `npm run build` — full build (extension + webview)
- `tsc --noEmit` — TypeScript type-check (run in both root AND `webview-ui/`)
- No automated CI pipeline yet — **this is Frank's first priority**

## Onboarded: 2026-05-01

Frank joined the squad to own QA automation and post-deployment smoke testing. First tasks:
1. Audit existing test coverage
2. Set up GitHub Actions CI pipeline to run tests on every PR and push
3. Define and implement post-deployment smoke test strategy
