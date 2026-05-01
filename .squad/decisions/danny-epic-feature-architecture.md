# Decision: Epic → Feature → User Story Hierarchy Architecture

**Author:** Danny (Lead)  
**Date:** 2026-07-01  
**Status:** Proposed (awaiting team review)  
**Proposal:** `docs/architecture/epic-feature-story-hierarchy.md`

---

## Key Decisions Made

### 1. Separate Types (not PbiDraft extension)
`FeatureDraft` and `EpicDraft` are independent types. PbiDraft is already overloaded with bug/feature/story fields. Separate types enable cleaner validation and independent lifecycles.

### 2. ID-based Relationships (not inline)
Parent-child stored via ID references (`childUserStoryIds`, `featureIds`, `parentFeatureId`). Single source of truth, no duplication, enables independent editing in PBI Studio.

### 3. Feature Creation Replaces Bulk Breakdown
The `bulk` ViewId is repurposed: same route, new wizard component. Old `BulkBreakdownView` deprecated over 2 sprints.

### 4. High-Level Edit Only in Feature Wizard
Step 4 (Review) only allows title + effort editing. Detailed story editing redirects to PBI Studio. Enforces separation of concerns.

### 5. ADO Push Uses Hierarchy-Forward Links
Feature → Story relationship uses `System.LinkTypes.Hierarchy-Forward` (standard ADO parent-child). Re-push updates existing work items.

### 6. HierarchyStatus Includes 'partial'
New status `'partial'` covers the case where parent is pushed but some children aren't. Critical for UX feedback.

### 7. Nav Order: Epics & Features Between Dashboard and Projects
High-level planning view logically sits above detail work (Projects, Studio).

---

## Requires Input From

- **Linus:** Feasibility of multi-repo context assembly for AI prompts
- **Rusty:** TailwindCSS dashboard rendering approach, wizard step UX patterns
- **Team:** Open questions in proposal Section 9

---

## Blocking On

Nothing — this is a greenfield addition. All changes are additive to existing types.
