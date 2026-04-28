# Project Context

- **Owner:** ltnguyen
- **Project:** PO-Professional-Tools — VS Code extension for Product Owners with PBI Studio, User Story Wizard (INVEST), GitHub Copilot Agent integration
- **Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js, GitHub Copilot API, esbuild
- **Key files:** `src/panels/DashboardPanel.ts`, `src/services/copilotService.ts`, `webview-ui/src/views/PbiStudio.tsx`, `webview-ui/src/components/`, `src/shared/messages.ts`
- **Build:** `npm run build` (esbuild extension + Vite webview). TypeScript check: `tsc --noEmit`.
- **Created:** 2026-04-24

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

## Learnings

<!-- Append new learnings below. Each entry is something lasting about the project. -->

### Project Reorganization: Decision-Driven Architecture Review (2026-04-28)

Completed comprehensive analysis and approval of project restructuring (docs/, dev/, deploy/, build/). Key decisions:

**Decision 1: `.vscodeignore` Location** — Standard practice keeps `.vscodeignore` at repo root (VSCE/packaging tools expect this). Risk of moving to `build/vscode/` outweighs organizational benefit. Stayed at root.

**Decision 2: `PITCH.md` Placement** — Clarified audience: external stakeholders (investors, partners, leadership). Moved to `docs/PRODUCT_VISION.md` for discoverability and strategic context.

**Implementation Safety** — Identified build script path references as blocker; required `package.json` update from `"node esbuild.js"` to `"node build/esbuild.config.js"` before file moves.

**Outcome:** Led team through four-agent coordination (Linus: migrations, Rusty: docs, Livingston: verification, Coordinator: process). All verification checks passed. Reorganized structure now live.

**Lasting Pattern:** Architecture decisions benefit from cross-team input (lead + backend + frontend + QA + coordinator). Document decision points with "Decision Needed" signals to unblock implementation. Use git mv to preserve history during refactors.
### Local Dev Setup Diagnosis (2026-04-28)

**Problem:** Both `node_modules` directories were completely absent — root and `webview-ui/`. This is the #1 blocker for any fresh clone or new dev environment.

**Root cause:** `node_modules` is correctly `.gitignore`'d; devs must run installs manually after cloning.

**What was fixed:**
- `npm install` at project root → 147 packages installed (esbuild, TypeScript, azure-devops-node-api, etc.)
- `npm install` at `webview-ui/` → 72 packages installed (React, Vite, TypeScript)
- `npm run build` → ✅ SUCCESS: `dist/extension.js` (2.7MB), `webview-ui/dist/` (index.html + JS + CSS)

**Known non-blocking warning:** Vite CSS minifier emits `css-syntax-error` warning on `font-size: 0.85rem` (line 743 of bundled CSS). Build still succeeds and outputs correctly. Pre-existing, non-blocking.

**Confirmed working structure:**
- `build/esbuild.config.js` — valid, targets `src/extension.ts` → `dist/extension.js`
- `tsconfig.json` — valid (ES2022, commonjs, strict)
- `src/extension.ts` — valid entry point (registers 3 commands via DashboardPanel)
- `webview-ui/package.json` — React + Vite stack, `vite build` script correct

**Manual step required:** After build, open repo in VS Code and press **F5** to launch Extension Development Host.

**Audit warnings:** 3 vulnerabilities (1 moderate, 2 high) in both installs. Non-blocking for dev but should be addressed before production packaging (`npm audit fix`).

### Strategic Framing: Platform Play Over Point Solution (2026-04-25)

**Pitch Positioning** — Framed PO Professional Tools as a platform, not a one-off ADO integration. Azure DevOps is the wedge; Monday.com, ClickUp, Jira, and custom connectors are the expansion strategy. This positioning matters for recruiting engineers and securing org buy-in.

**ROI Quantification** — Time savings: 60% reduction in PBI drafting time (20 mins → 5 mins per story), 97% reduction in feature breakdown time (60 mins → 2 mins for 15 child items). Per-team savings: $50k–75k/year in reclaimed capacity. These numbers anchor the business case.

**User Journey as Core Loop** — Scan → Generate → Refine → Push is the atomic workflow. Every feature should accelerate or enhance this loop. New integrations (Monday.com, ClickUp) replicate the loop with different targets. Plugin ecosystem extends the loop with custom scanners and templates.

**Local-First as Differentiator** — No SaaS friction, no data export concerns, no procurement delays. Runs on already-licensed tools (VS Code, GitHub Copilot, Azure DevOps). This is defensible against cloud-first competitors in enterprise/government/compliance-heavy orgs.

**Extensibility Roadmap** — Phase 1 (ADO, shipped) → Phase 2 (multi-platform, 6 months) → Phase 3 (plugin SDK, 12 months) → Phase 4 (team collaboration, 18 months). Clear signal that this is a long-term platform investment, not a prototype.

### Postinstall Hook Implementation (2026-04-28)

**Cross-Agent Update:** Linus implemented postinstall script based on local setup diagnosis. Recommendation was to add `"postinstall": "npm --prefix webview-ui install"` to root `package.json` scripts — this eliminates the two-step manual install friction. All new devs and CI/CD now require single `npm install` command instead of remembering to manually install webview-ui dependencies.
