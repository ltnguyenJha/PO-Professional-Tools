# Decision: Feature Data Layer + ADO Push Implementation

**Author:** Linus (Backend Dev)  
**Date:** 2026-07-01  
**Status:** Implemented  
**Commit:** 78d5ee1  
**Branch:** feature/saul-tailwind-dashboard-redesign  

---

## Context

Phase 1 of the Epic→Feature→Story hierarchy implementation. Backend data layer and ADO push for FeatureDraft entities.

---

## Decisions Made

### 1. Work Item Types Are HARDCODED

- Parent Feature work item type = `"Feature"` — never user-configurable, never stored in settings
- Child PBI work item type = `"Product Backlog Item"` — never user-configurable
- This prevents misconfiguration and ensures ADO hierarchy integrity

### 2. Parent-Child ADO Link = `System.LinkTypes.Hierarchy-Reverse` on the PBI

The PBI holds the link pointing UP to its parent Feature (Hierarchy-Reverse), not the Feature pointing down. This matches ADO's expected pattern for work item creation (you can set the parent relation during PBI creation in a single PATCH).

### 3. Feature Drafts Persisted Separately in globalState

Key: `'featureDrafts'` in `context.globalState` — separate array from `pbiDrafts`. Rationale: FeatureDraft is a distinct type from PbiDraft (different fields, lifecycle, status model). ID-based cross-references (`childPbiIds` on Feature, `parentFeatureId` on PBI) maintain the relationship.

### 4. Child PBI workItemType Hardcoded in AI Generation Handler

When `handleGenerateUserStoriesFromFeature()` creates PbiDraft objects from AI output, it always sets `workItemType: 'Product Backlog Item'`. This is intentional — the Feature Creation flow always creates PBIs, never Tasks or User Stories via this route.

### 5. ADO Push: CREATE includes parent link in same request, UPDATE does not re-link

For new PBIs: the `System.LinkTypes.Hierarchy-Reverse` relation is included in the `createWorkItem` PATCH body (same request, no separate call). For existing PBIs (already have `adoWorkItemId`), we skip re-linking — the link already exists from the original push. This avoids duplicate links in ADO.

### 6. FEATURE_PUSH_PROGRESS emitted before AdoService call

Progress events are fired client-side before the actual API call. This provides UI feedback for large feature pushes (many children). The `progress/total` values give the webview enough to show a progress bar.

### 7. hierarchyStatus = 'partial' when any child fails

```typescript
hierarchyStatus = result.errors.length === 0 ? 'pushed' : 'partial'
```

'partial' means the feature itself was pushed but some children failed. The webview should display this distinctly from 'pushed' (all succeeded) or 'draft' (nothing pushed yet).

### 8. iterationLeafFromPath fallback to defaultIteration()

When creating AI-generated PbiDraft children, if no ADO iteration is configured, we fall back to `this.defaultIteration()` (e.g., "Jul Sprint 1") rather than letting the field be undefined. PbiDraft.iteration is a required string.

---

## Files Modified

| File | Change |
|------|--------|
| `src/shared/messages.ts` | HierarchyStatus, FeatureDraft, parentFeatureId on PbiDraft, featureDrafts on AppStatePayload, 5 WebviewRequest + 6 ExtensionEvent members |
| `webview-ui/src/types.ts` | Mirror of all above |
| `src/services/copilotService.ts` | generateUserStoriesFromFeature() method |
| `src/services/adoService.ts` | pushFeatureHierarchy() method |
| `src/panels/DashboardPanel.ts` | getFeatureDrafts(), saveFeatureDrafts(), postState() update, 5 handleMessage() cases, 5 handler methods |

---

## Non-Decisions (deferred)

- EpicDraft type and ADO push — Post-MVP per architecture doc
- Multi-repo context in AI generation — repoIds[0] used for now (first linked repo)
- Re-linking already-pushed PBIs to a different Feature — not handled; future enhancement
