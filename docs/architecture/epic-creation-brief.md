# Epic Creation — Architecture Scoping Brief

**Prepared for:** Basher (Solutions Architect)  
**From:** Danny (Lead)  
**Date:** 2026-04-29  
**Status:** Planning Phase — Input for full architecture spec

---

## 1. Hierarchy Model

The PO-Professional-Tools extension implements a three-level work item hierarchy aligned with Agile planning best practices:

```
Epic (highest level — "big initiative")
  └── Feature (medium — "user-facing capability")
        └── Product Backlog Item / User Story (implementation unit)
```

### Work Item Types in Azure DevOps
- **Epic WIT:** `Epic` (native ADO type)
- **Feature WIT:** `Feature` (native ADO type, already implemented)
- **PBI WIT:** `Product Backlog Item` (native ADO type, already implemented)

### Linking Strategy
- **Epic → Feature link:** `System.LinkTypes.Hierarchy-Reverse` on the Feature work item, pointing up to the Epic
- **Feature → PBI link:** Same reverse hierarchy link (already working in current Feature Creation implementation)

**Rationale:** This reverse hierarchy pattern matches ADO's native parent-child link semantics and allows features and PBIs to exist independently while maintaining explicit Epic association.

---

## 2. EpicDraft Type Definition (Sketch)

```typescript
interface EpicDraft {
  // Identity
  id: string;                         // UUID, client-side generated (e.g., "epic_abc123")
  adoId?: number;                     // Azure DevOps Epic WIT ID (optional, set after push)
  
  // Content
  title: string;                      // Epic name (e.g., "Mobile-first redesign")
  description: string;                // High-level narrative (3-5 sentences)
  objectives: string[];               // OKRs, goals, or success metrics
  scope: string;                      // Explicit "in scope" and "out of scope" boundaries
  
  // Relationships
  linkedFeatureIds: string[];         // IDs of Feature drafts belonging to this Epic
                                      // Mix of auto-generated + manually linked features
  selectedRepoIds: string[];          // Repositories for AI context during feature generation
  
  // Status & Tracking
  status: HierarchyStatus;            // 'draft' | 'ready' | 'pushed' | 'partial'
                                      // 'partial' = Epic pushed but some children not yet
  
  // Lifecycle
  createdAt: string;                  // ISO 8601 timestamp
  updatedAt: string;                  // ISO 8601 timestamp
  
  // Optional fields
  estimatedVelocity?: number;         // Story points estimate or sprint count
  targetDate?: string;                // ISO date (YYYY-MM-DD) for Epic deadline
}
```

### Status Lifecycle

| Status | Meaning | Transition |
|--------|---------|-----------|
| `draft` | New, being edited in UI | Created; after each edit |
| `ready` | All linked features are at least `ready` | Auto: when all children ≥ `ready` |
| `pushed` | Epic pushed to ADO, all linked features also pushed | After successful PUSH_EPIC_TO_ADO |
| `partial` | Epic pushed but one or more child features not yet pushed | Epic pushed, but UNLINK_FEATURE_FROM_EPIC or child failures |

---

## 3. Message Types (Sketch)

### Outbound (WebviewRequest) — UI → Extension

```typescript
// Epic CRUD
| { type: 'CREATE_EPIC_DRAFT'; 
    payload: Omit<EpicDraft, 'id' | 'createdAt' | 'updatedAt' | 'status'> }
| { type: 'UPDATE_EPIC_DRAFT'; payload: EpicDraft }
| { type: 'DELETE_EPIC_DRAFT'; payload: { epicId: string } }

// Epic → ADO
| { type: 'PUSH_EPIC_TO_ADO'; 
    payload: { epicId: string; includePushChildren: boolean } }
    // includePushChildren=true: auto-push all linked child features

// Epic → AI Generation
| { type: 'GENERATE_FEATURES_FROM_EPIC'; 
    payload: { epicId: string; featureCount?: number; 
               adoContext?: { team: string; iterationPath: string } } }
    // Breaks Epic into N Features using AI (like "Generate PBIs from Feature")

// Relationship Management
| { type: 'LINK_FEATURE_TO_EPIC'; 
    payload: { epicId: string; featureId: string } }
    // Associate existing Feature with this Epic (adds to linkedFeatureIds)
    
| { type: 'UNLINK_FEATURE_FROM_EPIC'; 
    payload: { epicId: string; featureId: string } }
    // Remove Feature from Epic (removes from linkedFeatureIds)
    // Feature itself is NOT deleted, just orphaned from Epic
```

### Inbound (ExtensionEvent) — Extension → UI

