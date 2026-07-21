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

---

## 2026-07-08 — Root documentation consolidation (with Danny cleanup)

**Branch:** `chore/docs-consolidation`  
**Scope:** Reduce root markdown sprawl; align with 2026-04-28 reorg decision (`PITCH.md` → `docs/PRODUCT_VISION.md`).

### Before — root inventory (7 `.md`, 5 `.txt`)
| File | Disposition |
|------|-------------|
| `README.md` | **Kept** — repo entry point |
| `AGENTS.md` | **Kept** — agent baseline (untracked; out of scope) |
| `PITCH.md` | Duplicate of `docs/PRODUCT_VISION.md` → **deleted** |
| `INSTALLATION_GUIDE.md` | Overlap with `docs/QUICK_START.md` → **merged then deleted** |
| `ISSUE_34_MERGE_STATUS.md` | Ephemeral squad handoff → **moved** to `.squad/artifacts/issue-34-merge-status.md` |
| `HANDOFF_PR_CREATION.md` | Ephemeral squad handoff → **moved** to `.squad/artifacts/issue-34-pr-handoff.md` |
| `FINAL_REPORT_ISSUE_34.txt` | Duplicate of issue-34 artifacts → **deleted** |
| `ISSUE_34_COMPLETION_SUMMARY.txt` | Duplicate of issue-34 artifacts → **deleted** |
| `build-output.txt` | Ephemeral build log → **deleted** |
| `design-handoff-content.txt` | Empty temp file → **deleted** |

### After — root inventory (2 `.md`, 0 `.txt`)
- `README.md`
- `AGENTS.md`

### Consolidation map
| Action | Source | Destination |
|--------|--------|-------------|
| **Deleted** | `PITCH.md` | Canonical: `docs/PRODUCT_VISION.md` |
| **Merged + deleted** | `INSTALLATION_GUIDE.md` | `docs/QUICK_START.md` (VSIX steps, troubleshooting table, system requirements) |
| **Moved** | `ISSUE_34_MERGE_STATUS.md` | `.squad/artifacts/issue-34-merge-status.md` |
| **Moved** | `HANDOFF_PR_CREATION.md` | `.squad/artifacts/issue-34-pr-handoff.md` |
| **Deleted** | `FINAL_REPORT_ISSUE_34.txt`, `ISSUE_34_COMPLETION_SUMMARY.txt`, `build-output.txt`, `design-handoff-content.txt` | — (content covered by `.squad/artifacts/` or obsolete) |

### Link updates
- `.squad/agents/README.md` — `../../PITCH.md` → `../../docs/PRODUCT_VISION.md` (Danny)
- `.squad/artifacts/issue-34-pr-handoff.md` — internal refs updated to `.squad/artifacts/issue-34-merge-status.md` (Reuben)
- `README.md` — no change needed (already links `docs/QUICK_START.md`, `docs/PRODUCT_VISION.md`)

### Canonical locations (confirmed)
| Audience | Location |
|----------|----------|
| Repo overview | `README.md` (root) |
| PO / end users | `docs/QUICK_START.md`, `docs/PO-TOOLS-SIMPLE-GUIDE.md` |
| Stakeholders | `docs/PRODUCT_VISION.md` |
| Developers | `dev/DEVELOPMENT_GUIDE.md`, `dev/ARCHITECTURE.md` |
| Squad ops / session artifacts | `.squad/artifacts/`, `.squad/decisions.md` |

---

## 2026-07-21 — Add root CHANGELOG.md for release CI gate (0.1.4)

**Branch:** `docs/changelog-0.1.4` (from `origin/main`)  
**Trigger:** Squad Release CI failed on main — `package.json` is `0.1.4` but `CHANGELOG.md` lacked `## [0.1.4]` (workflows `squad-release.yml` / `squad-promote.yml` / `squad-preview.yml`).

### What I did
- Left unrelated `feature/a11y-david-ui-refresh` branch; created `docs/changelog-0.1.4` from `origin/main`
- Added repo-root `CHANGELOG.md` (Keep a Changelog) with solid **`## [0.1.4] — 2026-07-20`** summarizing user-facing work since tag `v0.1.3` through #88
- Brief honest **`## [0.1.3] — 2026-04-29`** from the tagged release commit only (no invented earlier history)
- Verified gate: `grep "## [0.1.4]"` would pass against `package.json` version
- Commit + push for Danny PR review/merge (Reuben does not merge)

### Notes for Danny
- Date on 0.1.4 uses merge of #88 (`2026-07-20`); version bump itself landed earlier in #73
- Prior versions beyond 0.1.3 intentionally omitted — no prior CHANGELOG existed to reconstruct from
