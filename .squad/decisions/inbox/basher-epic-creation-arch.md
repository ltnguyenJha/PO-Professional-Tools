# Decision Record: Epic Creation Architecture

**Author:** Basher (Solutions Architect)  
**Date:** 2026-04-30  
**Status:** Proposed — Awaiting team review  
**Spec:** `docs/architecture/epic-creation-spec.md`  
**Brief:** `docs/architecture/epic-creation-brief.md`

---

## Context

Danny wrote a scoping brief for Epic Creation (the third tier of the PO-Professional-Tools work item hierarchy). This record documents the key architectural choices made during the design session and their rationale. All choices are grounded in a full read of the codebase.

---

## Key Decisions

### 1. EpicDraft is a first-class type (not a PbiDraft extension)

**Decision:** `EpicDraft` is its own interface in `src/shared/messages.ts`, separate from `FeatureDraft` and `PbiDraft`.

**Rationale:** Matches the existing pattern (FeatureDraft is already separate from PbiDraft). EpicDraft has unique fields — `objectives[]`, `scope`, `linkedFeatureIds`, `selectedRepoIds`, `aiGeneratedFeatures` — that have no analogue in PbiDraft. PbiDraft is already overloaded with bug/feature/story fields (per existing decision record `danny-epic-feature-architecture.md`). Keeping types separate enables clean validation and independent lifecycles.

---

### 2. `linkedFeatureIds` over `featureIds` (field rename)

**Decision:** Rename the stub `featureIds: string[]` field in `webview-ui/src/types.ts` to `linkedFeatureIds: string[]` in the final type.

**Rationale:** "Linked" is semantically accurate — features are _linked_ to Epics, not _owned_ by them. Features can be orphaned (unlinked) or re-linked without deletion. The rename also prevents confusion with the `featureId` field used in message payloads.

**Impact on Linus:** One field rename in `webview-ui/src/types.ts`. No data migration needed (feature was a stub with no production data).

---

### 3. Feature suggestions in wizard state — not persisted until Step 5

**Decision:** AI-generated feature suggestions live in `localSuggestions` React state inside `EpicCreationWizard`. No FeatureDrafts are created in globalState until the user clicks "Save as Draft" or "Push to ADO" on Step 5.

**Rationale:** Prevents orphaned drafts from users who abandon the wizard mid-session. Mirrors the pattern in existing FeatureCreationWizard where generated PBIs are reviewed before commit. Keeps globalState clean.

**Impact on Rusty:** Step 3 fires `GENERATE_FEATURES_FROM_EPIC` → backend returns `EPIC_GENERATION_COMPLETE` with `suggestions[]` payload → wizard stores locally → Step 5 sends `CREATE_FEATURE_DRAFT` × N then `CREATE_EPIC_DRAFT`.

---

### 4. Push strategy: Option B (pushChildren flag, not atomic)

**Decision:** `PUSH_EPIC_TO_ADO` payload includes `pushChildren: boolean`. If false, only the Epic is created in ADO. If true, linked Features (and their children) are pushed sequentially.

**Rationale:** Option A (atomic all-or-nothing) is fragile — a single PBI failure rolls back everything. Option C (prompt per Feature) is too click-heavy. Option B gives the user control without overwhelming them. Partial failures result in `status: 'partial'` — surfaced via amber badge in dashboard. This is the least-surprise choice for enterprise POs.

---

### 5. Status rollup: strict minimum rule

**Decision:** Epic status is calculated as the strict minimum of its children's states:
- `'pushed'` only when Epic is pushed AND ALL linked features are pushed
- `'partial'` when Epic is pushed but any feature is not
- `'ready'` when all features are `'ready'` or `'pushed'` (and Epic not yet pushed)
- `'draft'` otherwise

**Rationale:** "Majority vote" or "80% rule" creates false confidence. A PO needs to know when the hierarchy is truly complete in ADO. Strict minimum is auditable and unambiguous. Matches how `HierarchyStatus` is already used for Feature→PBI (a Feature is only 'pushed' when ALL its PBIs are pushed).

---

### 6. Phase 1 reuses existing AdoSettings — no new settings UI

**Decision:** Epic push uses `adoSettings.areaPath`, `adoSettings.iterationPath`, `adoSettings.orgUrl`, `adoSettings.projectName`, and the existing PAT. No new Epic-specific settings fields in Phase 1.

**Rationale:** Danny's brief explicitly recommends this for Phase 1 MVP. Adding new settings UI adds a full sprint of scope to the critical path. The majority of teams will have the same area/iteration for all work item types within a project. Post-MVP, `epicAreaPath` and `preferredFeatureCount` can be added to SettingsView.

---

### 7. ID generation: `Date.now().toString()` (not nanoid)

**Decision:** EpicDraft and Feature suggestions use `Date.now().toString()` for client-side ID generation.

**Rationale:** Matches the existing pattern in DashboardPanel.ts `handleCreateFeatureDraft()` (line 1458: `id: Date.now().toString()`). Introducing nanoid would require a new dependency and is inconsistent with existing patterns. IDs are local-only (not shared across sessions or networks), so uniqueness within a session is sufficient.

---

### 8. ADO link direction: Hierarchy-Reverse on child

**Decision:** Hierarchy links are added as `System.LinkTypes.Hierarchy-Reverse` on the **Feature** work item pointing **up** to the **Epic** work item URL.

**Rationale:** This is the existing pattern already proven for Feature→PBI in `adoService.pushWithParent()` (adoService.ts lines 320-330). No new link type needed. ADO renders this as a native parent-child hierarchy in the backlog view.

---

### 9. Dashboard Epics section at top, expanded by default

**Decision:** Epics accordion section appears **above** the existing Features and PBIs sections in DashboardView. First Epic auto-expands on load.

**Rationale:** Hierarchy flows top-down. Epics are the strategic planning artifact; they should be the first thing a PO sees. Collapsed-by-default hides the primary value of the feature. Mirrors common project management tools (Jira, Azure Boards) where Epics appear at the top.

---

### 10. Step 3 (AI Generation) is optional — Skip button provided

**Decision:** Step 3 of the Epic Creation wizard has a "Skip →" secondary button that lets the user proceed to Step 4 with an empty suggestion list.

**Rationale:** Not every team uses AI generation. Some POs have pre-defined Features in mind and just need to input them manually. Forcing AI generation would block users without GitHub Copilot configured. The Skip path ends in the same Step 4/5 as the generation path, making it a zero-cost addition.

---

## Deferred Decisions (Phase 2)

| Topic | Deferred To | Notes |
|---|---|---|
| `epicAreaPath` / `epicIterationPath` settings | Phase 2 | Use global AdoSettings in Phase 1 |
| Auto-calc velocity from child features | Phase 2 | Manual entry only in Phase 1 |
| Import existing ADO Epic as draft | Phase 2 | Greenfield creates are Phase 1 |
| AI model / temperature configuration | Phase 2 | Existing CopilotService.pickModel() handles fallback |
| Drag-to-reorder Features in Step 4 | Phase 2 | Array order sufficient for MVP |
| "Generated" vs "Manual" source badge on Features | Phase 2 | `aiGeneratedFeatures` flag stored; display deferred |

---

## Dependencies

- **Blocks:** Feature Creation Wizard Phase 2 polish (no code conflicts; additive changes only)
- **Unblocked by:** No blocking dependencies. All changes are additive to existing types.
- **Requires:** Linus to resolve existing FEATURE_* event discrepancies between `messages.ts` and `types.ts` during Phase 1 (Section 3.3 of spec) before Rusty reads from those event types in the new wizard.
