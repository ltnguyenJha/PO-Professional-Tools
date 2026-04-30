# Architecture Proposal: Epic → Feature → User Story Hierarchy

**Author:** Danny (Lead)  
**Date:** 2026-07-01  
**Status:** Proposed  
**Branch:** `feature/epic-feature-story-architecture-2026-07`

---

## Executive Summary

Introduce a proper work item hierarchy (Epic → Feature → User Story) with dedicated data types, sidebar navigation, AI-driven Feature→Story breakdown, multi-repo context selection, and a redesigned dashboard rendering the tree. This replaces the current prefix-based "Bulk Breakdown" with a purpose-built Feature Creation flow.

**Key Architecture Decision:** `FeatureDraft` and `EpicDraft` are *separate* types from `PbiDraft` — not extensions of it. Rationale: PbiDraft is overloaded with bug/feature/story fields already. Separate types enable cleaner validation, distinct persistence, and independent lifecycle without breaking existing PBI Studio behavior.

---

## 1. Data Model Changes

### 1.1 New Types

```typescript
// ─── Hierarchy Draft Types ───────────────────────────────────────────────────

export type HierarchyStatus = 'draft' | 'ready' | 'pushed' | 'partial';

export interface FeatureDraft {
  id: string;
  title: string;
  description: string;

  // Feature definition (high-level, non-technical)
  why: string;
  userFlow: string;
  businessRules: string;

  // Relationships
  childUserStoryIds: string[];    // → PbiDraft.id references
  repoIds: string[];              // → ImportedProject.id (multi-repo context)
  epicId?: string;                // → EpicDraft.id parent

  // ADO integration
  status: HierarchyStatus;
  adoWorkItemId?: number;
  adoWorkItemUrl?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface EpicDraft {
  id: string;
  title: string;
  description: string;

  // Relationships
  featureIds: string[];           // → FeatureDraft.id references

  // ADO integration
  status: HierarchyStatus;
  adoWorkItemId?: number;
  adoWorkItemUrl?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### 1.2 Relationship Storage Strategy

**ID-based references (not inline objects).** Rationale:

| Approach | Pros | Cons |
|----------|------|------|
| Inline children | Single read | Duplication, sync hell, mutation complexity |
| ID references | Single source of truth, independent edit, familiar relational pattern | Extra lookup on render |

Child User Stories remain as `PbiDraft` objects in the existing `pbiDrafts[]` array. The `FeatureDraft.childUserStoryIds` provides the relationship. This preserves PBI Studio's ability to edit any story independently.

**New field on PbiDraft** (additive, non-breaking):
```typescript
// Add to PbiDraft interface:
parentFeatureId?: string;  // back-reference for tree rendering
```

### 1.3 Updated AppStatePayload

```typescript
export interface AppStatePayload {
  projects: ImportedProject[];
  linkTargets?: ImportedProject[];
  pbiDrafts: PbiDraft[];
  rdiDrafts: RdiDraft[];
  featureDrafts: FeatureDraft[];   // NEW
  epicDrafts: EpicDraft[];         // NEW
  adoSettings?: AdoSettings;
  uiSettings: UiSettings;
  hasAdoPat: boolean;
}
```

### 1.4 HierarchyStatus Semantics

| Status | Meaning |
|--------|---------|
| `draft` | In progress, not ready for ADO |
| `ready` | All required fields complete, eligible for push |
| `pushed` | Successfully synced to ADO |
| `partial` | Feature/Epic pushed, but some children failed or haven't been pushed |

---

## 2. Sidebar Navigation

### Updated ViewId and NAV

```typescript
export type ViewId = 'dashboard' | 'epics' | 'projects' | 'studio' | 'bulk' | 'rdis' | 'settings';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',        icon: '▣' },
  { id: 'epics',     label: 'Epics & Features', icon: '◆' },  // NEW
  { id: 'projects',  label: 'Projects',         icon: '❏' },
  { id: 'studio',    label: 'PBI Studio',       icon: '✎' },
  { id: 'bulk',      label: 'Feature Creation', icon: '≡' },   // REPURPOSED
  { id: 'rdis',      label: 'RDIs',             icon: '⬆' },
  { id: 'settings',  label: 'Settings',         icon: '⚙' },
];
```

**Design Rationale:**
- "Epics & Features" sits below Dashboard because it's the high-level planning view (above project/story detail work)
- "Feature Creation" (`bulk`) is repurposed in-place to become the new AI-driven Feature wizard — preserves existing ViewId routing
- The `epics` view is a **read/manage** view (tree display, status tracking). Feature *creation* stays in `bulk`

---

## 3. Feature Creation Flow (New `bulk` View Architecture)

### Step-by-Step UX Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ FEATURE CREATION WIZARD (replaces BulkBreakdownView)         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Step 1: Feature Details                                    │
│  ├── Title (required)                                       │
│  ├── Description (textarea, high-level "what")              │
│  ├── Why / Business Value (textarea)                        │
│  ├── User Flow (textarea, happy path narrative)             │
│  └── Business Rules (textarea, constraints/rules)           │
│                                                             │
│  Step 2: Context Selection                                  │
│  ├── Epic assignment (optional, dropdown of EpicDrafts)     │
│  └── Repo selection (multi-select from linkTargets[])       │
│                                                             │
│  Step 3: AI Generation                                      │
│  ├── "Generate User Stories" CTA button                     │
│  ├── Sends GENERATE_USER_STORIES_FROM_FEATURE               │
│  └── Progress indicator (reuse AI_PROGRESS pattern)         │
│                                                             │
│  Step 4: Review Generated Stories                           │
│  ├── Card list of generated stories (read-mostly)           │
│  ├── Inline edit: title + effort only                       │
│  ├── Remove story (x button)                                │
│  ├── "Add Story" (manual add)                               │
│  ├── "Regenerate" (re-run AI with adjusted context)         │
│  └── "Edit in PBI Studio" link per story (navigates)        │
│                                                             │
│  Step 5: Save & Push                                        │
│  ├── "Save as Draft" → creates FeatureDraft + child PBIs    │
│  ├── "Push to ADO" → PUSH_FEATURE_TO_ADO                   │
│  └── Status display per item                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

| Component | Responsibility |
|-----------|---------------|
| `FeatureCreationWizard.tsx` | Orchestrator (step state, draft hydration) |
| `FeatureStep1Details.tsx` | Title, description, why, flow, rules |
| `FeatureStep2Context.tsx` | Epic picker + multi-repo selector |
| `FeatureStep3Generate.tsx` | AI trigger + progress |
| `FeatureStep4Review.tsx` | Story cards with lightweight inline edit |
| `FeatureStep5Push.tsx` | Save/push actions + status |

### High-Level Edit Constraint

**Principle:** The Feature Creation wizard does NOT provide detailed PBI editing. Users edit title + effort only in Step 4. For acceptance criteria, test scenarios, technical considerations — they click "Edit in PBI Studio" which navigates to `studio` view with that draft loaded.

This enforces separation of concerns:
- Feature Creation = strategic decomposition
- PBI Studio = tactical story refinement

---

## 4. New Message Types

### 4.1 WebviewRequest Additions

```typescript
// ─── Feature Draft Messages ──────────────────────────────────────────────────

