# Reuben — History

## Project Context
- **Project:** PO-Professional-Tools — VS Code extension providing AI-assisted PBI Studio for Product Owners
- **Owner:** ltnguyen
- **Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js, GitHub Copilot API, esbuild
- **Repo:** ltnguyenJha/PO-Professional-Tools
- **Docs Output:** C:\Users\CBaldwin\Documents\PBI Studio docs\

## Onboarded: 2026-05-01

Reuben joined to own all end-user documentation and release notes for PBI Studio.

## Documentation Status

### Initial Setup (2026-05-01)
- Docs output folder created at `C:\Users\CBaldwin\Documents\PBI Studio docs\`
- Initial user documentation written covering all current features
- First consolidated release notes covering PRs #45–#69

## Key Product Knowledge

### Current Features (as of 2026-05-01)
- **Dashboard** — Hierarchical view of Epics > Features > User Stories. Expandable cards, Edit buttons on all items, standalone stories always visible.
- **PBI Studio** — Create, edit, and push individual Product Backlog Items to ADO with Copilot AI assistance
- **Feature Creation Wizard** — 4-step wizard: define feature → select context → generate stories with AI → review/edit → push hierarchy to ADO. Supports editing existing features.
- **Epic Creation** — Create Epics with linked Features; push to ADO
- **Settings** — Configure Azure DevOps org URL, project, PAT token, area path, iteration

### ADO Integration
- Pushes work items to Azure DevOps via REST API
- Supports Epic > Feature > Product Backlog Item hierarchy
- Sets target date (`Microsoft.VSTS.Scheduling.TargetDate`) and effort (`Microsoft.VSTS.Scheduling.Effort`) on Features
- Auto-generates "Why does this matter" section in PBI descriptions from feature context

### Accessibility
- WCAG 2.1 AA compliant (PR #62)
- Full keyboard navigation support
- Screen reader compatible
