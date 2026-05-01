# Epic Creation — Full Architecture Specification

**Author:** Basher (Solutions Architect)  
**Input:** `docs/architecture/epic-creation-brief.md` (Danny)  
**Date:** 2026-04-30  
**Status:** IMPLEMENTATION READY  
**Audience:** Linus (backend), Rusty (frontend), Saul (design), Livingston (QA)

---

## 1. Architecture Overview

### Work Item Hierarchy

```
ADO Azure DevOps
│
├── Epic  ← "Strategic Initiative" (EpicDraft)
│   │     WIT: "Epic"
│   │     ADO field: System.WorkItemType = "Epic"
│   │
│   └── Feature  ← "User-Facing Capability" (FeatureDraft)
│       │         WIT: "Feature"
│       │         Link: System.LinkTypes.Hierarchy-Reverse on Feature → Epic
│       │         Back-ref: FeatureDraft.parentEpicId
│       │
│       └── Product Backlog Item / User Story  ← "Implementation Unit" (PbiDraft)
│                                               WIT: "Product Backlog Item"
│                                               Link: System.LinkTypes.Hierarchy-Reverse on PBI → Feature
│                                               Back-ref: PbiDraft.parentFeatureId
```

### ADO Hierarchy Link Mechanics

The `System.LinkTypes.Hierarchy-Reverse` relation is placed on the **child** pointing **up** to the parent. This is identical to the existing Feature→PBI link already shipping in the codebase (`adoService.pushWithParent()` lines 320-330).

```
Feature work item → adds relation:
  { rel: 'System.LinkTypes.Hierarchy-Reverse', url: '<Epic ADO API URL>' }

PBI work item → adds relation:
  { rel: 'System.LinkTypes.Hierarchy-Reverse', url: '<Feature ADO API URL>' }
```

### How the Three Creation Wizards Relate

```
EpicCreationWizard (NEW)
  ├─ Creates EpicDraft (globalState key: 'epicDrafts')
  ├─ Creates FeatureDraft(s) via CREATE_FEATURE_DRAFT (reuses existing handler)
  ├─ Links FeatureDrafts to Epic via parentEpicId
  └─ Navigates to FeatureCreationWizard or PbiStudio for deep editing

FeatureCreationWizard (EXISTING — 'bulk' route)
  ├─ Creates FeatureDraft + child PbiDrafts
  ├─ parentEpicId already on FeatureDraft (field exists in both files ✅)
  └─ Step 2 already shows Epic dropdown for parentEpicId selection ✅

PbiStudio (EXISTING)
  ├─ Edits PbiDraft individually
  └─ parentFeatureId links to FeatureDraft
```

---

## 2. Data Model (FINAL)

### `EpicDraft` Interface

Add this interface to **both** `src/shared/messages.ts` AND `webview-ui/src/types.ts`.

> ⚠️ `webview-ui/src/types.ts` has a **stub** `EpicDraft` with `featureIds: string[]`. Linus must **replace** that stub entirely with this final definition. The field is renamed to `linkedFeatureIds` for semantic clarity.

```typescript
export interface EpicDraft {
  /** Unique local ID. Use `Date.now().toString()` — matches existing FeatureDraft/PbiDraft pattern. */
  id: string;

  /** Epic name. Required. Max 120 chars. E.g., "Mobile-First Redesign". */
  title: string;

  /** High-level narrative (3-5 sentences). Required. Max 2000 chars. */
  description: string;

  /** 3–5 high-level goals or success criteria for this Epic. At least one is required. */
  objectives: string[];

  /**
   * Explicit scope boundary: what is in scope and what is out of scope.
   * Free-text prose. Optional but recommended for AI generation quality.
   */
  scope: string;

  /**
   * IDs of FeatureDraft entries linked to this Epic.
   * Replaces the stub `featureIds` field in the webview types.ts.
   * Mix of AI-generated and manually linked features.
   */
  linkedFeatureIds: string[];

  /**
   * IDs of ImportedProject entries (repo paths) used as AI context
   * during Feature generation in Step 3 of the wizard.
   * Same mechanic as FeatureDraft.repoIds.
   */
  selectedRepoIds: string[];

  /**
   * Lifecycle state of the Epic.
   * - 'draft'   : Being edited; not ready to push.
   * - 'ready'   : All linked Features are at status 'ready' or 'pushed'.
   * - 'partial' : Epic pushed to ADO but ≥1 linked Feature not yet pushed.
   * - 'pushed'  : Epic pushed AND all linked Features pushed.
   */
  status: HierarchyStatus;

  /**
   * Azure DevOps work item ID — set after a successful PUSH_EPIC_TO_ADO.
   * Undefined until pushed.
   */
  adoId?: number;

  /**
   * Browser URL to the ADO work item (e.g., https://dev.azure.com/org/project/_workitems/edit/42).
   * Set alongside adoId after push.
   */
  adoUrl?: string;

  /** ISO 8601 timestamp. Set once at creation; never updated. */
  createdAt: string;

  /** ISO 8601 timestamp. Updated on every mutation. */
  updatedAt: string;

  /**
   * Optional estimated story point total across all linked Features.
   * Manual entry only in Phase 1. Auto-calc from children is Phase 2 scope.
   */
  estimatedVelocity?: number;

  /**
   * Flag indicating that linkedFeatureIds were populated (at least partially)
   * by the AI generation in Step 3 of the wizard.
   * Informational only — does not affect push behaviour.
   */
  aiGeneratedFeatures?: boolean;

  /**
   * ISO date string (YYYY-MM-DD). Optional target completion date.
   * Maps to Microsoft.VSTS.Scheduling.TargetDate in ADO if populated.
   */
  targetDate?: string;
}
```

### `FeatureDraft` Updates

`FeatureDraft.parentEpicId?: string` **already exists** in both `src/shared/messages.ts` (line 35) and `webview-ui/src/types.ts` (line 36). **No changes needed to this field.**