| { type: 'CREATE_FEATURE_DRAFT'; payload: {
    title: string;
    description: string;
    why: string;
    userFlow: string;
    businessRules: string;
    repoIds: string[];
    epicId?: string;
  }}

| { type: 'UPDATE_FEATURE_DRAFT'; payload: { draft: FeatureDraft } }

| { type: 'DELETE_FEATURE_DRAFT'; payload: { featureId: string } }

| { type: 'GENERATE_USER_STORIES_FROM_FEATURE'; payload: {
    featureId: string;
    repoIds: string[];       // repos to scan for context
    storyCount?: number;     // hint: how many stories (default: AI decides)
  }}

| { type: 'PUSH_FEATURE_TO_ADO'; payload: {
    featureId: string;
    includeChildren: boolean; // push child PBIs too?
  }}

// ─── Epic Draft Messages ─────────────────────────────────────────────────────

| { type: 'CREATE_EPIC_DRAFT'; payload: {
    title: string;
    description: string;
  }}

| { type: 'UPDATE_EPIC_DRAFT'; payload: { draft: EpicDraft } }

| { type: 'DELETE_EPIC_DRAFT'; payload: { epicId: string } }

| { type: 'PUSH_EPIC_TO_ADO'; payload: {
    epicId: string;
    includeChildren: boolean; // push child Features + their stories?
  }}

// ─── Hierarchy Navigation ────────────────────────────────────────────────────

| { type: 'NAVIGATE_TO_STORY'; payload: { draftId: string } }
  // navigates to PBI Studio with this draft loaded
