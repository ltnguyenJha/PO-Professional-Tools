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

### Documentation Audit & Update (2026-05-06)
- Audited merge from `main` to `squad/36-ui-cleanup` — found Technical Considerations feature + UI delight refresh
- **Created:** `release-notes/2026-05-06.md` — Comprehensive release notes covering:
  - Issue #20: Technical Considerations feature (AI-powered guidance for developers)
  - Issue #26: Technical Considerations button regression fix
  - UI/UX delight refresh (colors, micro-interactions, empty states, light mode overhaul)
- **Updated:** `CHANGELOG.md` — Added v0.3.0 entry with full changelog
- **Updated:** `user-guide/pbi-studio.md` — Expanded Technical Considerations section with step-by-step guidance for using the Generate button
- **Updated:** `README.md` (output folder) — Added new release notes link to documentation table

### Documentation Status (Current)
**Output folder structure:**
```
C:\Users\CBaldwin\Documents\PBI Studio docs\
├── README.md (updated 2026-05-06)
├── CHANGELOG.md (updated 2026-05-06)
├── user-guide/
│   ├── pbi-studio.md (updated 2026-05-06)
│   ├── dashboard.md (current)
│   ├── feature-creation.md (current)
│   ├── epic-creation.md (current)
│   └── settings.md (current)
└── release-notes/
    ├── 2026-05-06.md (new - comprehensive)
    ├── 2026-05-01-link-stories.md (existing)
    ├── 2026-05-01.md (existing)
    └── 2026-04-30.md (existing)
```

### In-Repo Docs (Not Updated by Reuben)
- `README.md` — High-level developer overview (no user-facing changes needed)
- `INSTALLATION_GUIDE.md` — Installation instructions (no feature changes)
- `docs/QUICK_START.md` — Developer quick start (owned by dev docs)
- `docs/DESIGN.md` — New design document (added in merge, technical/internal)
- `docs/VISUAL_SPEC.md` — New visual spec (added in merge, technical/internal)

---

## Learnings (2026-05-06)

### What Exists & Where

**User-facing documentation lives in `C:\Users\CBaldwin\Documents\PBI Studio docs\`** (NOT in repo):
- This is the single source of truth for end-user docs, release notes, and guides
- Separate from technical/architecture docs in `repo/docs/`
- All three command entry points (Dashboard, PBI Studio, Bulk Breakdown) use the same `DashboardPanel` singleton

**Documentation structure works well:**
- `README.md` — Hub/TOC for all user docs
- `CHANGELOG.md` — Running log of all releases (v0.0.1 → v0.3.0)
- `release-notes/` — One file per release with marketing-friendly narrative
- `user-guide/` — Step-by-step walkthroughs for each major feature

**Key finding:** Merges from `main` bring production features; audit incoming changes and document them immediately.

### Documentation Gaps Filled

1. **Technical Considerations feature (Issue #20)** — Existed as artifact (`.squad/artifacts/issue-20-release-notes.md`) but wasn't in user docs. Now in release notes, README, and pbi-studio.md guide.

2. **UI/UX delight refresh** — Major visual overhaul in PRs #71–#72 had no user-facing release notes. Now documented with full impact statement.

3. **Technical Considerations button fix (Issue #26)** — Bug fix documented in release notes + CHANGELOG.

### Going Forward

- **On each merge from main:** Check git log, read changed files, audit what's new, and write release notes within 24 hours
- **User guide updates:** When features change, update the corresponding guide file (pbi-studio.md, dashboard.md, etc.)
- **Release cadence:** Group related features into one release notes file by date (e.g., 2026-05-06.md)
- **Changelog format:** Keep v0.X.Y versioning; use "Added/Changed/Fixed/Accessibility" sections

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