`webview-ui/src/types.ts` is also missing `adoWorkItemUrl?: string` that `src/shared/messages.ts` has. Linus should add it during the Epic pass.

### `AppStatePayload` Update

**`src/shared/messages.ts`** — currently missing `epicDrafts`. Linus must add:

```typescript
export interface AppStatePayload {
  projects: ImportedProject[];
  linkTargets?: ImportedProject[];
  pbiDrafts: PbiDraft[];
  rdiDrafts: RdiDraft[];
  featureDrafts: FeatureDraft[];
  epicDrafts: EpicDraft[];          // ← ADD THIS (required, not optional)
  adoSettings?: AdoSettings;
  uiSettings: UiSettings;
  hasAdoPat: boolean;
}
```

**`webview-ui/src/types.ts`** — already has `epicDrafts?: EpicDraft[]` but it must become **required** `epicDrafts: EpicDraft[]`. EMPTY_STATE in App.tsx already initialises it to `[]` ✅.

---

## 3. Message Type Contracts (COMPLETE)

### Design Principle

Epic messages follow the exact same pattern as Feature messages — `WebviewRequest` for UI→Extension, `ExtensionEvent` for Extension→UI. No separate GET request is needed: `STATE_UPDATED` carries all epic drafts, same as features.

### 3.1 WebviewRequest Additions

Add to the `WebviewRequest` union in both `src/shared/messages.ts` AND `webview-ui/src/types.ts`:

```typescript
// ─── Epic Draft CRUD ──────────────────────────────────────────────────────────

/**
 * Create a new EpicDraft. Extension generates id, createdAt, updatedAt, status='draft'.
 * Side effect: appends to globalState['epicDrafts'], posts STATE_UPDATED + EPIC_DRAFT_CREATED.
 */
| {
    type: 'CREATE_EPIC_DRAFT';
    payload: {
      title: string;
      description: string;
      objectives: string[];
      scope: string;
      linkedFeatureIds: string[];
      selectedRepoIds: string[];
      estimatedVelocity?: number;
      targetDate?: string;
      aiGeneratedFeatures?: boolean;
    };
  }

/**
 * Full replace of an existing EpicDraft. Extension stamps updatedAt.
 * Side effect: updates globalState['epicDrafts'][epicId], posts STATE_UPDATED + EPIC_DRAFT_UPDATED.
 * Also recalculates status based on linked features' hierarchyStatus.
 */
| { type: 'UPDATE_EPIC_DRAFT'; payload: EpicDraft }

/**
 * Delete an EpicDraft by ID.
 * Side effect: removes from globalState['epicDrafts'];
 *   sets parentEpicId=undefined on all linked FeatureDrafts (orphans them, does not delete);
 *   posts STATE_UPDATED + EPIC_DRAFT_DELETED.
 */
| { type: 'DELETE_EPIC_DRAFT'; payload: { epicId: string } }

// ─── Epic ↔ Feature Relationship ─────────────────────────────────────────────

/**
 * Associate an existing FeatureDraft with an Epic.
 * Side effect: adds featureId to Epic.linkedFeatureIds;
 *   sets FeatureDraft.parentEpicId = epicId;
 *   posts STATE_UPDATED + EPIC_DRAFT_UPDATED.
 */
| { type: 'LINK_FEATURE_TO_EPIC'; payload: { epicId: string; featureId: string } }

/**
 * Remove a FeatureDraft from an Epic (orphans the feature; does NOT delete it).
 * Side effect: removes featureId from Epic.linkedFeatureIds;
 *   sets FeatureDraft.parentEpicId = undefined;
 *   recalculates Epic.status;
 *   posts STATE_UPDATED + EPIC_DRAFT_UPDATED.
 */
| { type: 'UNLINK_FEATURE_FROM_EPIC'; payload: { epicId: string; featureId: string } }

// ─── Epic ADO Push ────────────────────────────────────────────────────────────

/**
 * Push the Epic to ADO as a work item of type "Epic".
 * If pushChildren=true: also push any linked FeatureDraft(s) that are not yet pushed,
 *   and add hierarchy links from each Feature to the Epic.
 * If pushChildren=false: create the Epic only; set status='partial' if features exist unpushed.
 *
 * Side effects:
 *   - Creates ADO work item (type: "Epic")
 *   - Sets EpicDraft.adoId, EpicDraft.adoUrl, EpicDraft.status
 *   - For each pushed Feature: sets FeatureDraft.adoWorkItemId + hierarchy link
 *   - Posts EPIC_PUSH_PROGRESS during operation
 *   - Posts EPIC_PUSHED on success
 *   - Posts STATE_UPDATED after completion
 */
| {
    type: 'PUSH_EPIC_TO_ADO';
    payload: {
      epicId: string;
      /** If true, push all linked Features that are not yet pushed. Defaults to false. */
      pushChildren: boolean;
    };
  }

// ─── Epic AI Feature Generation ───────────────────────────────────────────────

/**
 * Ask the AI to generate N FeatureDraft suggestions from the Epic context.
 * Does NOT immediately create FeatureDrafts — returns suggestions for user review first.
 *
 * Side effects: posts AI_PROGRESS (busy=true), then EPIC_GENERATION_COMPLETE or EPIC_GENERATION_ERROR.
 * Does NOT modify globalState until user confirms in Step 4 → Step 5.
 */
| {
    type: 'GENERATE_FEATURES_FROM_EPIC';
    payload: {
      epicId: string;
      /** Title + description + objectives + scope — AI context. */
      title: string;
      description: string;
      objectives: string[];
      scope: string;
      selectedRepoIds: string[];
      /** Target number of features to generate. Default: 5. Range: 1–10. */
      featureCount?: number;
    };
  }
```

### 3.2 ExtensionEvent Additions

Add to the `ExtensionEvent` union in both `src/shared/messages.ts` AND `webview-ui/src/types.ts`:

```typescript
// ─── Epic Draft CRUD Events ───────────────────────────────────────────────────

/**
 * Fired after successful CREATE_EPIC_DRAFT.
 * Carries the full new EpicDraft so wizard can navigate to it.
 */
| { type: 'EPIC_DRAFT_CREATED'; payload: EpicDraft }

/**
 * Fired after UPDATE_EPIC_DRAFT, LINK_FEATURE_TO_EPIC, UNLINK_FEATURE_FROM_EPIC.
 * Carries the full updated EpicDraft.
 */
| { type: 'EPIC_DRAFT_UPDATED'; payload: EpicDraft }

/**
 * Fired after DELETE_EPIC_DRAFT. Carries only the deleted ID.
 */
| { type: 'EPIC_DRAFT_DELETED'; payload: { epicId: string } }

// ─── Epic AI Generation Events ────────────────────────────────────────────────

/**
 * Fired when AI successfully generates Feature suggestions.
 * Suggestions are NOT yet saved as FeatureDrafts — they live in wizard local state
 * until user confirms in Step 5.
 */
| {
    type: 'EPIC_GENERATION_COMPLETE';
    payload: {
      epicId: string;
      /** Array of suggested features. Each has a temporary clientId for list key tracking. */
      suggestions: Array<{
        clientId: string;    // temporary ID (Date.now() + index), discarded after confirmation
        title: string;
        description: string;
      }>;
    };
  }

/**
 * Fired when AI generation fails (model error, cancelled, etc.).
 */
| {
    type: 'EPIC_GENERATION_ERROR';
    payload: {
      epicId: string;
      message: string;
    };
  }

// ─── Epic ADO Push Events ─────────────────────────────────────────────────────

/**
 * Progress during PUSH_EPIC_TO_ADO. Fired once per major operation step.
 * Phase 'epic': creating the Epic work item.
 * Phase 'features': pushing linked Features one by one.
 */
| {
    type: 'EPIC_PUSH_PROGRESS';
    payload: {
      epicId: string;
      phase: 'epic' | 'features';
      current: number;
      total: number;
      message: string;
    };
  }

/**
 * Fired on successful completion of PUSH_EPIC_TO_ADO.
 * hierarchyStatus reflects final state ('pushed' or 'partial').
 * linkedFeatureAdoIds maps featureDraftId → ADO work item ID for features that were pushed.
 */
| {
    type: 'EPIC_PUSHED';
    payload: {
      epicId: string;
      adoWorkItemId: number;
      adoWorkItemUrl: string;
      /** Map of featureDraftId → adoWorkItemId for features pushed in this operation. */
      linkedFeatureAdoIds: Record<string, number>;
      hierarchyStatus: HierarchyStatus;
    };
  }
```

### 3.3 Existing Discrepancy — Linus Must Resolve

During Phase 1, also reconcile these **existing inconsistencies** between the two type files (found during spec research):

| Event | `src/shared/messages.ts` | `webview-ui/src/types.ts` | Resolution |
|---|---|---|---|
| `FEATURE_DRAFT_CREATED` | `payload: FeatureDraft` | `payload: { featureId: string }` | Use `payload: FeatureDraft` (backend already sends full draft) |
| `FEATURE_DRAFT_UPDATED` | `payload: FeatureDraft` | `payload: { featureDraft: FeatureDraft }` | Use `payload: FeatureDraft` (remove nesting) |
| `FEATURE_PUSH_PROGRESS` | `{ progress, total }` | `{ phase, current, total, message }` | Use `{ phase, current, total, message }` (richer, matches App.tsx state type) |
| `FEATURE_PUSHED` | `{ childAdoIds, hierarchyStatus }` | `{ childCount, failedIds? }` | Use `{ adoWorkItemId?, childAdoIds, hierarchyStatus }` (messages.ts is more complete) |
| `FeatureDraft.adoWorkItemUrl` | Missing in messages.ts | Present in types.ts | Add to messages.ts |

---

## 4. ADO Integration Contract

### Epic Work Item Type

```typescript
const EPIC_WORK_ITEM_TYPE = 'Epic'; // matches AdoWorkItemType union — already in both files ✅
```

### ADO Fields to Populate (Epic)

```typescript
const epicFields: PatchEntry[] = [
  { op: 'add', path: '/fields/System.Title',                    value: epic.title },
  { op: 'add', path: '/fields/System.Description',              value: `<p>${epic.description}</p>` },
  { op: 'add', path: '/fields/Microsoft.VSTS.Common.ValueArea', value: 'Business' },
  { op: 'add', path: '/fields/System.Tags',                     value: 'AI Generated;PO-Tools' },
];
// Conditional fields:
if (settings.areaPath)       fields.push({ op: 'add', path: '/fields/System.AreaPath',      value: settings.areaPath });
if (settings.iterationPath)  fields.push({ op: 'add', path: '/fields/System.IterationPath', value: settings.iterationPath });
if (epic.targetDate)         fields.push({ op: 'add', path: '/fields/Microsoft.VSTS.Scheduling.TargetDate', value: epic.targetDate });
```

### Push Order (PUSH_EPIC_TO_ADO)

```
Step 1: Create Epic work item in ADO
        → GET adoEpicUrl = `${orgUrl}/_apis/wit/workItems/${epicItem.id}`
        → Store EpicDraft.adoId = epicItem.id, EpicDraft.adoUrl = epicItem._links.html.href

Step 2 (if pushChildren=true): For each linkedFeatureId:
  2a. Load FeatureDraft from globalState
  2b. If FeatureDraft.adoWorkItemId is already set → skip push, use existing ADO ID
  2c. If not yet pushed → call pushFeatureHierarchy() (reuse existing method)
      → this creates Feature work item + all child PBIs with Hierarchy-Reverse links

Step 3: For each pushed Feature (whether just-pushed or already-pushed):
        Add hierarchy link on Feature → Epic:
        PATCH /wit/workItems/{featureAdoId}
        { op: 'add', path: '/relations/-',
          value: { rel: 'System.LinkTypes.Hierarchy-Reverse', url: adoEpicUrl } }

Step 4: Update EpicDraft.status:
        - All linked features pushed → 'pushed'
        - Epic pushed, some features not → 'partial'
        - Epic push failed → leave as 'draft' (toast error, no state change)
```