```

### 4.2 ExtensionEvent Additions

```typescript
| { type: 'FEATURE_DRAFT_CREATED'; payload: { featureId: string } }

| { type: 'EPIC_DRAFT_CREATED'; payload: { epicId: string } }

| { type: 'USER_STORIES_GENERATED'; payload: {
    featureId: string;
    generatedDraftIds: string[];  // IDs of the new PbiDraft children
  }}

| { type: 'FEATURE_PUSH_PROGRESS'; payload: {
    featureId: string;
    phase: 'feature' | 'children';
    current: number;
    total: number;
    message: string;
  }}

| { type: 'EPIC_PUSH_PROGRESS'; payload: {
    epicId: string;
    phase: 'epic' | 'features' | 'stories';
    current: number;
    total: number;
    message: string;
  }}
```

---

## 5. ADO Push Strategy

### 5.1 Feature Push Sequence

```
1. Create ADO Feature work item
   - Type: "Feature"
   - Fields: Title, Description (composed from why + userFlow + businessRules)
   - Area/Iteration from adoSettings

2. For each child in childUserStoryIds (if includeChildren=true):
   a. Create ADO "Product Backlog Item" or "User Story" work item
   b. Add parent relation: System.LinkTypes.Hierarchy-Reverse → Feature URL
   c. Update PbiDraft.adoWorkItemId and status='pushed'

3. Update FeatureDraft.adoWorkItemId, status='pushed' (or 'partial' if children failed)
```

### 5.2 Epic Push Sequence

```
1. Create ADO Epic work item
   - Type: "Epic"
   - Fields: Title, Description

2. For each child in featureIds (if includeChildren=true):
   a. Push Feature (sequence above) if not already pushed
   b. Add parent relation: System.LinkTypes.Hierarchy-Reverse → Epic URL

3. Update EpicDraft.adoWorkItemId, status='pushed' (or 'partial')
```

### 5.3 ADO Relation Types

| Relation | ADO Link Type | Direction |
|----------|---------------|-----------|
| Epic → Feature | `System.LinkTypes.Hierarchy-Forward` | Parent → Child |
| Feature → Story | `System.LinkTypes.Hierarchy-Forward` | Parent → Child |
| Story → Feature | `System.LinkTypes.Hierarchy-Reverse` | Child → Parent |

**Re-push behavior:** If a Feature/Epic already has `adoWorkItemId`, update the existing work item instead of creating a duplicate. Same pattern as existing `UPDATE_PBI_IN_ADO`.

---

## 6. Dashboard Data Requirements

### 6.1 Hierarchy Tree Rendering

The Dashboard (`dashboard` view) needs to render:

```
Epic A (status: draft)
├── Feature 1 (status: pushed) — 3/5 stories pushed
│   ├── Story 1.1 ✓ pushed
│   ├── Story 1.2 ✓ pushed
│   ├── Story 1.3 ✓ pushed
│   ├── Story 1.4 ○ draft
│   └── Story 1.5 ○ draft
├── Feature 2 (status: draft) — 0/3 stories pushed
│   ├── Story 2.1 ○ draft
│   ├── Story 2.2 ○ draft
│   └── Story 2.3 ○ draft
└── (Unassigned Feature 3) — no epic

