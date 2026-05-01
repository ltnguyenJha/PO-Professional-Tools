# Basher — History

## Project Context
- **Project:** PO-Professional-Tools — VS Code extension providing AI-assisted PBI Studio for Product Owners
- **Owner:** ltnguyen
- **Stack:** TypeScript, React (Vite), VS Code Extension API, Node.js, GitHub Copilot API, esbuild
- **Repo:** ltnguyenJha/PO-Professional-Tools

## Architecture Already in Place

### Work Item Hierarchy
- `EpicDraft` (not yet implemented — NEXT TASK)
- `FeatureDraft` → `PbiDraft` (implemented, in `src/shared/messages.ts`)
- Parent-child ADO link: `System.LinkTypes.Hierarchy-Reverse` on child pointing to parent
- Feature Work Item Type = "Feature" (hardcoded)
- Child Work Item Type = "Product Backlog Item" (hardcoded)

### Key Files
- `src/shared/messages.ts` — all shared types (EpicDraft, FeatureDraft, PbiDraft, message types)
- `webview-ui/src/types.ts` — webview mirror (must stay in sync with messages.ts)
- `src/panels/DashboardPanel.ts` — message router, all EPIC_*/FEATURE_*/PBI_* handlers
- `webview-ui/src/views/FeatureCreationWizard.tsx` — 5-step Feature Creation wizard (REFERENCE IMPL for Epic Creation)
- `webview-ui/src/views/DashboardView.tsx` — accordion hierarchy dashboard (Epic → Feature → PBI)
- `webview-ui/src/views/PbiStudio.tsx` — PBI Studio view
- `webview-ui/src/App.tsx` — top-level router

### ADO Integration Pattern
- `src/services/adoService.ts` — ADO REST API calls
- `src/services/copilotService.ts` — AI generation
- Push pattern: create parent → create children → add `System.LinkTypes.Hierarchy-Reverse` relation on each child

### CSS/Design System
- Tailwind v3 with VS Code token bridge in `webview-ui/src/styles/tailwind.css`
- WCAG 2.1 AA compliant — all new components must follow the token bridge pattern
- Design system reference: `.squad/skills/design-system/SKILL.md`

### Feature Creation (Reference Implementation)
- 5-step wizard: Title/Description → Context & Repos → AI Generation → Review/Edit → Confirm
- Draft saved to globalState, accessible in PBI Studio
- ADO push creates Feature + child PBIs with hierarchy links

## Learnings

### 2026-04-30 — Epic Creation Architecture Session

**Task:** Produced full implementation-ready architecture spec for Epic Creation (`docs/architecture/epic-creation-spec.md`).

**Key findings from codebase audit:**
- `EpicDraft` stub already existed in `webview-ui/src/types.ts` with field `featureIds` — needed full expansion and rename to `linkedFeatureIds`
- `FeatureDraft.parentEpicId?` already present in both type files — zero migration needed
- `AppStatePayload.epicDrafts` missing from `src/shared/messages.ts` but present (optional) in `webview-ui/src/types.ts` — needs to be required in both
- `postState()` in DashboardPanel.ts does not include `epicDrafts` — Linus needs to add one line
- Significant `ExtensionEvent` shape discrepancies between the two type files for FEATURE_* events (FEATURE_DRAFT_CREATED, FEATURE_PUSH_PROGRESS, FEATURE_PUSHED payloads differ) — documented in spec Section 3.3 for Linus to resolve in same pass
- Feature Creation Wizard Step 2 already reads `epicDrafts` from appState and shows Epic selector — the groundwork for Epic creation is partially laid

**Design decisions made:**
- Feature count default: 5 (range 1–10), user-editable on Step 3
- Step 3 (AI generation) is OPTIONAL — Skip button provided
- Features are SUGGESTIONS only until Step 5 confirm — prevents orphaned drafts
- Push strategy: Option B (pushChildren: boolean) — user controls scope
- Status rollup: strict minimum (all-or-nothing pushed)
- No new settings UI in Phase 1 — reuse existing AdoSettings
- ID generation: `Date.now().toString()` — matches existing pattern (not nanoid)

**Architecture pattern confirmed:** ADO Hierarchy-Reverse link pattern is already proven for Feature→PBI in `adoService.pushWithParent()`. Epic→Feature uses identical pattern.

**Files that need changes in Phase 1:** `src/shared/messages.ts`, `webview-ui/src/types.ts`, `src/panels/DashboardPanel.ts` (postState + 7 new handlers), `src/services/adoService.ts` (new pushEpicHierarchy), `src/services/copilotService.ts` (new generateFeaturesFromEpic).

**Deliverables produced:**
- `docs/architecture/epic-creation-spec.md` — 10-section implementation-ready spec
- `.squad/decisions/inbox/basher-epic-creation-arch.md` — decision record