### New `adoService.ts` Method

```typescript
export interface EpicPushResult {
  epicWorkItemId: number;
  epicWorkItemUrl: string;
  featureResults: Array<{
    featureId: string;
    adoWorkItemId: number;
    linked: boolean;          // true if hierarchy link was added
  }>;
  featureErrors: Array<{ featureId: string; message: string }>;
}

public async pushEpicHierarchy(
  settings: AdoSettings,
  pat: string,
  epic: EpicDraft,
  linkedFeatures: FeatureDraft[],   // only the features to push/link; already-pushed ones just get linked
  pushChildren: boolean
): Promise<EpicPushResult>
```

The method follows the exact pattern of `pushFeatureHierarchy()` — create parent, iterate children, add reverse hierarchy relations.

---

## 5. Storage Contract

### globalState Keys

| Key | Type | Notes |
|---|---|---|
| `epicDrafts` | `EpicDraft[]` | New key. Read via `getEpicDrafts()`, written via `saveEpicDrafts()` — mirror the existing `featureDrafts` methods exactly. |
| `featureDrafts` | `FeatureDraft[]` | Existing. The `parentEpicId?` field is already present — no migration required. Existing entries without `parentEpicId` are treated as orphaned features. |

### Migration

**No migration script needed.** All new Epic fields are optional or initialised at creation time. Existing `featureDrafts` without `parentEpicId` are simply "orphaned" features — they appear in the Dashboard's "Orphaned Features" section.

### `postState()` in DashboardPanel.ts

Linus must add `epicDrafts` to the payload in `postState()` (line 1712):

```typescript
private async postState(): Promise<void> {
  const pat = await this.secretStorage.getAdoPat();
  const payload: ExtensionEvent = {
    type: 'STATE_UPDATED',
    payload: {
      projects: this.importService.getProjects(),
      linkTargets: await this.importService.getLinkTargets(),
      pbiDrafts: this.draftService.getAll(this.context.globalState),
      rdiDrafts: this.rdiDraftService.listDrafts(this.context.globalState),
      featureDrafts: this.getFeatureDrafts(),
      epicDrafts: this.getEpicDrafts(),           // ← ADD THIS
      adoSettings: this.settingsService.getAdoSettings(),
      uiSettings: this.settingsService.getUiSettings(),
      hasAdoPat: Boolean(pat && pat.length > 0)
    }
  };
  this.panel.webview.postMessage(payload);
}
```

### New Persistence Methods (DashboardPanel.ts)

```typescript
private getEpicDrafts(): EpicDraft[] {
  return this.context.globalState.get<EpicDraft[]>('epicDrafts', []);
}

private async saveEpicDrafts(epics: EpicDraft[]): Promise<void> {
  await this.context.globalState.update('epicDrafts', epics);
}
```

---

## 6. Epic Creation Wizard — 5-Step Flow (FINAL)

### Resolved Questions

- **Step 3 optional?** YES. User may skip AI generation and proceed to Step 4 with an empty features list, then add features manually. A "Skip AI Generation" secondary button appears on Step 3.
- **Features auto-created or suggested?** Suggestions only — no FeatureDrafts created until user clicks "Save as Draft" or "Push to ADO" on Step 5.
- **Drag-to-reorder?** Not in Phase 1. Features in Step 4 are in array order; user can remove and re-add to reorder.
- **Feature count default?** 5 features (shown via number input on Step 3, range 1–10).
- **Pre-fill on edit?** When `focusEpicId` is set, wizard loads existing EpicDraft and pre-populates all fields. Step defaults to Step 1. No step locking — user can revisit any completed step.

### Steps

#### Step 1: Epic Overview

**Component:** `Step1Overview`

| Field | Required | Validation | Notes |
|---|---|---|---|
| `title` | ✅ | min 3 chars, max 120 | Same pattern as FeatureCreationWizard Step 1 |
| `description` | ✅ | min 10 chars, max 2000 | Textarea, 4 rows |
| `scope` | ❌ | max 1000 | Textarea: "What's in scope / what's out of scope" |
| `objectives` | ✅ (≥1) | max 5 items, each max 200 chars | Bullet-point list editor (add/remove items). Uses `<ListEditor>` component (already exists) |

**Validation gate to Step 2:** title (≥3 chars) AND at least one objective.

**Hierarchy info box:** Show "Epic → Feature → PBI" info box (mirror `WorkItemHierarchyBox` from FeatureCreationWizard).

---

#### Step 2: Context & Repos

**Component:** `Step2Context`

