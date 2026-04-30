# Architecture Proposal: Feature 41 — RDI Creation

**Author:** Danny (Lead)  
**Date:** 2026-05-01  
**Status:** Proposed  
**Issue:** [#41 — Feature 7: Create RDI with all required details](https://github.com/ltnguyenJha/PO-Professional-Tools/issues/41)

---

## 1. Feature Scope

### In Scope
- A dedicated **RDI Wizard** (multi-step) accessible from the PBI Studio dashboard
- Capture all required RDI fields: title, associated PBI links, internal release notes, external release notes, backout strategy, deployment details (repo URLs, build URLs), manual database change scripts, and applications involved
- Push the completed RDI to Azure DevOps as a new work item of a configurable type (default: `Feature` or a custom "RDI" work item type — user-selectable from existing `AdoWorkItemType` options in settings)
- Draft persistence: RDIs saved as a new `RdiDraft` entity in extension state (parallel to `PbiDraft`), supporting draft/ready/pushed lifecycle
- Navigate to the created ADO work item URL on success (toast with link, same as PBI push)

### Out of Scope (this issue)
- AI-assisted generation of RDI fields (can be added post-MVP)
- Linking the RDI work item to PBI work items via ADO parent-child relations at push time (follow-on issue: requires PBI to already be pushed and have an `adoWorkItemId`)
- Attachment uploads for RDIs (can reuse `PbiAttachment` mechanism in a follow-on)
- Bulk RDI creation
- RDI templates stored in ADO or external systems

---

## 2. New Components Needed

### Webview UI (React — `webview-ui/src/components/`)

| Component | Purpose |
|---|---|
| `RdiWizard.tsx` | Orchestrator — mirrors `FeatureWizard.tsx`; manages step state, draft load/save, step navigation |
| `RdiWizardStep1Overview.tsx` | Step 1 — Title, release name, ADO iteration/area, targeted applications |
| `RdiWizardStep2PbiLinks.tsx` | Step 2 — Associated PBI IDs (repeating input list): ADO work item IDs + optional display label |
| `RdiWizardStep3ReleaseNotes.tsx` | Step 3 — Internal release notes (rich textarea) + External release notes (rich textarea) |
| `RdiWizardStep4Deployment.tsx` | Step 4 — Repo URL(s), Build URL(s), deployment environment targets |
| `RdiWizardStep5BackoutStrategy.tsx` | Step 5 — Backout plan (textarea), rollback steps, estimated rollback time |
| `RdiWizardStep6DbChanges.tsx` | Step 6 — Manual DB change scripts/notes; flag: "No DB changes" checkbox |
| `RdiWizardStep7Review.tsx` | Step 7 — Read-only summary of all fields before push; "Push to ADO" CTA |

### New View

Add an `RdiStudio` entry point view under `webview-ui/src/views/` (similar to `PbiStudio.tsx`) — or integrate as a tab within the existing Dashboard sidebar. **Recommended: sidebar tab** ("RDIs") to match existing navigation patterns.

---

## 3. New Message Types

### Additions to `src/shared/messages.ts` and `webview-ui/src/types.ts`

#### New Interfaces

```typescript
/** A single associated PBI reference within an RDI. */
export interface RdiPbiLink {
  adoWorkItemId: number;
  label?: string;  // optional display name (e.g. "User Story: Login flow")
  url?: string;    // resolved ADO URL (populated post-push)
}

/** A deployment target entry (repo + build). */
export interface RdiDeploymentDetail {
  applicationName: string;
  repoUrl: string;
  buildUrl: string;
  environment: string;  // e.g. "Production", "UAT"
}

export type RdiStatus = 'draft' | 'ready' | 'pushed';

/** The full RDI data model. */
export interface RdiDraft {
  id: string;
  title: string;
  releaseName: string;
  iterationPath?: string;
  areaPath?: string;
  targetedApplications: string[];          // list of application names
  associatedPbis: RdiPbiLink[];
  internalReleaseNotes: string;
  externalReleaseNotes: string;
  backoutStrategy: string;
  rollbackSteps: string[];
  estimatedRollbackMinutes?: number;
  deploymentDetails: RdiDeploymentDetail[];
  dbChanges: string;                       // SQL/scripts or "No DB changes"
  hasDbChanges: boolean;
  status: RdiStatus;
  adoWorkItemId?: number;
  adoWorkItemUrl?: string;
  updatedAt?: string;
  workItemType?: AdoWorkItemType;          // default: 'Feature'
}
```

#### New `WebviewRequest` union members

```typescript
| { type: 'CREATE_RDI_DRAFT'; payload?: { title?: string } }
| { type: 'UPDATE_RDI_DRAFT'; payload: { draft: RdiDraft } }
| { type: 'DELETE_RDI_DRAFT'; payload: { rdiId: string } }
| { type: 'PUSH_RDI_TO_ADO'; payload: { rdiId: string; draft?: RdiDraft } }
| { type: 'RDI_WIZARD_LOAD'; payload: { rdiId: string } }
| { type: 'RDI_WIZARD_STEP_CHANGE'; payload: { rdiId: string; targetStep: number } }
| { type: 'RDI_WIZARD_SAVE'; payload: { rdiId: string; partialDraft: Partial<RdiDraft>; currentStep: number } }
```

#### New `ExtensionEvent` union members

```typescript
| { type: 'RDI_DRAFT_CREATED'; payload: { rdiId: string } }
| { type: 'RDI_WIZARD_LOADED'; payload: { draft: RdiDraft; currentStep: number } }
| { type: 'RDI_WIZARD_STEP_CHANGED'; payload: { currentStep: number; draft: RdiDraft } }
| { type: 'RDI_PUSH_RESULT'; payload: { rdiId: string; adoWorkItemId: number; adoWorkItemUrl: string } }
```

#### New `AppStatePayload` field

```typescript
rdiDrafts: RdiDraft[];   // added alongside pbiDrafts
```

---

## 4. New Backend Handlers

### `DashboardPanel.ts` — new `handleMessage` cases

```typescript
case 'CREATE_RDI_DRAFT':     → handleCreateRdiDraft(payload)
case 'UPDATE_RDI_DRAFT':     → handleUpdateRdiDraft(payload.draft)
case 'DELETE_RDI_DRAFT':     → handleDeleteRdiDraft(payload.rdiId)
case 'PUSH_RDI_TO_ADO':      → handlePushRdiToAdo(payload.rdiId, payload.draft)
case 'RDI_WIZARD_LOAD':      → handleRdiWizardLoad(payload.rdiId)
case 'RDI_WIZARD_STEP_CHANGE': → handleRdiWizardStepChange(payload)
case 'RDI_WIZARD_SAVE':      → handleRdiWizardSave(payload)
```

### New `RdiDraftService` (`src/services/rdiDraftService.ts`)

Mirrors `PbiDraftService` — stores `RdiDraft[]` in `context.workspaceState` under key `'rdiDrafts'`.

Methods:
- `create(partial?: Partial<RdiDraft>): RdiDraft`
- `getAll(): RdiDraft[]`
- `getById(id: string): RdiDraft | undefined`
- `update(draft: RdiDraft): void`
- `delete(id: string): void`
- `saveStep(id: string, partialDraft: Partial<RdiDraft>, currentStep: number): RdiDraft`

### `AdoService` — new method `pushRdi()`

```typescript
public async pushRdi(
  settings: AdoSettings,
  pat: string,
  rdi: RdiDraft
): Promise<PushItemResult>
```

Builds a JSON patch document for the RDI work item (see Section 6 for field mapping), calls `witApi.createWorkItem()`.

No changes to `CopilotService` — RDIs are PO-authored, not AI-generated (AI assist is out of scope for MVP).

---

## 5. ADO Integration Approach

**Use the existing `AdoService` + `azure-devops-node-api` — no new ADO service needed.**

### RDI Work Item Type

Use `AdoWorkItemType` from existing settings. Default to `'Feature'` unless the org has a custom "Release Deployment Item" process template type. Surface a selector in Step 1 of the wizard (same `DropdownWithFallback` pattern used for ADO Teams).

### Field Mapping (ADO Work Item Fields)

| RDI Field | ADO Field |
|---|---|
| `title` | `System.Title` |
| `releaseName` | Embedded in `System.Description` header |
| `iterationPath` | `System.IterationPath` |
| `areaPath` | `System.AreaPath` |
| `internalReleaseNotes` | `System.Description` section (HTML) |
| `externalReleaseNotes` | `System.Description` section (HTML) |
| `backoutStrategy` + `rollbackSteps` | `System.Description` section (HTML) |
| `deploymentDetails` | `System.Description` section (HTML table) |
| `dbChanges` | `System.Description` section (HTML) |
| `associatedPbis` | `System.Description` links section + optionally `System.Links` relations |
| `targetedApplications` | `System.Tags` (semicolon-delimited) + `System.Description` |

### PBI Relations in ADO (MVP)

For MVP: embed PBI IDs as hyperlinks inside `System.Description` (HTML `<a>` tags pointing to ADO work item URLs). Full ADO relation links (parent-child hierarchy) are a follow-on.

### HTML Description Template

```html
<h2>Release: {releaseName}</h2>
<h3>Applications Involved</h3>
<p>{targetedApplications.join(', ')}</p>
<h3>Associated PBIs</h3>
<ul>{associatedPbis.map(p => <li><a href="{adoOrgUrl}/_workitems/edit/{p.adoWorkItemId}">{p.label || p.adoWorkItemId}</a></li>)}</ul>
<h3>Internal Release Notes</h3>
<p>{internalReleaseNotes}</p>
<h3>External Release Notes</h3>
<p>{externalReleaseNotes}</p>
<h3>Deployment Details</h3>
<table>...</table>
<h3>Backout Strategy</h3>
<p>{backoutStrategy}</p>
<ul>{rollbackSteps.map(s => <li>s</li>)}</ul>
<h3>Database Changes</h3>
<p>{hasDbChanges ? dbChanges : 'No database changes required.'}</p>
<h3>PO Tools Metadata</h3>
<p>Created by PO Professional Tools — RDI Wizard</p>
```

---

## 6. Wizard Flow

Reuses `FeatureWizard` orchestrator pattern exactly: step array, `WIZARD_DRAFT_LOAD` → `WIZARD_DRAFT_LOADED`, `WIZARD_STEP_CHANGE` → `WIZARD_STEP_CHANGED`, `WIZARD_DRAFT_SAVE` (debounced on blur), explicit save on Next.

**Steps (7 total):**

| # | Step Name | Key Fields | Notes |
|---|---|---|---|
| 1 | Overview | Title, Release Name, Work Item Type, Iteration, Area Path, Applications | Dropdowns for Iteration/Area reuse `FETCH_ADO_ITERATIONS` / `FETCH_ADO_AREA_PATHS` |
| 2 | Associated PBIs | PBI ID list (add/remove), optional display labels | Repeating field with `ListEditor`-style pattern |
| 3 | Release Notes | Internal notes (textarea), External notes (textarea) | Two independent rich text areas |
| 4 | Deployment Details | Repeating rows: App name, Repo URL, Build URL, Environment | Add/remove rows dynamically |
| 5 | Backout Strategy | Backout plan (textarea), Rollback steps (list), Est. time (number input) | Step list uses `ListEditor` pattern |
| 6 | DB Changes | Toggle "Has DB changes", DB change notes/scripts (textarea) | Conditional visibility based on toggle |
| 7 | Review & Push | Read-only summary of all fields | "Push to ADO" primary CTA; "Edit" link per section |

**Progress indicator:** Same horizontal rail + numbered circles as `FeatureWizard`. Steps always visible; back-navigation allowed to any completed step.

---

## 7. Data Model

```typescript
interface RdiDraft {
  // Identity
  id: string;                        // UUID
  title: string;                     // Required: work item title
  releaseName: string;               // e.g. "Sprint 42 Release" or "v2.5.0"
  status: RdiStatus;                 // 'draft' | 'ready' | 'pushed'
  workItemType?: AdoWorkItemType;    // default 'Feature'
  updatedAt?: string;                // ISO timestamp

  // ADO routing
  iterationPath?: string;
  areaPath?: string;

  // Step 1: scope
  targetedApplications: string[];   // e.g. ["PayRailz API", "PayRailz Web"]

  // Step 2: PBI traceability
  associatedPbis: RdiPbiLink[];     // { adoWorkItemId, label?, url? }

  // Step 3: notes
  internalReleaseNotes: string;     // For engineering/release team
  externalReleaseNotes: string;     // Customer-facing / comms

  // Step 4: deployment
  deploymentDetails: RdiDeploymentDetail[];  // { applicationName, repoUrl, buildUrl, environment }

  // Step 5: backout
  backoutStrategy: string;          // Narrative description
  rollbackSteps: string[];          // Ordered list
  estimatedRollbackMinutes?: number;

  // Step 6: database
  hasDbChanges: boolean;
  dbChanges: string;                // SQL scripts or "N/A"

  // Post-push
  adoWorkItemId?: number;
  adoWorkItemUrl?: string;
}
```

---

## 8. Work Breakdown

### Phase 0 — Type Alignment (Danny signs off, Linus executes)

**Estimated: 1–2 hours**

1. Add `RdiDraft`, `RdiPbiLink`, `RdiDeploymentDetail`, `RdiStatus` interfaces to `src/shared/messages.ts`
2. Mirror the same additions into `webview-ui/src/types.ts`
3. Add new `WebviewRequest` + `ExtensionEvent` union members (both files)
4. Add `rdiDrafts: RdiDraft[]` to `AppStatePayload` (both files)
5. Run `tsc --noEmit` to validate — zero errors required before proceeding

---

### Linus (Backend) Tasks

**Task L1 — `RdiDraftService`** (2–3 hrs)
- Create `src/services/rdiDraftService.ts` mirroring `PbiDraftService`
- Persist `RdiDraft[]` under `workspaceState` key `'rdi-drafts'`
- Implement `create`, `getAll`, `getById`, `update`, `delete`, `saveStep`

**Task L2 — `AdoService.pushRdi()`** (2–3 hrs)
- Add `buildRdiFieldPatches()` private method mapping `RdiDraft` fields to ADO JSON patches
- Build full HTML description using template from Section 5
- Add `System.Tags` entry: `'RDI;PO-Tools;Release'`
- Add `pushRdi(settings, pat, rdi): Promise<PushItemResult>` public method

**Task L3 — `DashboardPanel` handlers** (2–3 hrs)
- Instantiate `RdiDraftService` in constructor (alongside `draftService`)
- Add 7 new `handleMessage` cases (see Section 4)
- Wire `handleRdiWizardLoad`, `handleRdiWizardStepChange`, `handleRdiWizardSave` to match existing Wizard handler pattern
- Add `rdiDrafts` to `postState()` payload

**Task L4 — Error handling + ADO push progress** (1 hr)
- Wrap `pushRdi()` call in `ADO_PROGRESS` busy/done events (scope: `'single'`)
- Toast on success (with ADO URL link) and on error

**Dependencies:** L1 → L2 → L3 → L4. All require Phase 0 types to be merged first.

---

### Rusty (Frontend) Tasks

**Task R1 — `RdiWizard.tsx` orchestrator** (2–3 hrs)
- Port `FeatureWizard.tsx` patterns: draft load/save, step state, AI progress listener (no AI for MVP — listener can be stubbed)
- Use `RDI_WIZARD_LOAD`, `RDI_WIZARD_STEP_CHANGE`, `RDI_WIZARD_SAVE` message types
- 7-step progress indicator (same `wizard-progress` CSS class)

**Task R2 — Step 1: `RdiWizardStep1Overview.tsx`** (1–2 hrs)
- Title input, Release Name input
- Work Item Type dropdown (reuse `DropdownWithFallback`)
- Applications: multi-value tag input (reuse or extend `ListEditor`)
- Iteration/Area Path dropdowns — trigger `FETCH_ADO_ITERATIONS` / `FETCH_ADO_AREA_PATHS`

**Task R3 — Step 2: `RdiWizardStep2PbiLinks.tsx`** (1–2 hrs)
- Number input for ADO Work Item ID + optional text label
- Add/remove rows (repeating `ListEditor`-style widget)
- Validation: IDs must be positive integers

**Task R4 — Step 3: `RdiWizardStep3ReleaseNotes.tsx`** (1 hr)
- Two labeled textareas: Internal Notes, External Notes
- Blur-save debounce (500ms, same pattern as `WizardStepFeatureDefinition`)

**Task R5 — Step 4: `RdiWizardStep4Deployment.tsx`** (2 hrs)
- Repeating-row editor: Application Name | Repo URL | Build URL | Environment
- Add row / Delete row controls
- URL format hint (not hard validation — environment URLs vary)

**Task R6 — Step 5: `RdiWizardStep5BackoutStrategy.tsx`** (1–2 hrs)
- Backout narrative textarea
- Rollback steps list (`ListEditor` pattern)
- Estimated rollback time: number input (minutes), optional

**Task R7 — Step 6: `RdiWizardStep6DbChanges.tsx`** (1 hr)
- Checkbox: "This release includes database changes"
- Conditional textarea for SQL scripts / notes (only shown when checkbox checked)

**Task R8 — Step 7: `RdiWizardStep7Review.tsx`** (2 hrs)
- Read-only section-per-step summary (collapsible sections optional)
- "Push to ADO" primary button → sends `PUSH_RDI_TO_ADO`
- Listen for `RDI_PUSH_RESULT` → show success toast / navigate to URL
- Listen for `ADO_PROGRESS` to show loading state on button

**Task R9 — Dashboard integration** (1 hr)
- Add "RDIs" sidebar tab in `Sidebar.tsx` (or extend existing navigation)
- Create `RdiStudio.tsx` view listing `rdiDrafts` from `AppStatePayload`
- "New RDI" button → sends `CREATE_RDI_DRAFT` → navigates to `RdiWizard`

**Dependencies:** R1 first (base orchestrator), then R2–R7 in parallel, R8 last (needs all step data), R9 last (needs wizard to be complete). All require Phase 0 types + L3 backend handlers to test end-to-end.

---

## Open Questions (for ltnguyen to resolve before implementation)

1. **Work Item Type:** Should RDIs use an existing `AdoWorkItemType` (e.g. `Feature`) or does the org have a custom "Release Deployment Item" type configured in ADO? If custom, Linus must make the type field a free-text input.
2. **PBI Linking depth:** MVP uses description-embedded links. Is that acceptable, or is ADO parent-child relation linking required at launch?
3. **RDI list in Dashboard:** Should the RDI list be a separate sidebar tab ("RDIs") or integrated into the existing PBI Studio as another section?
4. **Iteration/Sprint context:** Should Step 1 pre-populate Iteration from ADO settings default? Yes/No.
5. **Applications list:** Free-text only, or should it be pulled from ADO tags/areas?

---

## Estimated Total Effort

| Agent | Tasks | Estimated Hours |
|---|---|---|
| Linus (Backend) | L1–L4 | 7–9 hrs |
| Rusty (Frontend) | R1–R9 | 12–15 hrs |
| Danny (Lead) | Phase 0 types + review | 2–3 hrs |
| **Total** | | **21–27 hrs** |

---

## Architecture Decision

**This proposal is READY FOR REVIEW.** No external dependencies. Builds on proven patterns (FeatureWizard, AdoService.pushDrafts, PbiDraftService). Zero breaking changes to existing PBI workflow.

Approval required from **ltnguyen** on the 5 Open Questions before Linus and Rusty begin implementation.

---

## Implementation Status

**All phases complete.** Feature #41 is fully implemented, builds clean, and all 52 tests pass.

### Decisions Made (Q1–Q5)

| # | Question | Decision |
|---|----------|----------|
| Q1 | Work Item Type | Free-text `workItemTitle`; ADO type sent as `"Release Deployment Item"` string — caller must have the custom type configured in their org |
| Q2 | PBI Linking | ADO parent-child relation links implemented via `System.LinkTypes.Hierarchy-Reverse` patches in `pushRdi()` |
| Q3 | RDI list location | Dedicated **"RDIs"** sidebar tab (separate from PBI Studio) |
| Q4 | Iteration pre-population | `getDefaultIteration()` called on wizard open; Step 1 auto-fills from ADO settings default |
| Q5 | Applications list | Free-text comma-separated string; no ADO tag lookup at this stage |

### Known Gaps

- **DashboardPanel integration tests** — RDI handlers are exercised only through unit tests of `RdiDraftService` and `AdoService`. End-to-end extension host tests do not exist yet.
- **Wizard step component tests** — `RdiStepOverview`, `RdiStepPbiLinks`, `RdiStepReleaseNotes`, `RdiStepDeployment`, `RdiStepBackout`, `RdiStepDbChanges` have no dedicated unit tests (tested implicitly through `RdiWizard`).
- **Live ADO network tests** — `pushRdi()` and `getDefaultIteration()` are tested with injected mock connections only; no live network integration tests.