```typescript
// CRUD events
| { type: 'EPIC_DRAFT_CREATED'; payload: EpicDraft }
| { type: 'EPIC_DRAFT_UPDATED'; payload: EpicDraft }
| { type: 'EPIC_DRAFT_DELETED'; payload: { epicId: string } }

// Generation completion
| { type: 'EPIC_GENERATION_COMPLETE'; 
    payload: { epicId: string; generatedFeatureIds: string[] } }
| { type: 'EPIC_GENERATION_ERROR'; 
    payload: { epicId: string; message: string } }

// ADO push events (mirrors Feature push pattern)
| { type: 'EPIC_PUSH_PROGRESS'; 
    payload: { epicId: string; message: string; 
               current: number; total: number } }
| { type: 'EPIC_PUSHED'; 
    payload: { epicId: string; adoWorkItemId: number; 
               linkedFeatureAdoIds: Record<string, number>; 
               hierarchyStatus: HierarchyStatus } }
    // linkedFeatureAdoIds = mapping { featureId → adoId }
```

**Note on Status Synchronization:**  
- EpicDraft.status must update whenever ANY linked feature's status changes
- This is event-driven: when Feature is pushed, Epic status auto-recalculates
- See Section 7 ("Open Questions") for design choice on mixed generation

---

## 4. Settings Gaps (Current Audit)