Identical to FeatureCreationWizard Step 2. Reuse the same component shape:
- Multi-select repo list from `appState.linkTargets`
- Each repo selectable independently (`repo.path` as key — matches existing pattern)
- `selectedRepoIds` local state
- Optional: Parent Epic is NOT selectable here (you're already creating an Epic)

**No validation gate:** user may proceed with 0 repos selected.

---

#### Step 3: AI Feature Generation

**Component:** `Step3Generation`

```
┌─ AI Feature Generator ─────────────────────────────────────────────────┐
│ How many features should the AI generate?                               │
│ [  5  ] (number input, 1–10)                          [Generate ▶]     │
│                                                                         │
│ — or —                                                [Skip →]         │
│                                                                         │
│ [AI generates here — LoadingBar while in progress]                     │
│                                                                         │
│ Suggestions appear below after generation:                              │
│ ┌─ Feature 1 ────────────────────────────────────────────────────────┐ │
│ │ Title: [editable inline]                                          │ │
│ │ Description: [editable inline, 2 rows]                            │ │
│ │                                              [✕ Remove]           │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│ [+ Add Feature manually]                                                │
└─────────────────────────────────────────────────────────────────────────┘
```

**Messages:**
- "Generate" button → `GENERATE_FEATURES_FROM_EPIC` with full epic context
- AI_PROGRESS (busy=true) → show LoadingBar
- EPIC_GENERATION_COMPLETE → populate `localSuggestions` state array
- EPIC_GENERATION_ERROR → show inline error toast; keep "Retry" button
- "Skip" button → navigate to Step 4 with empty suggestions

**Local state (transient, not persisted):**
```typescript
interface LocalFeatureSuggestion {
  clientId: string;       // Date.now() + index — used as React key
  title: string;
  description: string;
  isEditing: boolean;     // inline edit mode flag
}
```

**Validation gate to Step 4:** None. User may proceed with 0 suggestions.

---

#### Step 4: Review & Edit

**Component:** `Step4Review`

```
┌─ Features for this Epic ─────────────────────────────────────────────────┐
│ 3 features will be created                                               │
│                                                                          │
│ ▼ Feature 1: Auth Flow                                                   │
│   [Description text]                                 [Edit] [Remove]     │
│                                                                          │
│ ▼ Feature 2: Offline Mode                                                │
│   [Description text]                                 [Edit] [Remove]     │
│                                                                          │
│ [+ Add Feature]                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

- Each feature in the `localSuggestions` array is shown in a collapsible accordion
- **Edit** → inline editing (title + description fields, same compact style as FeatureCreationWizard Step 4)
- **Remove** → removes from `localSuggestions` (no confirmation required; user is reviewing drafts, not deleting saved data)
- **+ Add Feature** → appends a blank `{ clientId, title: '', description: '', isEditing: true }` entry
- Summary count at top: `"N features will be created"`
- If 0 features: show "No features linked yet — you can add features manually or return to Step 3 to generate." (non-blocking; user can still Save as Draft)

**Validation gate to Step 5:** None.

---

#### Step 5: Confirm & Save

**Component:** `Step5Confirm`

```
┌─ Summary ───────────────────────────────────────────────────────────────┐
│ Epic: "Mobile-First Redesign"                                           │
│ Features: 3 will be created                                             │
│ Repos: repo-a, repo-b (AI context)                                      │
│                                                                          │
│ Note: After saving, refine individual Features in Feature Creation.     │
│                                                                          │
│                        [Save as Draft]   [Push to ADO ▶]               │
└──────────────────────────────────────────────────────────────────────────┘
```

**"Save as Draft" flow:**
1. For each suggestion in `localSuggestions`:
   - Send `CREATE_FEATURE_DRAFT` with `{ title, description, parentEpicId: <epicId>, repoIds: selectedRepoIds, childPbiIds: [] }` — uses existing handler, no new code needed
   - Collect returned `featureId`s (via FEATURE_DRAFT_CREATED events) OR generate IDs client-side before send
2. Send `CREATE_EPIC_DRAFT` with all collected `linkedFeatureIds`
3. On EPIC_DRAFT_CREATED → navigate('dashboard') and setFocusEpicId(undefined)

> **ID generation strategy:** Generate `Date.now().toString()` for each Feature client-side before sending, include in CREATE_FEATURE_DRAFT payload as `id` field. This avoids async ordering issues. Matches existing webview-ui/src/types.ts CREATE_FEATURE_DRAFT shape which accepts explicit `id`.

**"Push to ADO" flow:**
1. Same Feature creation as above (Steps 1–2)
2. Send `CREATE_EPIC_DRAFT`
3. On EPIC_DRAFT_CREATED → send `PUSH_EPIC_TO_ADO` with `{ epicId, pushChildren: true }`
4. Show inline `LoadingBar` + progress messages from EPIC_PUSH_PROGRESS
5. On EPIC_PUSHED → show success message with ADO link, offer "View in ADO" and "Back to Dashboard"

---

## 7. Dashboard Integration (FINAL)

### Resolved Questions

- **Epics accordion default:** Expanded by default. First Epic auto-expands if ≥1 Epics exist.
- **Feature count badge source:** Computed at render time from `linkedFeatureIds.length`.
- **Feature cards within Epic:** Mini cards only — title, hierarchyStatus badge, PBI count. Full Feature accordion only appears in FeatureCreationWizard.

### Dashboard Structure (Updated)

```
Dashboard
│
├── [ADO Status Chip] ─ existing component, no change
│
├── ─ EPICS section (NEW — at top, above Features) ─────────────────
│   │
│   ├── AccordionHeader: "Epics" + count badge
│   │
│   ├── [Create Epic] button (primary CTA — top right of section)
│   │
│   ├── EpicCard (accordion, expanded by default for first Epic)
│   │   ├── Header: EpicTitle | [status badge] | "N features" | chevron
│   │   ├── Optional: estimatedVelocity pill ("~40 pts") if set
│   │   ├── Actions (on hover / context): [Edit Epic] [Push to ADO] [Delete]
│   │   │
│   │   └── Expanded body:
│   │       ├── Mini FeatureCard × N (read-only, compact)
│   │       │   ├── Feature title | status badge | "N PBIs"
│   │       │   └── Actions: [Open in Studio] [Unlink from Epic]
│   │       ├── [+ Generate Features] CTA (if linkedFeatures.length === 0)
│   │       └── [+ Link Feature] secondary CTA (always visible in body)
│   │
│   └── Empty state (no Epics): "Plan your strategic initiatives →  [Create Epic]"
│
├── ─ ORPHANED FEATURES section ─────────────────────────────────────
│   │  (Features where parentEpicId is undefined or parentEpicId not in epicDrafts)
│   │
│   ├── AccordionHeader: "Features" + orphan count (e.g., "3 not linked to Epic")
│   └── Existing FeatureCard × N — no change to existing component
│
└── ─ STANDALONE PBIs section ──────────────────────────────────────
    │  (PBIs where parentFeatureId is undefined — existing behaviour)
    └── Existing PBI accordion — no change
```

### New Component: `EpicCard`

**File:** `webview-ui/src/components/EpicCard.tsx`

```typescript
interface EpicCardProps {
  epic: EpicDraft;
  linkedFeatures: FeatureDraft[];       // pre-filtered from appState.featureDrafts
  onNavigate: (view: string, epicId?: string) => void;
  onSend: (message: WebviewRequest) => void;
}
```

**Status Badge Logic (use existing `<StatusBadge>` component):**

| `epic.status` | Badge variant | Label |
|---|---|---|
| `'draft'` | `gray` / muted | "Draft" |
| `'ready'` | `info` / blue | "Ready" |
| `'partial'` | `warning` / amber | "Partial" |
| `'pushed'` | `success` / green | "Pushed to ADO" |

**Status Rollup Rule (computed at save/update time in backend handler):**

```
if (epic.linkedFeatureIds.length === 0)                          → keep current status
if (epic.adoId && ALL linked features have adoWorkItemId)        → 'pushed'
if (epic.adoId && SOME linked features have adoWorkItemId)       → 'partial'
if (epic.adoId && NO linked features have adoWorkItemId)         → 'partial'
if (!epic.adoId && ALL linked features hierarchyStatus >= 'ready') → 'ready'
else                                                              → 'draft'
```

Recalculate after: `UPDATE_EPIC_DRAFT`, `LINK_FEATURE_TO_EPIC`, `UNLINK_FEATURE_FROM_EPIC`, `PUSH_EPIC_TO_ADO`, any `FEATURE_PUSHED` event where the feature has a `parentEpicId`.

---

## 8. Navigation Contract

### ViewId Update

**File:** `webview-ui/src/components/Sidebar.tsx` (wherever `ViewId` is defined)

```typescript
export type ViewId =
  | 'dashboard'
  | 'projects'
  | 'studio'
  | 'bulk'        // existing Feature Creation (keep as-is per ADR: Feature Creation Replaces Bulk)
  | 'rdis'
  | 'settings'
  | 'epic-creation';   // ← ADD
```

### New App.tsx State

```typescript
// Add alongside existing focusDraftId state (App.tsx line ~63)
const [focusEpicId, setFocusEpicId] = useState<string | undefined>(undefined);
```

### Render Block (App.tsx)

```typescript
{view === 'epic-creation' && (
  <EpicCreationWizard
    appState={state}
    send={sendMessage}
    onNavigate={setView}
    focusEpicId={focusEpicId}
    onClearFocusEpic={() => setFocusEpicId(undefined)}
    onEditInStudio={navigateToStudio}
    epicPushProgress={epicPushProgress}      // new state (see below)
    epicPushResult={epicPushResult}          // new state (see below)
    onClearEpicPushResult={() => setEpicPushResult(null)}
  />
)}
```

### New App.tsx Event Handlers (add to useEffect switch)

```typescript
case 'EPIC_DRAFT_CREATED':
  // Set focusEpicId so dashboard can scroll to new epic
  setFocusEpicId(message.payload.id);
  return;
case 'EPIC_PUSH_PROGRESS':
  setEpicPushProgress(message.payload);
  return;
case 'EPIC_PUSHED':
  setEpicPushResult(message.payload);
  setEpicPushProgress(null);
  pushToast({ level: 'success', message: `Epic pushed as #${message.payload.adoWorkItemId}.` });
  return;
case 'EPIC_GENERATION_COMPLETE':
  // forwarded to EpicCreationWizard via prop — store in state or use ref
  setEpicGeneratedSuggestions(message.payload);
  return;
case 'EPIC_GENERATION_ERROR':
  setEpicGenerationError(message.payload);
  return;
```

### Navigation Flows

1. **Create Epic (new):**  
   `Dashboard "Create Epic"` → `setView('epic-creation')` + `setFocusEpicId(undefined)`  
   → `EpicCreationWizard` mounts at Step 1, blank state

2. **Edit Epic (existing):**  
   `Dashboard EpicCard "Edit Epic"` → `setFocusEpicId(epic.id)` + `setView('epic-creation')`  
   → `EpicCreationWizard` mounts at Step 1, pre-filled from `appState.epicDrafts.find(e => e.id === focusEpicId)`

3. **Epic → Feature Studio:**  
   `EpicCard "Open in Studio"` → `navigateToStudio(featureId)` (existing function)  
   → `PbiStudio` opens with `focusDraftId = featureId`

4. **Epic Creation → Dashboard (save complete):**  
   On EPIC_DRAFT_CREATED callback → `setView('dashboard')` + `setFocusEpicId(undefined)`

### Sidebar Update

Add "Epic Creation" entry in `Sidebar.tsx` between Dashboard and Studio/Feature Creation. Icon suggestion: a stacked layers icon (SVG). Label: "Epics".

### Topbar Header (App.tsx `header` switch)

```typescript
case 'epic-creation':
  return {
    title: 'Epic Creation',
    subtitle: 'Plan strategic initiatives. Generate Features. Push to ADO.'
  };
```

---

## 9. Settings Audit & Gap Analysis

### Settings That Exist (from code review — SettingsView.tsx + AdoSettings)

| Setting | Storage | Key | Surfaced In |
|---|---|---|---|
| `orgUrl` | VS Code workspace globalState via SettingsService | `adoSettings.orgUrl` | SettingsView ✅ |
| `projectName` | same | `adoSettings.projectName` | SettingsView ✅ |
| PAT | VS Code SecretStorage | `secretStorage.getAdoPat()` | SettingsView (masked) ✅ |
| `team` | same | `adoSettings.team` | SettingsView (dropdown) ✅ |
| `areaPath` | same | `adoSettings.areaPath` | SettingsView ✅ |
| `iterationPath` | same | `adoSettings.iterationPath` | SettingsView ✅ |
| `defaultWorkItemType` | same | `adoSettings.defaultWorkItemType` | SettingsView ✅ |
| `theme` | same | `uiSettings.theme` | SettingsView ✅ |

### Settings Missing for Epic Creation

| Gap | Phase | Resolution |
|---|---|---|
| `defaultEpicAreaPath` | Phase 2 | Defer. Phase 1 uses `adoSettings.areaPath`. |
| `defaultEpicIterationPath` | Phase 2 | Defer. Phase 1 uses `adoSettings.iterationPath`. |
| `autoLinkChildrenOnGeneration` | Phase 2 | Defer. Phase 1: user explicitly clicks pushChildren. |
| `preferredFeatureCount` | Phase 2 | Defer. Phase 1: user sets count per-wizard-run on Step 3. |
| AI model selection | Phase 2 | Defer. Existing `CopilotService.pickModel()` handles fallback. |

### Phase 1 Decisions (No New Settings UI Required)

- Epic push uses the **same** `adoSettings` (orgUrl, projectName, areaPath, iterationPath, PAT)
- No new settings fields in Phase 1
- Epic wizard Step 2 uses the same `linkTargets` / `appState.projects` array as Feature Creation

### Gaps in PBI Studio (found during audit)

`PbiStudio.tsx` does not currently show the parent Feature's Epic context. When a PBI's `parentFeatureId` points to a Feature that has a `parentEpicId`, the PBI Studio could show a breadcrumb "Epic → Feature → PBI". **Not a Phase 1 blocker.** Document as future enhancement.

---

## 10. Implementation Checklist

### Phase 1 — Types & Contracts (Linus, 1 session)

- [ ] **`src/shared/messages.ts`:** Add `EpicDraft` interface (full definition from Section 2)
- [ ] **`src/shared/messages.ts`:** Add `epicDrafts: EpicDraft[]` to `AppStatePayload`
- [ ] **`src/shared/messages.ts`:** Add all `CREATE_EPIC_DRAFT`, `UPDATE_EPIC_DRAFT`, `DELETE_EPIC_DRAFT`, `LINK_FEATURE_TO_EPIC`, `UNLINK_FEATURE_FROM_EPIC`, `PUSH_EPIC_TO_ADO`, `GENERATE_FEATURES_FROM_EPIC` to `WebviewRequest`
- [ ] **`src/shared/messages.ts`:** Add `EPIC_DRAFT_CREATED`, `EPIC_DRAFT_UPDATED`, `EPIC_DRAFT_DELETED`, `EPIC_GENERATION_COMPLETE`, `EPIC_GENERATION_ERROR`, `EPIC_PUSH_PROGRESS`, `EPIC_PUSHED` to `ExtensionEvent`
- [ ] **`src/shared/messages.ts`:** Add `adoWorkItemUrl?` to `FeatureDraft` (mirror types.ts)
- [ ] **`webview-ui/src/types.ts`:** Replace stub `EpicDraft` with full definition from Section 2 (rename `featureIds` → `linkedFeatureIds`)
- [ ] **`webview-ui/src/types.ts`:** Make `epicDrafts` required (remove `?`)
- [ ] **`webview-ui/src/types.ts`:** Add all new `WebviewRequest` + `ExtensionEvent` union members
- [ ] **`webview-ui/src/types.ts`:** Reconcile existing FEATURE_* event discrepancies (Section 3.3)
- [ ] **`src/panels/DashboardPanel.ts`:** Add `getEpicDrafts()` + `saveEpicDrafts()` private methods
- [ ] **`src/panels/DashboardPanel.ts`:** Add `epicDrafts: this.getEpicDrafts()` to `postState()` payload

### Phase 2 — Backend Handlers (Linus, 1 session)

- [ ] **`handleCreateEpicDraft()`** — generate id/timestamps, set status='draft', append to globalState, post EPIC_DRAFT_CREATED + STATE_UPDATED
- [ ] **`handleUpdateEpicDraft()`** — stamp updatedAt, recalculate status (rollup rule from Section 7), save, post EPIC_DRAFT_UPDATED + STATE_UPDATED
- [ ] **`handleDeleteEpicDraft()`** — remove from epicDrafts, set parentEpicId=undefined on all linked FeatureDrafts, post EPIC_DRAFT_DELETED + STATE_UPDATED
- [ ] **`handleLinkFeatureToEpic()`** — add featureId to epic.linkedFeatureIds, set feature.parentEpicId, recalculate epic status, post EPIC_DRAFT_UPDATED + STATE_UPDATED
- [ ] **`handleUnlinkFeatureFromEpic()`** — remove from linkedFeatureIds, clear feature.parentEpicId, recalculate epic status, post EPIC_DRAFT_UPDATED + STATE_UPDATED
- [ ] **`handlePushEpicToAdo()`** — full ADO push per Section 4 push order; post EPIC_PUSH_PROGRESS + EPIC_PUSHED + STATE_UPDATED
- [ ] **`handleGenerateFeaturesFromEpic()`** — call `CopilotService.generateFeaturesFromEpic()` (new CopilotService method); post AI_PROGRESS + EPIC_GENERATION_COMPLETE or EPIC_GENERATION_ERROR
- [ ] **`src/services/adoService.ts`:** Add `pushEpicHierarchy()` per Section 4 contract
- [ ] **`src/services/copilotService.ts`:** Add `generateFeaturesFromEpic()` — similar to `generateUserStoriesFromFeature()`; prompt: "Given this Epic (title, description, objectives, scope), suggest [N] distinct Features..."
- [ ] **`src/panels/DashboardPanel.ts`:** Register all 7 new handlers in `handleMessage()` switch
- [ ] **`src/panels/DashboardPanel.ts`:** On `FEATURE_PUSHED` — recalculate parent Epic status if `feature.parentEpicId` is set

### Phase 3 — Frontend (Rusty, 1 session)

- [ ] **`webview-ui/src/views/EpicCreationWizard.tsx`** — 5-step wizard following FeatureCreationWizard structure exactly:
  - Copy `StepIndicator` pattern; update STEPS constant
  - `Step1Overview` — title, description, scope, objectives (ListEditor)
  - `Step2Context` — repo multi-select (reuse/adapt Step2Context from FeatureCreationWizard)
  - `Step3Generation` — featureCount input, Generate/Skip buttons, suggestion list
  - `Step4Review` — accordion list with inline edit, + Add Feature
  - `Step5Confirm` — read-only summary, Save as Draft / Push to ADO
- [ ] **`webview-ui/src/components/EpicCard.tsx`** — accordion card per Section 7 spec
- [ ] **`webview-ui/src/views/DashboardView.tsx`** — add Epic tier:
  - New "Epics" accordion section at top
  - Render `EpicCard` for each `appState.epicDrafts` entry
  - Recompute orphaned features: `features.filter(f => !f.parentEpicId || !epicDrafts.find(e => e.id === f.parentEpicId))`
  - Add "Create Epic" button in Epic section header
- [ ] **`webview-ui/src/App.tsx`** — add `epic-creation` route, `focusEpicId` state, new event handlers (Section 8)
- [ ] **`webview-ui/src/components/Sidebar.tsx`** — add "Epics" nav entry with ViewId `'epic-creation'`; place between Dashboard and Studio

### Phase 4 — Visual Design (Saul, 1 session)

- [ ] Epic tier visual identity — distinct top-border color from Feature (suggest: `--tw-vscode-info` for Epic, `--vscode-charts-purple` for Feature to differentiate tiers visually)
- [ ] Epic status badge variants — confirm `gray/blue/amber/green` against VS Code token bridge for all themes
- [ ] Dashboard Epic accordion header style — slightly larger than Feature accordion to indicate hierarchy level
- [ ] Epic card empty state illustration
- [ ] Step 3 AI generation loading state — animated "thinking" indicator within the suggestions area

### Phase 5 — QA (Livingston, 1 session)

- [ ] **Unit tests** — `handleCreateEpicDraft`: ID generation, timestamps, default status
- [ ] **Unit tests** — `handleDeleteEpicDraft`: verifies orphaning of linked features (parentEpicId cleared)
- [ ] **Unit tests** — Status rollup: all combinations of linked feature states → correct epic status
- [ ] **Unit tests** — `handleLinkFeatureToEpic` / `handleUnlinkFeatureFromEpic`: bidirectional consistency
- [ ] **Integration test** — PUSH_EPIC_TO_ADO with pushChildren=true: Epic created, Features created, Hierarchy-Reverse links added in correct order
- [ ] **Integration test** — PUSH_EPIC_TO_ADO with pushChildren=false: Epic created, status='partial', features not pushed
- [ ] **Integration test** — Pushing an Epic where all linked Features are already pushed: only adds hierarchy links, does not re-create Features
- [ ] **Wizard tests** — Step 1 validation: title required (≥3 chars), ≥1 objective required
- [ ] **Wizard tests** — Step 5 Save as Draft: correct CREATE_FEATURE_DRAFT and CREATE_EPIC_DRAFT messages sent in correct order
- [ ] **Wizard tests** — focusEpicId pre-fill: wizard Step 1 pre-populates from existing EpicDraft
- [ ] **Dashboard tests** — Epic accordion renders correctly for draft/ready/partial/pushed states
- [ ] **Dashboard tests** — Orphaned features computed correctly when features exist with undefined parentEpicId

---

## Appendix A: Open Questions — Resolved

| # | Question | Decision | Rationale |
|---|---|---|---|
| 1 | Wizard step count? | 5 steps, mirroring Feature Creation | Consistency; team already knows the pattern |
| 2 | Step 3 optional? | Yes — "Skip" button on Step 3 | Not every Epic needs AI breakdown; some teams plan manually |
| 3 | Features auto-created or suggestions? | Suggestions only; created at Step 5 | Prevents orphaned drafts from abandoned wizard sessions |
| 4 | Mixed feature sources — visual distinction? | No badge in Phase 1; `aiGeneratedFeatures: boolean` flag stored but not displayed | Complexity deferred; dashboard doesn't need source info for functional use |
| 5 | Cascading push — Option A/B/C? | Option B: Push Epic only, `pushChildren: boolean` checkbox | Avoids all-or-nothing failure; user controls scope per push |
| 6 | Epic settings scope: global or per-Epic? | Phase 1: global (reuse existing AdoSettings) | No new settings UI required; avoids scope creep |
| 7 | Unlinked feature status reset? | No reset on re-link | Status reflects ADO reality, not Epic membership |
| 8 | Import existing ADO Epic? | Not in Phase 1; deferred to Phase 2 | Greenfield addition is faster; import is a separate feature |
| 9 | Dashboard accordion defaults? | Epics expanded by default, first Epic auto-expanded | Epics are primary PO planning artifact; visibility by default |
| 10 | Status rollup rule? | Strict minimum: all features pushed → pushed; any not pushed → partial | Strict rule prevents false confidence |
| 11 | Velocity estimation? | Manual only in Phase 1 | Auto-calc from children deferred; manual is sufficient for planning |
| 12 | Drag-to-reorder features in Step 4? | Not in Phase 1 | Complexity vs. value tradeoff; array order sufficient for MVP |

---

## Appendix B: Files Modified by Phase

| File | Phase | Change Type |
|---|---|---|
| `src/shared/messages.ts` | 1 | Add EpicDraft, update AppStatePayload, add message types |
| `webview-ui/src/types.ts` | 1 | Expand EpicDraft, add message types, fix FEATURE_* discrepancies |
| `src/panels/DashboardPanel.ts` | 1+2 | postState, persistence methods, 7 new handlers |
| `src/services/adoService.ts` | 2 | pushEpicHierarchy() |
| `src/services/copilotService.ts` | 2 | generateFeaturesFromEpic() |
| `webview-ui/src/views/EpicCreationWizard.tsx` | 3 | New file |
| `webview-ui/src/components/EpicCard.tsx` | 3 | New file |
| `webview-ui/src/views/DashboardView.tsx` | 3 | Epic tier addition |
| `webview-ui/src/App.tsx` | 3 | epic-creation route, state, handlers |
| `webview-ui/src/components/Sidebar.tsx` | 3 | Epics nav entry |

---

*Spec version: 1.0 — Implementation Ready*  
*Last updated: 2026-04-30 by Basher*