Orphan Stories (no parent feature)
├── Story X
└── Story Y
```

### 6.2 Derived Status Logic

```typescript
function deriveFeatureStatus(feature: FeatureDraft, stories: PbiDraft[]): HierarchyStatus {
  if (feature.adoWorkItemId && stories.every(s => s.status === 'pushed')) return 'pushed';
  if (feature.adoWorkItemId && stories.some(s => s.status !== 'pushed')) return 'partial';
  if (stories.length > 0 && stories.every(s => s.status === 'ready')) return 'ready';
  return 'draft';
}
```

### 6.3 Dashboard KPIs

| KPI | Source |
|-----|--------|
| Total Epics / Features / Stories | Array lengths |
| Stories ready for push | `pbiDrafts.filter(d => d.status === 'ready' && d.parentFeatureId)` |
| Push completion % | pushed / total per Feature |
| Effort estimate (days) | Sum of `effortDays` across child stories |
| Stories without parent | `pbiDrafts.filter(d => !d.parentFeatureId)` |

### 6.4 TailwindCSS Dashboard Rendering

The new dashboard uses TailwindCSS (already in webview-ui via the existing Vite setup). Key layout:

- **Collapsible tree** using `<details>/<summary>` or custom accordion
- **Status badges** with color coding (draft=gray, ready=blue, pushed=green, partial=amber)
- **Progress bars** per Feature showing child story completion
- **Quick actions** (push, edit, navigate) on each node

---

## 7. Scope Boundaries

### MVP (This Sprint)

| # | Deliverable |
|---|-------------|
| 1 | `FeatureDraft` and `EpicDraft` types in `messages.ts` |
| 2 | `AppStatePayload` updated with `featureDrafts[]` and `epicDrafts[]` |
| 3 | Persistence layer (globalState read/write) for new draft types |
| 4 | Feature Creation wizard (Steps 1-5) replacing BulkBreakdownView |
| 5 | `GENERATE_USER_STORIES_FROM_FEATURE` message + CopilotService handler |
| 6 | Multi-repo context in AI generation prompt |
| 7 | Feature push to ADO with child PBI creation + parent links |
| 8 | "Epics & Features" sidebar view with basic tree display |
| 9 | Dashboard hierarchy rendering (tree view with status) |
| 10 | `parentFeatureId` back-reference on PbiDraft |

### Nice-to-Have (Post-MVP)

| # | Item | Rationale for deferral |
|---|------|----------------------|
| 1 | Epic push to ADO | Epics rarely pushed individually; Features are the ADO unit of work |
| 2 | Drag-and-drop story reordering | UX polish, not functional |
| 3 | AI-generated Epic decomposition (Epic → Features) | Valuable but separate AI prompt engineering |
| 4 | Bulk Feature import from ADO | Read-back is complex (ADO query integration) |
| 5 | Feature templates | Nice pattern but not blocking |
| 6 | Story dependency visualization | Mermaid/graph rendering — complex |
| 7 | Iteration/sprint assignment at Feature level | Needs ADO iteration API integration done first |

### Explicitly Out of Scope

- **No changes to PBI Studio editing UX** — it stays as-is for detailed story work
- **No ADO sync-back** (pulling remote changes into drafts)
- **No real-time collaboration** — single-user extension
- **No breaking changes to existing PbiDraft consumers** — additive only

---

## 8. Migration Strategy

### Existing Data Compatibility

- Existing `BulkBreakdownRequest` / `BULK_CREATE_DRAFTS` / `BULK_PUSH_TO_ADO` messages **remain functional** during transition
- New Feature Creation wizard is built alongside, then the UI switches the `bulk` view to render `FeatureCreationWizard` instead of `BulkBreakdownView`
- Old bulk-created PBIs that have no `parentFeatureId` appear in "Orphan Stories" section of dashboard

### Deprecation Path

1. Sprint N: Ship new Feature wizard alongside old BulkBreakdownView (toggle or A/B)
2. Sprint N+1: Remove BulkBreakdownView, keep message types for backward compat
3. Sprint N+2: Remove deprecated bulk message types from codebase

---

## 9. Open Questions for Team Discussion

1. **Should `FeatureDraft.description` be auto-composed from why + userFlow + businessRules?** Or keep it as a separate free-text field? (I lean toward separate — gives the user a prose summary they control.)

2. **Story generation count:** Should the AI decide how many stories, or should the user set a target? (I lean toward AI decides with user able to add/remove after.)

3. **Epic creation UX:** Minimal form (title + description) or should Epics also have a wizard? (I say minimal — Epics are organizational containers, not detailed work items.)

---

## 10. Implementation Order (Recommended)

```
Phase 1: Data Layer (Linus)
├── Add FeatureDraft, EpicDraft types to messages.ts
├── Add parentFeatureId to PbiDraft
├── Update AppStatePayload
├── Persistence handlers (globalState)
└── CRUD message handlers

Phase 2: AI Generation (Linus)
├── GENERATE_USER_STORIES_FROM_FEATURE handler
├── Multi-repo context assembly
├── CopilotService prompt engineering
└── USER_STORIES_GENERATED event

Phase 3: Feature Creation UI (Rusty)
├── FeatureCreationWizard + step components
├── Multi-repo selector component
├── Story review cards (lightweight)
└── Wire to message handlers

Phase 4: Epics & Dashboard (Rusty)
├── Epics view (tree display)
├── Dashboard hierarchy rendering
├── TailwindCSS status badges + progress
└── Navigation between views

Phase 5: ADO Integration (Linus)
├── PUSH_FEATURE_TO_ADO handler
├── Parent-child link creation
├── Progress events
└── Error handling / partial status
```

---

*End of proposal. Ready for team review.*
