# feat: Feature #41 — RDI Creation Wizard

## Summary

Implements end-to-end **Release Deployment Item (RDI)** creation for PO Professional Tools. Users can now create, edit, and push RDIs to Azure DevOps directly from the VS Code sidebar — with a 6-step guided wizard, persistent draft storage, ADO parent-child PBI relations, and a review panel before push.

---

## What Was Built

### Backend
- **`src/shared/messages.ts`** — `RdiDraft`, `RdiPbiLink`, `RdiDeploymentDetail`, `RdiManualDbChange`, `RdiStatus` types; 7 `WebviewRequest` RDI variants; 8 `ExtensionEvent` RDI variants.
- **`src/services/rdiDraftService.ts`** — CRUD service persisting drafts in `globalState` under key `rdi-drafts`.
- **`src/services/adoService.ts`** — `getDefaultIteration()` (fetches current sprint from ADO teams API) and `pushRdi()` (creates work item with `System.LinkTypes.Hierarchy-Reverse` parent-child relations and HTML description builder).
- **`src/panels/DashboardPanel.ts`** — 7 new message handler cases (`createRdiDraft`, `loadRdiDraft`, `saveRdiDraft`, `deleteRdiDraft`, `pushRdi`, `loadRdiList`, `getDefaultIteration`) with full try/catch error handling and ADO progress events.

### Frontend
- **`webview-ui/src/types.ts`** — RDI types mirrored from shared messages (canonical source; `rdiTypes.ts` temp file removed).
- **`webview-ui/src/hooks/useRdiDraft.ts`** — React hook managing draft state, message listeners, and debounced auto-save.
- **`webview-ui/src/components/rdi/RdiWizard.tsx`** — 6-step wizard with progress indicator, accessibility (ARIA live regions, progressbar role), loading/error states, and push flow.
- **`webview-ui/src/components/rdi/RdiStepOverview.tsx`** — Title, iteration path, area path, assignee, target date.
- **`webview-ui/src/components/rdi/RdiStepPbiLinks.tsx`** — Add/remove PBI IDs that become ADO parent-child links on push.
- **`webview-ui/src/components/rdi/RdiStepReleaseNotes.tsx`** — Free-text release notes textarea.
- **`webview-ui/src/components/rdi/RdiStepDeployment.tsx`** — Table of deployment artifacts (app, repo URL, build URL, version) + applications string.
- **`webview-ui/src/components/rdi/RdiStepBackout.tsx`** — Backout strategy, owner, estimated time.
- **`webview-ui/src/components/rdi/RdiStepDbChanges.tsx`** — Manual DB changes with SQL/rollback scripts + full review panel before push.
- **`webview-ui/src/components/rdi/RdiList.tsx`** — Draft list with status badges, open/delete actions.
- **`webview-ui/src/components/rdi/RdiTab.tsx`** — Tab host: list ↔ wizard navigation.
- **`webview-ui/src/components/rdi/rdi-wizard.css`** — Wizard, list, progress, and review styles.
- **`webview-ui/src/App.tsx`** + **`webview-ui/src/components/Sidebar.tsx`** — "RDIs" tab wired into the sidebar.

### Tests
- **`src/test/rdiDraftService.unit.test.ts`** — 12 tests covering CRUD, ID uniqueness, timestamps, and edge cases.
- **`src/test/adoService.rdi.unit.test.ts`** — 17 tests covering HTML description builder, ADO patch structure, PBI links, `getDefaultIteration`, error handling.
- **`webview-ui/src/components/rdi/RdiList.unit.test.tsx`** — 9 tests covering loading state, empty state, rows, status badges, New/Open/Delete interactions.
- **`webview-ui/src/hooks/useRdiDraft.unit.test.ts`** — 14 tests covering initial state and all message events.

### Docs
- **`docs/architecture/feature-41-rdi-creation.md`** — Architecture proposal + `## Implementation Status` section with decisions and known gaps.
- **`docs/design/feature-41-rdi-ux-spec.md`** — UX design spec.
- **`.squad/decisions/decisions.md`** — Decision records for Q1–Q5.

---

## Decisions Made

| # | Question | Decision |
|---|----------|----------|
| Q1 | Work Item Type | Free-text `workItemTitle`; ADO type string `"Release Deployment Item"` — org must have this custom type configured |
| Q2 | PBI Linking | Full ADO parent-child relations via `System.LinkTypes.Hierarchy-Reverse` patches in `pushRdi()` |
| Q3 | RDI list location | Dedicated **"RDIs"** sidebar tab, separate from PBI Studio |
| Q4 | Iteration pre-population | `getDefaultIteration()` called on wizard open; Step 1 auto-fills from ADO default |
| Q5 | Applications list | Free-text comma-separated string — no ADO tag lookup at this stage |

---

## Known Limitations / Follow-on Work

- **DashboardPanel integration tests** not written — handlers are covered only through `rdiDraftService` and `adoService` unit tests. Consider adding integration tests against a mock extension host.
- **Wizard step component tests** (`RdiStepOverview` etc.) not written — covered implicitly via `RdiWizard` behaviour. Could add dedicated tests if step logic grows.
- **Live ADO network tests** — `pushRdi()` and `getDefaultIteration()` use injected mock connections only; live integration tests would require a test ADO org.
- **Custom ADO work item type** — If the org does not have a "Release Deployment Item" type, the push will fail with an ADO validation error. A fallback to `"Feature"` or a user-selectable type could be added.
- **`applications` field** — Currently free-text. A future iteration could pull from ADO area paths or existing work item tags.

---

## Testing Notes

**52 tests total** — all passing, clean build.

| Suite | Count | Covers |
|---|---|---|
| `rdiDraftService.unit.test.ts` | 12 | CRUD, persistence, timestamps, ID uniqueness, edge cases |
| `adoService.rdi.unit.test.ts` | 17 | HTML builder sections, ADO patch fields, PBI link relations, `getDefaultIteration`, error propagation |
| `RdiList.unit.test.tsx` | 9 | Loading/empty state, draft rows, status badges, New/Open/Delete callbacks |
| `useRdiDraft.unit.test.ts` | 14 | Initial state, all 7 inbound message types, `deleteDraft` optimistic update |

**Not covered by tests:**
- `DashboardPanel` RDI handler cases (no extension host test harness)
- Individual wizard step components (`RdiStepOverview`, `RdiStepPbiLinks`, etc.)
- Live ADO network calls

---

Closes #41