### Present Configuration (SettingsView.tsx)
✅ **ADO Connection Settings**
- `orgUrl` — Organization URL (e.g., https://dev.azure.com/myorg)
- `projectName` — ADO Project name
- `team` — Team within project (optional; used for iterations/area paths)
- `pat` — Personal Access Token (UI prompts, stored securely in VS Code)

✅ **Default Work Item Settings**
- `defaultWorkItemType` — Applies to new PBI/Feature creation
- `iterationPath` — Sprint/iteration for new work items
- `areaPath` — Area/team classification (optional)

✅ **UI Preferences (UiSettings)**
- `theme` — 'light' | 'dark' | 'auto'

### Missing for Epic Creation
❌ **Epic-Specific Settings**
- `defaultEpicIterationPath` — Should Epic targets differ from Feature iterations?
- `epicAreaPath` — Should Epics route to a specific area (e.g., "Strategic")?
- `autoLinkChildrenOnGeneration` — When generating features from Epic, auto-link them?

❌ **AI Model Configuration**
- Currently hardcoded in extension; no UI toggle for:
  - Model selection (e.g., `gpt-4o` vs `gpt-4-turbo`)
  - Temperature / creativity level
  - Generation preferences (e.g., "prefer smaller stories" or "prefer larger epics")

❌ **Bulk Generation Preferences**
- Velocity baseline (story points per sprint)
- Epic size guidance (e.g., "break Epic into 4-8 features")

### Recommendation for Epic Creation
- **Phase 1 (MVP):** Use existing ADO Connection + Default Work Item settings; no new settings UI
- **Phase 2 (Post-MVP):** Add optional "Epic Configuration" section to SettingsView
  - `autoLinkChildrenOnGeneration?: boolean`
  - `epicAreaPath?: string`
  - `preferredFeatureCount?: number` (hint for AI breakdown)

---

## 5. Dashboard Integration Notes

### Current Dashboard Structure (DashboardView.tsx)
The Dashboard already has accordion UI and status badges (AccordionHeader, StatusBadge, FeatureCard components).

### Proposed Epic View in Dashboard
```
┌─ ADO Status Chip ────────────────────────────────┐
│ ADO · Connected to Project Foo                   │
└──────────────────────────────────────────────────┘

┌─ Epics Accordion ────────────────────────────────┐
│ ▼ Epic 1: Mobile Redesign [draft] (3 features)  │
│   ├─ Feature: Auth Flow [ready] (2 stories)     │
│   ├─ Feature: Offline Mode [draft] (0 stories)  │
│   └─ [+ Generate Features CTA]                  │
├─ Epic 2: API v2 Rollout [pushed] (0 features)   │
│   └─ [Empty state: Link or generate features]   │
└─────────────────────────────────────────────────┘

┌─ Features Accordion ─────────────────────────────┐
│ ▼ Orphaned Features (3 not linked to Epic)       │
│   ├─ Feature: Advanced Search [draft]            │
│   └─ ...                                         │
└─────────────────────────────────────────────────┘

┌─ PBIs Accordion ────────────────────────────────┐
│ ▼ Standalone Stories (2 not linked to Feature)  │
│   └─ ...                                        │
└──────────────────────────────────────────────────┘
```

### Epic Card Design
**EpicCard Component** (new)
```tsx
interface EpicCardProps {
  epic: EpicDraft;
  linkedFeatures: FeatureDraft[];
  onNavigate: (view: string, epicId?: string) => void;
  onExpand?: () => void;
}
```

**Card Display:**
- **Title** (truncate if >50 chars)
- **Status Badge** (StatusBadge component, existing)
- **Linked Features Count** (e.g., "3 features")
- **Estimated Velocity** (if set; optional pill)
- **Chevron** (collapsible state)

**Actions on Card:**
- **Click title or chevron** → Toggle nested feature list
- **"Generate Features" CTA** → Modal to set feature count, trigger GENERATE_FEATURES_FROM_EPIC
- **"Edit Epic" context menu** → Navigate to Epic Creation with prefilled data
- **"Link Feature" modal** → Add existing Feature to this Epic

### Feature Cards Within Epic Context
Reuse existing FeatureCard pattern but with context awareness:
```tsx
<FeatureCard 
  feature={f} 
  storyCount={childPbis.length}
  onNavigate={onNavigate}
  parentEpicId={epic.id}  // NEW: Pass Epic context
/>
```

When Feature is nested under Epic, show:
- **Breadcrumb or visual indent** to indicate nesting
- **"Unlink from Epic" option** in context menu
- **"View in Studio" link** → Opens Feature in PBI Studio with `focusFeatureId`

### Empty States
- **Epic with no Features:** Show "Generate Features" CTA (primary) + "Manually link features" (secondary)
- **No Epics at all:** Show "Create Epic" CTA + "Epics organize multiple features"

---

## 6. Navigation & Routing Additions (App.tsx)

### New Route
```typescript
// In App.tsx render logic:
{view === 'epic-creation' && (
  <EpicCreationWizard
    appState={state}
    send={sendMessage}
    onNavigate={setView}
    focusEpicId={focusEpicId}    // NEW state
    onEditInStudio={...}         // Existing pattern
    onClearFocusEpic={...}       // NEW callback
  />
)}
```

### New State Variables
```typescript
const [focusEpicId, setFocusEpicId] = useState<string | undefined>();
```

**Rationale:** Mirrors the existing `focusDraftId` pattern for PBI Studio. Allows:
- Navigating to Epic Creation with prefilled data
- "Edit Epic" from Dashboard → Epic Creation with `focusEpicId` set
- Clearing focus after user completes editing

### Navigation Flows
1. **Dashboard → Epic Creation (New)**
   ```
   User clicks "Create Epic" 
   → setView('epic-creation'); setFocusEpicId(undefined)
   → EpicCreationWizard mounts in step 1
   ```

2. **Dashboard → Epic Creation (Edit Existing)**
   ```
   User clicks "Edit Epic" on EpicCard
   → setView('epic-creation'); setFocusEpicId(epic.id)
   → EpicCreationWizard mounts with prefilled data in step 1
   ```

3. **Epic Creation → Dashboard (Save & Return)**
   ```
   User clicks "Save & Return to Dashboard"
   → setView('dashboard'); setFocusEpicId(undefined)
   → Dashboard refreshes; new/updated Epic appears in Epics accordion
   ```

4. **Epic Creation → PBI Studio (Edit Child Feature)**
   ```
   User clicks "Edit Feature" in nested Feature list
   → setView('studio'); setFocusDraftId(featureId)
   → PBI Studio opens with that Feature in focus
   ```

### Sidebar Integration
Update Sidebar component to add "Epic Creation" view option (between "Dashboard" and "Settings" for UX flow).

---

## 7. Epic Creation Wizard — Structure (Reference Only)

The Epic Creation Wizard will follow a similar multi-step pattern as Feature Creation Wizard:

### Proposed 5-Step Flow (for Basher to validate/modify)

| Step | Name | Content | AI? |
|------|------|---------|-----|
| 1 | **Epic Essentials** | Title, description, objectives (3-5 fields) | Optional: AI refine button |
| 2 | **Scope & Constraints** | "In scope" / "Out of scope" narrative, repos for context | No |
| 3 | **Feature Generation** | Set feature count, trigger AI breakdown, review suggestions | **Yes** → GENERATE_FEATURES_FROM_EPIC |
| 4 | **Linked Features Review** | List all features (generated + manually linked), reorder/unlink if needed | No |
| 5 | **Save & Push** | Save Epic draft, option to push to ADO immediately | UI for ADO progress |

**Questions for Basher:**
- Should Step 3 be optional? (i.e., users can skip AI generation and manually link features instead)
- Should features be auto-created in the draft, or just suggested for review before creation?
- Should Step 4 allow drag-to-reorder feature priority?

---

## 8. Open Questions for Basher to Resolve

### Architecture Decisions

1. **Wizard Step Count & Structure**
   - Should Epic Creation wizard match Feature Creation's 5 steps, or differ?
   - Is Step 3 (AI breakdown) optional, or always shown?
   - Should feature generation be in-wizard or a separate action from Dashboard?

2. **Mixed Feature Sources**
   - An Epic can have BOTH auto-generated Features AND manually linked Features.
   - Should the UI distinguish between them (e.g., badges: "Generated" vs "Manual")?
   - When listing features in Dashboard, should manual ones appear differently?

3. **Cascading Push Behavior**
   - When pushing an Epic to ADO, should we:
     - **Option A:** Auto-push all linked child Features & their PBIs (atomic, all-or-nothing)?
     - **Option B:** Push only the Epic, offer checkbox to "also push ready children"?
     - **Option C:** Push Epic, then prompt for each Feature individually?
   - **Impact:** Determines error handling, progress UI, and user experience on partial failure.

4. **Epic Settings Scope**
   - Are Epic-related settings **global** (stored once in VS Code workspace settings)?
   - Or **per-Epic** (stored in each EpicDraft, like Features)?
   - Example: "epicAreaPath" — should it apply to all Epics, or be overrideable per-Epic?

5. **Feature Lifecycle Within Epic**
   - If a Feature is unlinked from an Epic, then later re-linked, should its status reset?
   - Should unlinked features be soft-deleted from the draft list, or permanently orphaned?

6. **ADO Linking Edge Case**
   - What if an ADO Epic already exists with some linked Features?
   - Should Epic Creation offer "Import existing ADO Epic as draft"?
   - Should it support updating an existing ADO Epic, or only create new ones?

### UI/UX Decisions

7. **Dashboard Accordion Defaults**
   - Should Epics accordion be open or collapsed by default?
   - Should first Epic auto-expand?

8. **Feature Count Guidance**
   - Should AI generation suggest a default feature count (e.g., "3-7 features typical for initiatives")?
   - Should there be a slider/picker for users to set this before generation?

9. **Status Rollup**
   - When Epic.status is calculated, should it be:
     - Minimum of children (only 'pushed' if ALL children 'pushed')?
     - Majority vote?
     - Custom rule (e.g., if 80%+ children 'pushed', Epic is 'ready')?

10. **Velocity Estimation**
    - Should estimated velocity be auto-calculated from child features' story points?
    - Or always manual input?
    - Should it drive AI guidance during feature breakdown (e.g., "break into 5 features @ 8pts each")?

---

## 9. Acceptance Criteria for Scoping Sign-Off

This brief is complete when Basher can confidently answer:

- [ ] **Hierarchy model:** Can explain Epic → Feature → PBI links and their ADO representation.
- [ ] **Data model:** EpicDraft type is finalized; any divergences from sketch documented.
- [ ] **Messages:** All WebviewRequest and ExtensionEvent types are defined; flow diagram drawn.
- [ ] **UI integration:** Wireframe for Dashboard Epic view signed off; component responsibility matrix clear.
- [ ] **Wizard structure:** 5-step flow validated or alternative proposed.
- [ ] **Settings:** Decision made on Epic-specific settings (Phase 1 scope vs future work).
- [ ] **Open questions:** All 10 questions resolved or explicitly deferred to implementation phase.
- [ ] **Dependencies:** Identified what Feature Creation refactoring (if any) is needed to unblock Epic Creation.

---

## 10. Success Metrics (Post-Implementation)

Once Epic Creation is built and integrated:

1. **Functional:** Users can create, edit, link, and push Epics to ADO in <3 minutes per Epic (including feature generation).
2. **Reliable:** No dropped links; all ADO Epic → Feature → PBI hierarchies accurately reflected.
3. **Discoverable:** Dashboard accordion shows Epics at top; "Create Epic" CTA visible on first use.
4. **Integrated:** Epic generation, Feature generation, and PBI generation chain together without manual intervention.
5. **Documented:** Architecture decision records stored in `.squad/decisions/` for future maintainers.

---

## 11. Next Steps

1. **Basher:** Review this brief, resolve open questions, and produce full architecture spec in `docs/architecture/epic-creation-architecture.md`.
2. **Basher + Danny:** Sync on wireframes; update Sidebar and App.tsx routing stub.
3. **Team:** Design Epic CRUD backend service + ADO API integration layer.
4. **Implementation:** Assign Feature Work Item Types to Epic Creation team, block on Feature Creation completion if needed.

---

**Document Version:** 1.0  
**Last Updated:** 2026-04-29  
**Status:** Ready for Architecture Spec Phase
