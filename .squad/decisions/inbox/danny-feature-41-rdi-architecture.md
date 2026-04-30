# Decision: Feature 41 — RDI Creation Architecture

**Author:** Danny (Lead)  
**Date:** 2026-05-01  
**Status:** Proposed — Awaiting ltnguyen approval on 5 open questions  
**References:** `docs/architecture/feature-41-rdi-creation.md`

---

## Decision

Implement the RDI Creation feature (Issue #41) as a standalone **7-step wizard** (`RdiWizard`) that mirrors the existing `FeatureWizard` pattern. RDI drafts are stored in extension state as a new `RdiDraft[]` entity (separate from `PbiDraft`). ADO push uses the existing `AdoService` + `azure-devops-node-api` with a new `pushRdi()` method that writes all RDI fields into an HTML-structured `System.Description`.

## Key Choices Made

1. **New entity type (`RdiDraft`) — not extending `PbiDraft`.**  
   RDIs have fundamentally different fields (deployment details, backout strategy, PBI links, DB changes). Forcing them into `PbiDraft` would bloat the interface and break the PBI wizard. Clean separation is the correct call.

2. **7-step wizard orchestrated by `RdiWizard.tsx`.**  
   Directly reuses the `FeatureWizard` orchestrator pattern (WIZARD_DRAFT_LOAD/SAVE/STEP messages, blur-debounce saves, step-guard navigation). No new infrastructure needed — proven pattern, well-understood by Rusty.

3. **ADO field strategy: embed all content in `System.Description` as structured HTML.**  
   This is pragmatic — organizations vary widely in ADO process template customization. Using the description field guarantees compatibility across all org configurations. PBI links are embedded as hyperlinks (not ADO relations) for MVP.

4. **No AI assist for MVP.**  
   RDIs are structured factual data (URLs, scripts, PBI IDs). AI generation adds little value here and defers complexity. AI assist can be added as a follow-on if users request summary generation for release notes.

5. **New sidebar tab "RDIs" in Dashboard.**  
   Keeps RDI workflow separate from PBI Studio. Clean mental model for users: PBIs ≠ RDIs. Same navigation shell.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| ADO work item type mismatch (custom RDI type) | Step 1 exposes Work Item Type dropdown — user selects correct type |
| Long wizard friction (7 steps) | All steps persist on blur; wizard is resumable from any step; Step 7 review before push |
| PBI links not validated against ADO | MVP: accept any integer ID; show in description as-is. Future: resolve against ADO work item API |

## Open Questions (ltnguyen must resolve)

1. Work Item Type — existing `AdoWorkItemType` or custom ADO type?
2. PBI linking depth — description links or ADO parent-child relations required at launch?
3. RDI list placement — separate sidebar tab or section inside PBI Studio?
4. Iteration pre-population — auto-fill from ADO settings default?
5. Applications list — free-text or from ADO tags/areas?

## Implementation Sequence

1. **Phase 0 (Danny/Linus):** Type definitions in `messages.ts` + `webview-ui/src/types.ts`
2. **Linus:** `RdiDraftService` → `AdoService.pushRdi()` → DashboardPanel handlers
3. **Rusty:** `RdiWizard.tsx` → 7 step components → `RdiStudio.tsx` → sidebar integration
4. **Danny:** Final code review + architecture validation before merge
